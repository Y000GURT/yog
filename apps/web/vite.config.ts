import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    AutoImport({
      imports: ['react'],
      dts: 'src/auto-imports.d.ts',
    }),
    react()
  ],
})
