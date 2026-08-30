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

const KAC_ENDPOINT = 'http://openapi.airport.co.kr/service/rest/FlightStatusList/getFlightStatusList';

export async function handler(event: HandlerEvent): Promise<HandlerResponse> {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=30', // 30s cache
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // 1. Get API Key from environment or request query
  const apiKey =
    process.env.KAC_API_KEY ||
    process.env.PUBLIC_DATA_PORTAL_KEY ||
    process.env.VITE_KAC_API_KEY ||
    event.queryStringParameters?.key ||
    '';

  if (!apiKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'NO_API_KEY',
        message: 'KAC API Key is not configured. Falling back to simulation mode.',
        data: [],
      }),
    };
  }

  try {
    // 2. Fetch Departures (schIOType: 'O') and Arrivals (schIOType: 'I') in parallel
    const [depItems, arrItems] = await Promise.all([
      fetchKacFlights(apiKey, 'CJU', 'O'),
      fetchKacFlights(apiKey, 'CJU', 'I'),
    ]);

    const combined = [
      ...depItems.map((item) => ({ ...item, ioType: 'DEPARTURE' })),
      ...arrItems.map((item) => ({ ...item, ioType: 'ARRIVAL' })),
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'SUCCESS',
        source: 'KAC_LIVE',
        updatedAt: new Date().toISOString(),
        totalCount: combined.length,
        data: combined,
      }),
    };
  } catch (error: any) {
    console.error('KAC API fetch error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'ERROR',
        message: error.message || 'Failed to fetch KAC flight data',
        data: [],
      }),
    };
  }
}

async function fetchKacFlights(serviceKey: string, airCode: string, ioType: 'O' | 'I'): Promise<any[]> {
  const url = new URL(KAC_ENDPOINT);
  url.searchParams.set('serviceKey', decodeURIComponent(serviceKey));
  url.searchParams.set('schAirCode', airCode);
  url.searchParams.set('schLineType', 'D'); // 국내선
  url.searchParams.set('schIOType', ioType);
  url.searchParams.set('numOfRows', '100');
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('_type', 'json');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json, text/xml, application/xml, */*',
      'User-Agent': 'JejuFlightHub/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`KAC API HTTP ${response.status}: ${response.statusText}`);
  }

  const rawText = await response.text();

  // Try JSON parse first
  try {
    const json = JSON.parse(rawText);
    const items = json?.response?.body?.items?.item;
    if (Array.isArray(items)) return items;
    if (items && typeof items === 'object') return [items];
    return [];
  } catch {
    // If not JSON, parse as XML
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(rawText);
    const items = parsed?.response?.body?.items?.item;
    if (Array.isArray(items)) return items;
    if (items && typeof items === 'object') return [items];
    return [];
  }
}
