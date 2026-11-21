export interface Scenario {
  id: string; name: string; place: string; hazard: "Cyclone" | "Flood" | "Landslide" | "Wildfire" | "Earthquake";
  lat: number; lon: number; needs: string; live?: boolean; note?: string;
}

/** What-if scenarios. Each asks: "if this hazard struck here in the next 24 h, are our satellites ready?" */
export const SCENARIOS: Scenario[] = [
  { id: "odisha-cyclone", name: "Cyclone landfall", place: "Odisha coast", hazard: "Cyclone", lat: 19.8, lon: 85.8,
    needs: "Cloud-penetrating radar imaging, weather tracking, and communication where towers fall." },
  { id: "assam-flood", name: "Brahmaputra floods", place: "Assam", hazard: "Flood", lat: 26.3, lon: 92.8,
    needs: "Radar imaging through monsoon cloud and repeat passes to map flood spread." },
  { id: "kerala-landslide", name: "Heavy-rain landslides", place: "Wayanad, Kerala", hazard: "Landslide", lat: 11.6, lon: 76.1,
    needs: "High-resolution optical imaging after the rain clears, plus emergency links." },
  { id: "uttarakhand-glof", name: "Glacial lake outburst", place: "Uttarakhand", hazard: "Flood", lat: 30.4, lon: 79.6,
    needs: "Frequent imaging of a remote mountain valley with no mobile coverage." },
  { id: "gujarat-cyclone", name: "Arabian Sea cyclone", place: "Saurashtra coast, Gujarat", hazard: "Cyclone", lat: 21.0, lon: 70.2,
    needs: "Ocean wind tracking, weather imaging and post-landfall damage mapping." },
  { id: "andaman-quake", name: "Island earthquake", place: "Andaman & Nicobar", hazard: "Earthquake", lat: 11.7, lon: 92.7,
    needs: "Satellite comms and navigation when the island's networks are down." },
];
