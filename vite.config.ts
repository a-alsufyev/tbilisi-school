import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-routes',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/schools') {
              const filePath = path.join(process.cwd(), "data", "schools.csv");
              try {
                if (!fs.existsSync(filePath)) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: "Schools file not found" }));
                  return;
                }
                const data = fs.readFileSync(filePath, "utf-8");
                const lines = data.split("\n").filter((line) => line.trim() !== "");
                const schools = lines.slice(1).map((line, index) => {
                  const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
                  if (!matches) return null;
                  const [name, address, coordinates, languages, cost, program, comment] = matches.map(s => s.replace(/^"|"$/g, '').trim());
                  return { id: index, name, address, coordinates, languages, cost, program, comment };
                }).filter(s => s !== null);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(schools));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Internal server error" }));
              }
              return;
            }
            if (req.url === '/api/config') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ yandexMapsApiKey: env.YANDEX_MAPS_API_KEY || "" }));
              return;
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
