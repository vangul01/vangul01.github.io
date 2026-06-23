// @ts-check
import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://www.vangular.com",

  adapter: netlify(),

  // for cart island
  integrations: [react()],

  // Image optimization
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
    domains: ["cdn.sanity.io"],
  },

  // To whitelist ngrok domain
  vite: {
    server: {
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        "raccoon-allowed-wahoo.ngrok-free.app",
      ],
    },
  },
});
