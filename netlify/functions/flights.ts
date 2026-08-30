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

// Support both standard KAC and Data.go.kr Gateway URLs
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

  // Check all possible environment variable variations
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
        envChecked: ['KAC_API_KEY', 'PUBLIC_DATA_PORTAL_KEY', 'SERVICE_KEY'],
        data: [],
      }),
    };
  }

  try {
    // Parallel fetch for departures (O) and arrivals (I)
    const [depResult, arrResult] = await Promise.all([
      fetchKacWithFallbacks(apiKey, 'CJU', 'O'),
      fetchKacWithFallbacks(apiKey, 'CJU', 'I'),
    ]);

    // Check for auth or gateway errors from KAC
    if (depResult.error && arrResult.error) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'API_ERROR',
          message: depResult.error || arrResult.error,
          keyLength: apiKey.length,
          keyPrefix: apiKey.slice(0, 5) + '...',
          data: [],
        }),
      };
    }

    const combined = [
      ...(depResult.items || []).map((item: any) => ({ ...item, ioType: 'DEPARTURE' })),
      ...(arrResult.items || []).map((item: any) => ({ ...item, ioType: 'ARRIVAL' })),
    ];

    if (combined.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'NO_DATA',
          message: depResult.error || arrResult.error || 'No flight data returned for today.',
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
}

// Fetch with smart key formatting (Raw vs Decoded vs Encoded)
async function fetchKacWithFallbacks(apiKey: string, airCode: string, ioType: 'O' | 'I'): Promise<KacFetchResult> {
  let cleanKey = apiKey.trim();

  // Try calling endpoint with given key
  // Public data portal keys with '+', '/', '=' often get corrupted if re-encoded.
  // We test the raw key, and if decoded, the encoded version.
  const candidateKeys = [
    cleanKey,
    decodeURIComponent(cleanKey),
    encodeURIComponent(decodeURIComponent(cleanKey)),
  ];
  const uniqueKeys = Array.from(new Set(candidateKeys));

  let lastError = '';

  for (const endpoint of KAC_ENDPOINTS) {
    for (const keyToTry of uniqueKeys) {
      try {
        const query = `serviceKey=${encodeURIComponent(decodeURIComponent(keyToTry))}&schAirCode=${airCode}&schLineType=D&schIOType=${ioType}&numOfRows=100&pageNo=1&_type=json`;
        const fullUrl = `${endpoint}?${query}`;

        const res = await fetch(fullUrl, {
          headers: {
            Accept: 'application/json, text/xml, application/xml, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!res.ok) {
          lastError = `HTTP ${res.status} ${res.statusText}`;
          continue;
        }

        const rawText = await res.text();

        // 1. Try parsing JSON
        try {
          const json = JSON.parse(rawText);
          const header = json?.response?.header;
          const resultCode = header?.resultCode;
          const resultMsg = header?.resultMsg;

          if (resultCode && resultCode !== '00' && resultCode !== '0') {
            lastError = `[KAC ${resultCode}] ${resultMsg || 'API Error'}`;
            // If it's auth error, try next candidate key
            continue;
          }

          const items = json?.response?.body?.items?.item;
          if (Array.isArray(items)) return { items };
          if (items && typeof items === 'object') return { items: [items] };
          return { items: [] };
        } catch {
          // 2. Try parsing XML
          const parser = new XMLParser({ ignoreAttributes: false });
          const parsed = parser.parse(rawText);

          // Check OpenData portal error XML format: <OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>...
          const cmmMsg = parsed?.OpenAPI_ServiceResponse?.cmmMsgHeader;
          if (cmmMsg) {
            const returnAuthMsg = cmmMsg.returnAuthMsg || cmmMsg.errMsg || '인증키 에러';
            lastError = `[공공데이터포털] ${returnAuthMsg} (포털 승인 후 1~2시간 동기화 대기가 필요할 수 있습니다)`;
            continue;
          }

          const header = parsed?.response?.header;
          const resultCode = header?.resultCode;
          const resultMsg = header?.resultMsg;

          if (resultCode && resultCode !== '00' && resultCode !== 0) {
            lastError = `[KAC ${resultCode}] ${resultMsg || 'API Error'}`;
            continue;
          }

          const items = parsed?.response?.body?.items?.item;
          if (Array.isArray(items)) return { items };
          if (items && typeof items === 'object') return { items: [items] };
          return { items: [] };
        }
      } catch (err: any) {
        lastError = err.message || '네트워크 요청 실패';
      }
    }
  }

  return { items: [], error: lastError };
}
