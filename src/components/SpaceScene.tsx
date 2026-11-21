"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/** Layered starfield with depth-fog so distant stars dissolve like haze between trees. */
function Stars({ count = 5000 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const warm = new THREE.Color("#ffb27a");
    const cool = new THREE.Color("#9cb8ff");
    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 60;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      positions.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th) * 0.6, r * Math.cos(ph)], i * 3);
      const c = warm.clone().lerp(cool, Math.random());
      colors.set([c.r, c.g, c.b], i * 3);
    }
    return { positions, colors };
  }, [count]);

  const sprite = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.3, "rgba(255,255,255,0.5)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.22} map={sprite} alphaMap={sprite} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Soft nebula: fbm noise shader on a big backdrop plane. */
function Nebula() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt * 0.04;
  });
  return (
    <mesh position={[0, 0, -40]} scale={[140, 80, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`
          varying vec2 vUv; uniform float uTime;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
          float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
            return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
          float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.02; a*=.5; } return v; }
          void main(){
            vec2 p = vUv * 3.0;
            float f = fbm(p + vec2(uTime, -uTime*.6) + fbm(p*1.7 - uTime));
            vec3 deep = vec3(0.015,0.02,0.05);
            vec3 cool = vec3(0.18,0.28,0.62);
            vec3 warm = vec3(1.0,0.45,0.15);
            vec3 col = mix(deep, cool, smoothstep(.35,.85,f));
            col += warm * smoothstep(.62,.95,fbm(p*1.3 + 7.0)) * .35;
            float vig = smoothstep(1.05, .2, length(vUv-.5)*1.5);
            gl_FragColor = vec4(col, vig * .85);
          }`}
      />
    </mesh>
  );
}

/** Gentle camera parallax from the pointer. */
function Rig() {
  useFrame(({ camera, pointer }, dt) => {
    camera.position.x += (pointer.x * 1.2 - camera.position.x) * Math.min(1, dt * 1.5);
    camera.position.y += (pointer.y * 0.7 - camera.position.y) * Math.min(1, dt * 1.5);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SpaceScene() {
  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      <Canvas camera={{ position: [0, 0, 14], fov: 55 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <fog attach="fog" args={["#04060b", 20, 75]} />
        <Nebula />
        <Stars />
        <Rig />
      </Canvas>
    </div>
  );
}
