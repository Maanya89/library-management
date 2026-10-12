import type { Metadata } from "next";
import { BooksPage } from "@/components/pages";

export const metadata: Metadata = { title: "Books" };

export default function BooksRoute() {
  return <BooksPage />;
}
