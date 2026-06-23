/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This project's directory is reached through a Windows junction, so the
// launch working directory and the real path can differ. Vite/Vitest resolve
// some paths against the real path and others against the working directory,
// which breaks module loading when they disagree. Normalize the working
// directory to the config's real location up front so everything is consistent
// no matter where `npm test`/`npm run dev` is launched from.
const rootDir = fileURLToPath(new URL('.', import.meta.url))
if (process.cwd() !== rootDir.replace(/[\\/]$/, '')) {
  try {
    process.chdir(rootDir)
  } catch {
    // best-effort; if chdir fails we fall back to explicit root config below
  }
}
const setupPath = fileURLToPath(new URL('./src/test/setup.ts', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // The project root is reached through a Windows junction, so the real path
    // differs from the working directory. Don't follow the symlink, otherwise
    // Vite/Vitest resolves files against a path it can't serve.
    preserveSymlinks: true,
  },
  test: {
    root: rootDir,
    globals: true,
    environment: 'jsdom',
    setupFiles: setupPath,
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
    },
  },
})
