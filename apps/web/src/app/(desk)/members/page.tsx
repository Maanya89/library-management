import type { Metadata } from "next";
import { MembersPage } from "@/components/pages";

export const metadata: Metadata = { title: "Members" };

export default function MembersRoute() {
  return <MembersPage />;
}
