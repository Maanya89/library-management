import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shelfwise Library Desk",
    short_name: "Shelfwise",
    description: "A secure library management desk for books, members, and loans.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f1",
    theme_color: "#203c31",
    icons: [
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
