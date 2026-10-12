import type { Metadata } from "next";
import { CirculationPage } from "@/components/pages";

export const metadata: Metadata = { title: "Circulation" };

export default function CirculationRoute() {
  return <CirculationPage />;
}
