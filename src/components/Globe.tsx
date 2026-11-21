/* eslint-disable react-hooks/immutability, react-hooks/refs --
   This file drives a three.js scene imperatively: typed arrays and scene objects are mutated every frame
   inside useFrame on purpose (React state would re-render 4,000+ points 60 times a second). */
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, Stars, useTexture } from "@react-three/drei";
import { MutableRefObject, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ConjEvent, FleetSat, Orbits, ROLE_META, RE, eciAt, elevationDeg, gmstAt, latLonToScene } from "@/lib/orbits";
import type { Scenario } from "@/lib/scenarios";
import type { Readiness } from "@/lib/readiness";

const R = RE / 1000;
const Y = new THREE.Vector3(0, 1, 0);

export interface GlobeProps {
  orbits: Orbits;
  simRef: MutableRefObject<number>;
  playingRef: MutableRefObject<boolean>;
  speedRef: MutableRefObject<number>;
  range: { start: number; end: number };
  onTick: (ms: number) => void;
  scenario: Scenario;
  readiness: Readiness | null;
  selectedSatId: number | null;
  onSelectSat: (id: number | null) => void;
  selectedEvent: ConjEvent | null;
  show: { debris: boolean; orbit: boolean; beams: boolean };
}

let spriteTex: THREE.CanvasTexture | null = null;
function sprite() {
  if (spriteTex) return spriteTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.7)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  spriteTex = new THREE.CanvasTexture(c);
  return spriteTex;
}

/** ECI km -> Earth-fixed scene units (Earth stays still, so we rotate positions by -GMST). */
function toWorld(p: { x: number; y: number; z: number }, g: number, out: THREE.Vector3) {
  out.set(p.x / 1000, p.z / 1000, -p.y / 1000).applyAxisAngle(Y, -g);
  return out;
}

function sunDirEci(ms: number) {
  const n = ms / 86400000 + 2440587.5 - 2451545.0;
  const rad = Math.PI / 180;
  const L = 280.46 + 0.9856474 * n, gm = (357.528 + 0.9856003 * n) * rad;
  const lam = (L + 1.915 * Math.sin(gm) + 0.02 * Math.sin(2 * gm)) * rad;
  const eps = (23.439 - 0.0000004 * n) * rad;
  const x = Math.cos(lam), y = Math.cos(eps) * Math.sin(lam), z = Math.sin(eps) * Math.sin(lam);
  return new THREE.Vector3(x, z, -y); // scene ECI frame
}

