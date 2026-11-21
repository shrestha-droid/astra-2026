import type { Metadata } from "next";
import MissionControl from "@/components/MissionControl";

export const metadata: Metadata = { title: "Mission Control — SatGuard India" };

export default function MissionPage() {
  return <MissionControl />;
}
