import type { Metadata } from "next";
import { OverviewPage } from "@/components/pages";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewRoute() {
  return <OverviewPage />;
}
