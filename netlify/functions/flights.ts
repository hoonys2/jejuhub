import { XMLParser } from 'fast-xml-parser';

interface HandlerEvent {
  queryStringParameters?: Record<string, string>;
  httpMethod: string;
}

interface HandlerResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

// Candidate endpoints for KAC Flight Status
const KAC_ENDPOINTS = [
  'http://openapi.airport.co.kr/service/rest/FlightStatusList/getFlightStatusList',
  'https://apis.data.go.kr/1613000/FlightStatusList/getFlightStatusList',
];

export async function handler(event: HandlerEvent): Promise<HandlerResponse> {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=15', // 15s cache
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Get API Key
  const apiKey = (
    process.env.KAC_API_KEY ||
    process.env.kac_api_key ||
    process.env.PUBLIC_DATA_PORTAL_KEY ||
    process.env.PUBLIC_DATA_KEY ||
    process.env.SERVICE_KEY ||
    process.env.serviceKey ||
    process.env.VITE_KAC_API_KEY ||
    event.queryStringParameters?.key ||
    ''
  ).trim();

  if (!apiKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'NO_API_KEY',
        message: 'KAC API Key is not configured. Please set KAC_API_KEY in Netlify or enter in the UI.',
        data: [],
      }),
    };
  }

  try {
    // Parallel fetch for departures (O) and arrivals (I)
    const [depResult, arrResult] = await Promise.all([
      fetchKacRobust(apiKey, 'CJU', 'O'),
      fetchKacRobust(apiKey, 'CJU', 'I'),
    ]);

    const depItems = depResult.items || [];
    const arrItems = arrResult.items || [];
    const combined = [
      ...depItems.map((item: any) => ({ ...item, ioType: 'DEPARTURE' })),
      ...arrItems.map((item: any) => ({ ...item, ioType: 'ARRIVAL' })),
    ];

    if (combined.length === 0) {
      const errorMsg = depResult.error || arrResult.error || '운항 데이터를 가져오지 못했습니다.';
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'API_ERROR',
          message: errorMsg,
          keyLength: apiKey.length,
          keyPrefix: apiKey.slice(0, 5) + '...',
          debug: {
            depError: depResult.error,
            arrError: arrResult.error,
            depRaw: depResult.rawSample,
          },
          data: [],
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'SUCCESS',
        source: 'KAC_LIVE',
        updatedAt: new Date().toISOString(),
        totalCount: combined.length,
        keyLength: apiKey.length,
        data: combined,
      }),
    };
  } catch (error: any) {
    console.error('KAC API handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'ERROR',
        message: error.message || 'Internal server error while fetching flight data',
        data: [],
      }),
    };
  }
}

interface KacFetchResult {
  items: any[];
  error?: string;
  rawSample?: string;
}

async function fetchKacRobust(apiKey: string, airCode: string, ioType: 'O' | 'I'): Promise<KacFetchResult> {
  const cleanKey = apiKey.trim();

  // Try different key representations (Raw vs Decoded vs Encoded)
  // Public data portal keys can be sensitive to encoding.
  const candidateKeys = [
    cleanKey, // Raw as-is
    decodeURIComponent(cleanKey), // Decoded
    encodeURIComponent(decodeURIComponent(cleanKey)), // Re-encoded
  ];
  const uniqueKeys = Array.from(new Set(candidateKeys));

  let lastError = '';
  let lastRaw = '';

  for (const endpoint of KAC_ENDPOINTS) {
    for (const keyToTry of uniqueKeys) {
      // 1. First try standard XML request (NO _type=json, as _type=json causes 400 Bad Request on some KAC endpoints)
      // 2. Then try with _type=json
      const paramVariants = [
        `serviceKey=${keyToTry}&schAirCode=${airCode}&schLineType=D&schIOType=${ioType}&numOfRows=100&pageNo=1`,
        `serviceKey=${keyToTry}&schAirCode=${airCode}&schLineType=D&schIOType=${ioType}&numOfRows=100&pageNo=1&_type=json`,
      ];

      for (const params of paramVariants) {
        try {
          const fullUrl = `${endpoint}?${params}`;
          const res = await fetch(fullUrl, {
            headers: {
              Accept: 'text/xml, application/xml, application/json, */*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });

          const rawText = await res.text();
          lastRaw = rawText.slice(0, 300);

          if (!res.ok) {
            lastError = `HTTP ${res.status} ${res.statusText}`;
            continue;
          }

          // Case A: JSON response
          if (rawText.trim().startsWith('{')) {
            try {
              const json = JSON.parse(rawText);
              const header = json?.response?.header;
              const resultCode = header?.resultCode;
              const resultMsg = header?.resultMsg;

              if (resultCode && resultCode !== '00' && resultCode !== '0') {
                lastError = `[KAC ${resultCode}] ${resultMsg || 'API Error'}`;
                continue;
              }

              const items = json?.response?.body?.items?.item;
              if (Array.isArray(items)) return { items };
              if (items && typeof items === 'object') return { items: [items] };
              if (json?.response?.body?.items === '') return { items: [] };
            } catch (jsonErr: any) {
              lastError = jsonErr.message;
            }
          }

          // Case B: XML response (Standard Data.go.kr response)
          if (rawText.trim().startsWith('<')) {
            const parser = new XMLParser({ ignoreAttributes: false });
            const parsed = parser.parse(rawText);

            // Check portal error header
            const cmmMsg = parsed?.OpenAPI_ServiceResponse?.cmmMsgHeader;
            if (cmmMsg) {
              const returnAuthMsg = cmmMsg.returnAuthMsg || cmmMsg.errMsg || '인증키 에러';
              lastError = `[공공데이터포털] ${returnAuthMsg} (포털 승인 후 1~2시간 동기화 대기가 필요할 수 있습니다)`;
              continue;
            }

            const header = parsed?.response?.header;
            const resultCode = header?.resultCode;
            const resultMsg = header?.resultMsg;

            if (resultCode && resultCode !== '00' && resultCode !== 0 && resultCode !== '0') {
              lastError = `[KAC ${resultCode}] ${resultMsg || 'API Error'}`;
              continue;
            }

            const items = parsed?.response?.body?.items?.item;
            if (Array.isArray(items)) return { items };
            if (items && typeof items === 'object') return { items: [items] };
            if (parsed?.response?.body?.items === '') return { items: [] };
          }
        } catch (fetchErr: any) {
          lastError = fetchErr.message || '네트워크 요청 실패';
        }
      }
    }
  }

  return { items: [], error: lastError, rawSample: lastRaw };
}
