import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PrintShare",
    short_name: "PrintShare",
    description:
      "Propojení zákazníků s místními 3D tiskaři — model, mapa, chat.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f97316",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "651x712",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
