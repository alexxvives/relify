import type { MetadataRoute } from "next";
import { landingCopy } from "@/lib/landing-copy";

/** S32: web app manifest so browsers and search engines get the full icon set. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Relify",
    short_name: "Relify",
    description: landingCopy.home.description,
    lang: "es",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#074750",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
