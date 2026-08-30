import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { XMLParser } from 'fast-xml-parser';

// Local Vite Dev Server Middleware for /api/flights
function localKacApiPlugin(): Plugin {
  return {
    name: 'local-kac-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/flights')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost:3000');
        const keyParam = urlObj.searchParams.get('key');
        const apiKey =
          process.env.KAC_API_KEY ||
          process.env.PUBLIC_DATA_PORTAL_KEY ||
          process.env.VITE_KAC_API_KEY ||
          keyParam ||
          '';

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        if (!apiKey) {
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              status: 'NO_API_KEY',
              message: 'KAC API Key is not configured. Falling back to simulation mode.',
              data: [],
            })
          );
          return;
        }

        try {
          const KAC_ENDPOINT = 'http://openapi.airport.co.kr/service/rest/FlightStatusList/getFlightStatusList';

          const fetchKac = async (ioType: 'O' | 'I') => {
            const targetUrl = new URL(KAC_ENDPOINT);
            targetUrl.searchParams.set('serviceKey', decodeURIComponent(apiKey));
            targetUrl.searchParams.set('schAirCode', 'CJU');
            targetUrl.searchParams.set('schLineType', 'D');
            targetUrl.searchParams.set('schIOType', ioType);
            targetUrl.searchParams.set('numOfRows', '100');
            targetUrl.searchParams.set('pageNo', '1');
            targetUrl.searchParams.set('_type', 'json');

            const kacRes = await fetch(targetUrl.toString(), {
              headers: { Accept: 'application/json, text/xml, */*' },
            });
            const text = await kacRes.text();
            try {
              const json = JSON.parse(text);
              const items = json?.response?.body?.items?.item;
              if (Array.isArray(items)) return items;
              if (items && typeof items === 'object') return [items];
              return [];
            } catch {
              const parser = new XMLParser({ ignoreAttributes: false });
              const parsed = parser.parse(text);
              const items = parsed?.response?.body?.items?.item;
              if (Array.isArray(items)) return items;
              if (items && typeof items === 'object') return [items];
              return [];
            }
          };

          const [depItems, arrItems] = await Promise.all([fetchKac('O'), fetchKac('I')]);
          const combined = [
            ...depItems.map((item: any) => ({ ...item, ioType: 'DEPARTURE' })),
            ...arrItems.map((item: any) => ({ ...item, ioType: 'ARRIVAL' })),
          ];

          res.statusCode = 200;
          res.end(
            JSON.stringify({
              status: 'SUCCESS',
              source: 'KAC_LIVE',
              updatedAt: new Date().toISOString(),
              totalCount: combined.length,
              data: combined,
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          res.end(
            JSON.stringify({
              status: 'ERROR',
              message: err.message,
              data: [],
            })
          );
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), localKacApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
