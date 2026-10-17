import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// When you add the Express backend, uncomment the proxy so /api calls reach it.
export default defineConfig({
  plugins: [react()],
  // server: { proxy: { "/api": "http://localhost:5000" } },
});
