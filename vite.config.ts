import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [
        path.resolve(__dirname, "."),
        "./client",
        "./shared"
      ],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
      strict: false
    },
  },
  build: {
    outDir: "dist/spa",
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/monaco-editor')) return 'vendor_monaco';
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  },
  plugins: [react(), monacoCopyPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    global: 'globalThis'
  }
}));

function monacoCopyPlugin(): Plugin {
  return {
    name: 'copy-monaco-workers',
    apply: 'build',
    async buildStart() {
      // copy monaco-editor/esm to public/monaco-editor/esm for dev and to build output during build
      const srcEsm = path.resolve(process.cwd(), 'node_modules/monaco-editor/esm');
      const publicTargetEsm = path.resolve(process.cwd(), 'public', 'monaco-editor', 'esm');
      const outTargetEsm = path.resolve(process.cwd(), 'dist', 'spa', 'monaco-editor', 'esm');
      await copyIfExists(srcEsm, publicTargetEsm);
      // also copy the non-ESM 'min' build so embedded mode can use importScripts-compatible workers
      const srcMin = path.resolve(process.cwd(), 'node_modules/monaco-editor/min');
      const publicTargetMin = path.resolve(process.cwd(), 'public', 'monaco-editor', 'min');
      const outTargetMin = path.resolve(process.cwd(), 'dist', 'spa', 'monaco-editor', 'min');
      await copyIfExists(srcMin, publicTargetMin);
      // ensure outTarget will be copied on build end (in case build cleans outDir)
      try { await fs.promises.mkdir(path.dirname(outTargetEsm), { recursive: true }); } catch {}
      try { await fs.promises.mkdir(path.dirname(outTargetMin), { recursive: true }); } catch {}
      // defer final copy to closeBundle
    },
    async closeBundle() {
      const srcEsm = path.resolve(process.cwd(), 'node_modules/monaco-editor/esm');
      const outTargetEsm = path.resolve(process.cwd(), 'dist', 'spa', 'monaco-editor', 'esm');
      await copyIfExists(srcEsm, outTargetEsm);
      // copy min build as well
      const srcMin = path.resolve(process.cwd(), 'node_modules/monaco-editor/min');
      const outTargetMin = path.resolve(process.cwd(), 'dist', 'spa', 'monaco-editor', 'min');
      await copyIfExists(srcMin, outTargetMin);
    }
  };
}

async function copyIfExists(src: string, dest: string) {
  try {
    const stat = await fs.promises.stat(src).catch(() => null);
    if (!stat) return;
    // remove existing dest
    await fs.promises.rm(dest, { recursive: true, force: true }).catch(() => {});
    // prefer fs.cp if available
    if ((fs as any).promises && (fs as any).promises.cp) {
      await (fs as any).promises.cp(src, dest, { recursive: true });
    } else {
      // fallback: recursive copy
      await copyRecursive(src, dest);
    }
    console.log('Copied monaco-editor assets to', dest);
  } catch (e) {
    console.warn('Failed to copy monaco-editor assets', String(e));
  }
}

async function copyRecursive(src: string, dest: string) {
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  await fs.promises.mkdir(dest, { recursive: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}
