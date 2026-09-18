import { defineConfig } from 'vite'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(import.meta.dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  // MapLibre and its worker are lazy-loaded as an isolated map chunk (~958 kB / ~251 kB gzip).
  // Keep the main UI bundle small while avoiding a misleading warning for the intentional map chunk.
  build: {
    chunkSizeWarningLimit: 1000,
  },

  // MapLibre ships its own module worker; Vite's dev pre-bundler must not rewrite it.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