function Earth({ simRef }: { simRef: MutableRefObject<number> }) {
  const [day, lights] = useTexture([
    "/textures/earth_atmos_2048.jpg", "/textures/earth_lights_2048.png",
  ]);
  useMemo(() => { day.colorSpace = THREE.SRGBColorSpace; lights.colorSpace = THREE.SRGBColorSpace; day.anisotropy = 8; }, [day, lights]);
  const light = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const ms = simRef.current;
    const d = sunDirEci(ms).applyAxisAngle(Y, -gmstAt(ms)).multiplyScalar(60);
    light.current?.position.copy(d);
  });
  return (
    <group>
      <directionalLight ref={light} intensity={3.1} color="#fff4e6" />
      <ambientLight intensity={0.12} color="#8fb0ff" />
      <mesh>
        <sphereGeometry args={[R, 96, 96]} />
        <meshStandardMaterial map={day}
          roughness={0.92} metalness={0.02}
          emissiveMap={lights} emissive="#ffd9a0" emissiveIntensity={0.9} />
      </mesh>
      <mesh scale={1.07}>
        <sphereGeometry args={[R, 64, 64]} />
        <shaderMaterial transparent side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false}
          vertexShader={`varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
          fragmentShader={`varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.,0.,1.)), 3.0); gl_FragColor = vec4(0.32,0.58,1.0,1.0)*i*1.4; }`} />
      </mesh>
    </group>
  );
}

function Clock({ simRef, playingRef, speedRef, range, onTick }: Pick<GlobeProps, "simRef" | "playingRef" | "speedRef" | "range" | "onTick">) {
  const last = useRef(0);
  useFrame((_, dt) => {
    if (playingRef.current) {
      simRef.current += Math.min(dt, 0.1) * 1000 * speedRef.current;
      if (simRef.current > range.end) simRef.current = range.start;
    }
    last.current += dt;
    if (last.current > 0.25) { last.current = 0; onTick(simRef.current); }
  });
  return null;
}

function Fleet(props: GlobeProps) {
  const { orbits, simRef, selectedSatId, onSelectSat, readiness, scenario, show, selectedEvent } = props;
  const fleet = orbits.fleet;
  const geo = useRef<THREE.BufferGeometry>(null);
  const deb = useRef<THREE.BufferGeometry>(null);
  const beam = useRef<THREE.BufferGeometry>(null);
  const evGeo = useRef<THREE.BufferGeometry>(null);
  const selGroup = useRef<THREE.Group>(null);
  const evSat = useRef<THREE.Mesh>(null), evDeb = useRef<THREE.Mesh>(null);
  const lastDeb = useRef({ sim: -1, real: 0 });
  const v = useMemo(() => new THREE.Vector3(), []);
  const marker = useMemo(() => new THREE.Vector3(...latLonToScene(scenario.lat, scenario.lon, R * 1.003)), [scenario]);

  const colors = useMemo(() => {
    const a = new Float32Array(fleet.length * 3);
    fleet.forEach((f, i) => new THREE.Color(ROLE_META[f.role].color).toArray(a, i * 3));
    return a;
  }, [fleet]);
  const positions = useMemo(() => new Float32Array(fleet.length * 3), [fleet]);
  const debPos = useMemo(() => new Float32Array(orbits.debris.length * 3).fill(1e4), [orbits.debris]);
  const beamPos = useMemo(() => new Float32Array(80 * 2 * 3), []);
  const beamCol = useMemo(() => new Float32Array(80 * 2 * 3), []);
  const evPos = useMemo(() => new Float32Array(6), []);
  const satIndex = useMemo(() => new Map(fleet.map((f, i) => [f.id, i])), [fleet]);
  const helperIds = useMemo(() => new Set(readiness?.helpers.map((h) => h.sat.id)), [readiness]);
  useEffect(() => {
    // positions change every frame, so give raycasting a fixed, generous bounding sphere
    for (const g of [geo.current, deb.current]) if (g) g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
  }, [fleet]);

  useFrame(() => {
    const ms = simRef.current, g = gmstAt(ms);
    // fleet
    for (let i = 0; i < fleet.length; i++) {
      const p = eciAt(fleet[i].rec, ms);
      if (p) { toWorld(p, g, v); positions[i * 3] = v.x; positions[i * 3 + 1] = v.y; positions[i * 3 + 2] = v.z; }
    }
    if (geo.current) geo.current.attributes.position.needsUpdate = true;

    // debris (throttled)
    const now = performance.now();
    if (show.debris && (lastDeb.current.sim < 0 || (now - lastDeb.current.real > 160 && Math.abs(ms - lastDeb.current.sim) > 1000))) {
      lastDeb.current = { sim: ms, real: now };
      for (let i = 0; i < orbits.debris.length; i++) {
        const p = eciAt(orbits.debris[i].rec, ms);
        if (p) { toWorld(p, g, v); debPos[i * 3] = v.x; debPos[i * 3 + 1] = v.y; debPos[i * 3 + 2] = v.z; }
        else { debPos[i * 3] = 1e4; }
      }
      if (deb.current) deb.current.attributes.position.needsUpdate = true;
    }

    // beams: target -> every helper currently in view
    let n = 0;
    if (show.beams && readiness) {
      for (const h of readiness.helpers) {
        if (n >= 80) break;
        if (h.sat.role !== "eo" && h.sat.id !== selectedSatId) continue; // long beams to GEO satellites only when selected
        const i = satIndex.get(h.sat.id)!;
        const el = elevationDeg(h.sat.rec, ms, scenario.lat, scenario.lon);
        const min = h.sat.role === "eo" ? 45 : 10;
        if (el === null || el < min) continue;
        const c = new THREE.Color(h.status === "conflict" ? "#ff5d6c" : ROLE_META[h.sat.role].color);
        const base = n * 6;
        beamPos.set([marker.x, marker.y, marker.z, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]], base);
        beamCol.set([c.r, c.g, c.b, c.r, c.g, c.b], base);
        n++;
      }
    }
    if (beam.current) {
      beam.current.setDrawRange(0, n * 2);
      beam.current.attributes.position.needsUpdate = true;
      beam.current.attributes.color.needsUpdate = true;
    }

    // selected satellite label anchor
    if (selGroup.current) {
      const i = selectedSatId != null ? satIndex.get(selectedSatId) : undefined;
      selGroup.current.visible = i !== undefined;
      if (i !== undefined) selGroup.current.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    }

    // selected close-approach pair
    if (selectedEvent) {
      const s = orbits.fleet.find((f) => f.id === selectedEvent.satId), d = orbits.debris.find((x) => x.id === selectedEvent.debId);
      const a = s && eciAt(s.rec, ms), b = d && eciAt(d.rec, ms);
      if (a && b && evSat.current && evDeb.current) {
        toWorld(a, g, v); evSat.current.position.copy(v); evPos.set([v.x, v.y, v.z], 0);
        toWorld(b, g, v); evDeb.current.position.copy(v); evPos.set([v.x, v.y, v.z], 3);
        if (evGeo.current) evGeo.current.attributes.position.needsUpdate = true;
      }
    }
  });

  const sel = selectedSatId != null ? fleet.find((f) => f.id === selectedSatId) : undefined;
  return (
    <>
      <points
        frustumCulled={false}
        onClick={(e) => { e.stopPropagation(); if (e.index != null) onSelectSat(fleet[e.index].id); }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <bufferGeometry ref={geo}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.5} vertexColors map={sprite()} alphaMap={sprite()} transparent depthWrite={false} sizeAttenuation />
      </points>

      {show.debris && (
        <points raycast={() => null} frustumCulled={false}>
          <bufferGeometry ref={deb}>
            <bufferAttribute attach="attributes-position" args={[debPos, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.11} color="#c3cde6" map={sprite()} alphaMap={sprite()} transparent opacity={0.85} depthWrite={false} sizeAttenuation />
        </points>
      )}

      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={beam}>
          <bufferAttribute attach="attributes-position" args={[beamPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[beamCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.55} depthWrite={false} />
      </lineSegments>

      <group ref={selGroup} visible={false}>
        <mesh><ringGeometry args={[0.16, 0.19, 40]} /><meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} transparent opacity={0.9} /></mesh>
        <Html center distanceFactor={undefined} style={{ pointerEvents: "none" }} position={[0, 0.42, 0]}>
          <div className="whitespace-nowrap rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] tracking-wide text-white backdrop-blur">
            {sel?.name}
          </div>
        </Html>
      </group>

      {selectedEvent && (
        <>
          <mesh ref={evSat}><sphereGeometry args={[0.07, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
          <mesh ref={evDeb}><sphereGeometry args={[0.07, 16, 16]} /><meshBasicMaterial color="#ff5d6c" /></mesh>
          <lineSegments frustumCulled={false}>
            <bufferGeometry ref={evGeo}><bufferAttribute attach="attributes-position" args={[evPos, 3]} /></bufferGeometry>
            <lineBasicMaterial color="#ff5d6c" transparent opacity={0.9} />
          </lineSegments>
        </>
      )}
      <OrbitLine sat={sel} simRef={simRef} show={show.orbit} />
      <Marker scenario={scenario} pos={marker} unused={helperIds.size} />
    </>
  );
}

function OrbitLine({ sat, simRef, show }: { sat?: FleetSat; simRef: MutableRefObject<number>; show: boolean }) {
  const grp = useRef<THREE.Group>(null);
  const pts = useMemo(() => {
    if (!sat) return null;
    const mm = parseFloat(sat.l2.slice(52, 63)); // rev/day
    const period = (1440 / mm) * 60000;
    const t0 = simRef.current, out: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const p = eciAt(sat.rec, t0 + (i / 120) * period);
      if (p) out.push(new THREE.Vector3(p.x / 1000, p.z / 1000, -p.y / 1000));
    }
    return out.length > 3 ? out : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sat]);
  useFrame(() => { if (grp.current) grp.current.rotation.y = -gmstAt(simRef.current); });
  if (!show || !pts || !sat) return null;
  return (
    <group ref={grp}>
      <Line points={pts} color={ROLE_META[sat.role].color} lineWidth={1.4} transparent opacity={0.8} />
    </group>
  );
}

function Marker({ scenario, pos }: { scenario: Scenario; pos: THREE.Vector3; unused?: number }) {
  const g = useRef<THREE.Group>(null);
  const r1 = useRef<THREE.Mesh>(null), r2 = useRef<THREE.Mesh>(null);
  useEffect(() => { g.current?.lookAt(pos.clone().multiplyScalar(2)); }, [pos]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    [r1.current, r2.current].forEach((m, i) => {
      if (!m) return;
      const k = (t * 0.55 + i * 0.5) % 1;
      m.scale.setScalar(0.4 + k * 2.2);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.8;
    });
  });
  return (
    <group ref={g} position={pos}>
      <mesh><sphereGeometry args={[0.045, 16, 16]} /><meshBasicMaterial color="#ff8a3d" /></mesh>
      <mesh ref={r1}><ringGeometry args={[0.18, 0.2, 48]} /><meshBasicMaterial color="#ff8a3d" transparent side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh ref={r2}><ringGeometry args={[0.18, 0.2, 48]} /><meshBasicMaterial color="#ff8a3d" transparent side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <Html center position={[0, 0.0, 0.5]} style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap rounded-full border border-orange-400/40 bg-black/55 px-3 py-1 text-[11px] tracking-wide text-orange-200 backdrop-blur">
          {scenario.place}
        </div>
      </Html>
    </group>
  );
}

/** Eases the camera to look at the scenario whenever it changes. */
function CameraFly({ scenario }: { scenario: Scenario }) {
  const { camera } = useThree();
  const until = useRef(0);
  const target = useRef(new THREE.Vector3());
  useEffect(() => {
    const d = new THREE.Vector3(...latLonToScene(scenario.lat - 6, scenario.lon, 1)).normalize();
    target.current.copy(d);
    until.current = performance.now() + 1800;
  }, [scenario]);
  useFrame(() => {
    if (performance.now() > until.current) return;
    const len = camera.position.length();
    camera.position.lerp(target.current.clone().multiplyScalar(len), 0.07).setLength(len);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function Globe(props: GlobeProps) {
  const home = useMemo(() => new THREE.Vector3(...latLonToScene(props.scenario.lat - 6, props.scenario.lon, 1)).multiplyScalar(24), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Canvas
      camera={{ position: home.toArray(), fov: 38, near: 0.1, far: 1000 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      raycaster={{ params: { Points: { threshold: 0.22 } } as THREE.RaycasterParameters }}
      onPointerMissed={() => props.onSelectSat(null)}
    >
      <color attach="background" args={["#03050a"]} />
      <Suspense fallback={null}>
        <Stars radius={300} depth={80} count={5000} factor={5} saturation={0} fade speed={0.4} />
        <Earth simRef={props.simRef} />
        <Fleet {...props} />
        <Clock simRef={props.simRef} playingRef={props.playingRef} speedRef={props.speedRef} range={props.range} onTick={props.onTick} />
        <CameraFly scenario={props.scenario} />
      </Suspense>
      <OrbitControls enablePan={false} enableDamping dampingFactor={0.06} minDistance={9} maxDistance={45} rotateSpeed={0.6} zoomSpeed={0.7} />
    </Canvas>
  );
}
