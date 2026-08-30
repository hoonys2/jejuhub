import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { XMLParser } from 'fast-xml-parser';

const KAC_ENDPOINTS = [
  'http://openapi.airport.co.kr/service/rest/FlightStatusList/getFlightStatusList',
  'https://apis.data.go.kr/1613000/FlightStatusList/getFlightStatusList',
];

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
        const apiKey = (
          process.env.KAC_API_KEY ||
          process.env.kac_api_key ||
          process.env.PUBLIC_DATA_PORTAL_KEY ||
          process.env.SERVICE_KEY ||
          process.env.VITE_KAC_API_KEY ||
          keyParam ||
          ''
        ).trim();

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
          const fetchKacRobust = async (ioType: 'O' | 'I') => {
            const candidateKeys = [
              apiKey,
              decodeURIComponent(apiKey),
              encodeURIComponent(decodeURIComponent(apiKey)),
            ];
            const uniqueKeys = Array.from(new Set(candidateKeys));

            let lastError = '';

            for (const endpoint of KAC_ENDPOINTS) {
              for (const keyToTry of uniqueKeys) {
                const paramVariants = [
                  `serviceKey=${keyToTry}&schAirCode=CJU&schLineType=D&schIOType=${ioType}&numOfRows=100&pageNo=1`,
                  `serviceKey=${keyToTry}&schAirCode=CJU&schLineType=D&schIOType=${ioType}&numOfRows=100&pageNo=1&_type=json`,
                ];

                for (const params of paramVariants) {
                  try {
                    const fullUrl = `${endpoint}?${params}`;
                    const kacRes = await fetch(fullUrl, {
                      headers: { Accept: 'text/xml, application/xml, application/json, */*' },
                    });
                    const rawText = await kacRes.text();

                    if (!kacRes.ok) {
                      lastError = `HTTP ${kacRes.status} ${kacRes.statusText}`;
                      continue;
                    }

                    if (rawText.trim().startsWith('{')) {
                      try {
                        const json = JSON.parse(rawText);
                        const header = json?.response?.header;
                        if (header?.resultCode && header.resultCode !== '00' && header.resultCode !== '0') {
                          lastError = `[KAC ${header.resultCode}] ${header.resultMsg || 'API Error'}`;
                          continue;
                        }
                        const items = json?.response?.body?.items?.item;
                        if (Array.isArray(items)) return { items };
                        if (items && typeof items === 'object') return { items: [items] };
                        if (json?.response?.body?.items === '') return { items: [] };
                      } catch {
                        // ignore
                      }
                    }

                    if (rawText.trim().startsWith('<')) {
                      const parser = new XMLParser({ ignoreAttributes: false });
                      const parsed = parser.parse(rawText);

                      const cmmMsg = parsed?.OpenAPI_ServiceResponse?.cmmMsgHeader;
                      if (cmmMsg) {
                        lastError = `[공공데이터포털] ${cmmMsg.returnAuthMsg || cmmMsg.errMsg || '인증키 에러'}`;
                        continue;
                      }

                      const header = parsed?.response?.header;
                      if (header?.resultCode && header.resultCode !== '00' && header.resultCode !== 0 && header.resultCode !== '0') {
                        lastError = `[KAC ${header.resultCode}] ${header.resultMsg || 'API Error'}`;
                        continue;
                      }

                      const items = parsed?.response?.body?.items?.item;
                      if (Array.isArray(items)) return { items };
                      if (items && typeof items === 'object') return { items: [items] };
                      if (parsed?.response?.body?.items === '') return { items: [] };
                    }
                  } catch (e: any) {
                    lastError = e.message;
                  }
                }
              }
            }
            return { items: [], error: lastError };
          };

          const [depResult, arrResult] = await Promise.all([fetchKacRobust('O'), fetchKacRobust('I')]);

          if (depResult.error && arrResult.error) {
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                status: 'API_ERROR',
                message: depResult.error || arrResult.error,
                keyLength: apiKey.length,
                keyPrefix: apiKey.slice(0, 5) + '...',
                data: [],
              })
            );
            return;
          }

          const combined = [
            ...(depResult.items || []).map((item: any) => ({ ...item, ioType: 'DEPARTURE' })),
            ...(arrResult.items || []).map((item: any) => ({ ...item, ioType: 'ARRIVAL' })),
          ];

          res.statusCode = 200;
          res.end(
            JSON.stringify({
              status: 'SUCCESS',
              source: 'KAC_LIVE',
              updatedAt: new Date().toISOString(),
              totalCount: combined.length,
              keyLength: apiKey.length,
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
