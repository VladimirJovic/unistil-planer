import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// ─────────────────────────────────────────────────────────────
// GitHub Pages host-uje pod subpath-om /unistil-planer/.
// Tokom `build` koristimo taj base; lokalni `dev` ide na '/'.
// ─────────────────────────────────────────────────────────────
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/unistil-planer/' : '/',
  plugins: [react(), tailwindcss()],
}))
