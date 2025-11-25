import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // El proxy solo es necesario cuando se corre el frontend independientemente
    // Cuando se usa netlify dev, Netlify maneja el enrutamiento automáticamente
    // Comentamos el proxy para evitar conflictos con Netlify Dev
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:8888",
    //     changeOrigin: true,
    //   },
    // },
  },
});

