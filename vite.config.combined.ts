import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Configuration pour le build client
const clientConfig = {
  build: {
    outDir: 'dist/spa',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/monaco-editor')) return 'vendor_monaco';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  plugins: [react()],
};

// Configuration pour le build serveur
const serverConfig = {
  build: {
    outDir: 'dist/server',
    ssr: true,
    ssrEmitAssets: true,
    emptyOutDir: true,
    rollupOptions: {
      input: 'server/node-build.ts',
      output: {
        format: 'esm',
        entryFileNames: 'server.js',
        inlineDynamicImports: true
      },
      external: [
        'fs', 'path', 'url', 'http', 'https', 'os', 'crypto', 'stream', 'util', 'events', 'buffer', 'querystring',
        'zod', 'express', 'cors', 'dotenv', 'node-fetch', 'openai', 'axios', 'genius-lyrics', 'spotify-web-api-node',
        'pdfkit', 'docx', 'jszip', 'nodemailer', 'deepai', 'fs-extra', 'path-to-regexp', '@google/generative-ai',
        '@mailchimp/mailchimp_transactional', 'highlight.js', 'node:module', 'node:fs', 'node:path', 'node:url',
        'node:http', 'node:https', 'node:os', 'node:crypto', 'node:stream', 'node:util', 'node:events', 'node:buffer',
        'node:querystring'
      ],
    },
  },
  ssr: {
    noExternal: true
  }
};

export default defineConfig(({ command, mode, ssrBuild }) => {
  if (ssrBuild) {
    return serverConfig;
  } else {
    return clientConfig;
  }
});
