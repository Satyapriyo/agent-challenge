import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const cryptoDataSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  currentPrice: z.number(),
  priceChange24h: z.number(),
  priceChangePercentage24h: z.number(),
  marketCap: z.number(),
  volume24h: z.number(),
  lastUpdated: z.string(),
});

interface SimplePriceResponse {
  [id: string]: {
    usd: number;
    usd_24h_vol: number;
    usd_24h_change: number;
    usd_market_cap: number;
    last_updated_at: number;
  };
}

interface CoinSearchResult {
  coins: {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number;
  }[];
}

const fetchCryptoPrice = createStep({
  id: 'get-crypto-price',
  description: 'Fetches current cryptocurrency price and market data',
  inputSchema: z.object({
    token: z.string().describe('Cryptocurrency name or symbol (e.g., "bitcoin", "BTC", "ethereum", "ETH")'),
  }),
  outputSchema: cryptoDataSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const coinId = await getCoinGeckoId(inputData.token);
    if (!coinId) {
      throw new Error(`Could not find a CoinGecko coin ID for '${inputData.token}'. Please check the name or symbol.`);
    }

    // Use the simple price API which is more reliable
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${inputData.token}. Please check if the token name/symbol is correct.`);
    }

    const data = (await response.json()) as SimplePriceResponse;

    if (!data[coinId]) {
      throw new Error(`No price data available for ${inputData.token}. The coin might not be actively traded.`);
    }

    const priceData = data[coinId];

    // Get the coin name from the search result
    const coinInfo = await getCoinInfo(coinId);

    return {
      name: coinInfo.name,
      symbol: coinInfo.symbol.toUpperCase(),
      currentPrice: priceData.usd,
      priceChange24h: priceData.usd_24h_change,
      priceChangePercentage24h: priceData.usd_24h_change,
      marketCap: priceData.usd_market_cap,
      volume24h: priceData.usd_24h_vol,
      lastUpdated: new Date(priceData.last_updated_at * 1000).toISOString(),
    };
  },
});

const analyzeMarket = createStep({
  id: 'analyze-market',
  description: 'Provides market analysis and insights based on crypto price data',
  inputSchema: cryptoDataSchema,
  outputSchema: z.object({
    analysis: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const cryptoData = inputData;

    if (!cryptoData) {
      throw new Error('Crypto data not found');
    }

    const agent = mastra?.getAgent('cryptoPriceAgent');
    if (!agent) {
      throw new Error('Crypto price agent not found');
    }

    const prompt = `Based on the following cryptocurrency data for ${cryptoData.name} (${cryptoData.symbol}), provide a comprehensive market analysis:

      ${JSON.stringify(cryptoData, null, 2)}

      Structure your response exactly as follows:

      💰 ${cryptoData.name.toUpperCase()} (${cryptoData.symbol}) MARKET ANALYSIS
      ════════════════════════════════════════════════════════════════════════════

      📊 CURRENT PRICE DATA
      • Current Price: $${cryptoData.currentPrice.toLocaleString()}
      • 24h Change: ${cryptoData.priceChange24h >= 0 ? '+' : ''}${cryptoData.priceChange24h.toFixed(2)}% ($${cryptoData.priceChange24h.toLocaleString()})
      • Market Cap: $${cryptoData.marketCap.toLocaleString()}
      • 24h Volume: $${cryptoData.volume24h.toLocaleString()}
      • Last Updated: ${new Date(cryptoData.lastUpdated).toLocaleString()}

      📈 MARKET SENTIMENT
      • Trend: ${cryptoData.priceChangePercentage24h >= 0 ? '🟢 Bullish' : '🔴 Bearish'}
      • Momentum: ${Math.abs(cryptoData.priceChangePercentage24h) > 5 ? 'Strong' : Math.abs(cryptoData.priceChangePercentage24h) > 2 ? 'Moderate' : 'Weak'}
      • Volatility: ${Math.abs(cryptoData.priceChangePercentage24h) > 10 ? 'High' : Math.abs(cryptoData.priceChangePercentage24h) > 5 ? 'Medium' : 'Low'}

      💡 KEY INSIGHTS
      • ${cryptoData.priceChangePercentage24h >= 0 ? 'Positive' : 'Negative'} price movement indicates ${cryptoData.priceChangePercentage24h >= 0 ? 'increasing' : 'decreasing'} market confidence
      • ${cryptoData.volume24h > cryptoData.marketCap * 0.1 ? 'High' : 'Moderate'} trading volume suggests ${cryptoData.volume24h > cryptoData.marketCap * 0.1 ? 'strong' : 'moderate'} market participation
      • Market cap ranking and volume analysis suggest ${cryptoData.marketCap > 10000000000 ? 'major' : cryptoData.marketCap > 1000000000 ? 'mid-tier' : 'smaller'} cryptocurrency status

      ⚠️ RISK ASSESSMENT
      • ${Math.abs(cryptoData.priceChangePercentage24h) > 10 ? 'High' : Math.abs(cryptoData.priceChangePercentage24h) > 5 ? 'Moderate' : 'Low'} volatility indicates ${Math.abs(cryptoData.priceChangePercentage24h) > 10 ? 'significant' : Math.abs(cryptoData.priceChangePercentage24h) > 5 ? 'moderate' : 'minimal'} price risk
      • ${cryptoData.volume24h > cryptoData.marketCap * 0.2 ? 'Very high' : cryptoData.volume24h > cryptoData.marketCap * 0.1 ? 'High' : 'Moderate'} trading volume suggests ${cryptoData.volume24h > cryptoData.marketCap * 0.2 ? 'potential' : cryptoData.volume24h > cryptoData.marketCap * 0.1 ? 'moderate' : 'lower'} liquidity risk

      🎯 MARKET OUTLOOK
      • Short-term (24-48h): ${cryptoData.priceChangePercentage24h >= 0 ? 'Likely to continue positive momentum' : 'May see continued downward pressure'}
      • Medium-term (1-2 weeks): ${cryptoData.priceChangePercentage24h >= 0 ? 'Bullish trend could persist' : 'Bearish sentiment may continue'}
      • Key levels to watch: Support at $${(cryptoData.currentPrice * 0.95).toFixed(2)}, Resistance at $${(cryptoData.currentPrice * 1.05).toFixed(2)}

      Guidelines:
      - Keep analysis factual and data-driven
      - Avoid making specific price predictions
      - Focus on market dynamics and sentiment
      - Consider volume, market cap, and price action
      - Maintain professional tone throughout
      - Use the exact formatting with emojis and sections as shown`;

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let analysisText = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      analysisText += chunk;
    }

    return {
      analysis: analysisText,
    };
  },
});

// Helper to get coin info (name and symbol)
const getCoinInfo = async (coinId: string): Promise<{ name: string; symbol: string }> => {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;
  const response = await fetch(url);
  if (!response.ok) {
    return { name: coinId, symbol: coinId.toUpperCase() };
  }
  const data = await response.json();
  return {
    name: data.name || coinId,
    symbol: data.symbol || coinId.toUpperCase(),
  };
};

// Helper to map user input to CoinGecko coin ID using search API
const getCoinGeckoId = async (token: string): Promise<string | null> => {
  const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(token)}`;
  const response = await fetch(searchUrl);
  if (!response.ok) return null;
  const searchResult = (await response.json()) as CoinSearchResult;

  if (!searchResult.coins || searchResult.coins.length === 0) {
    return null;
  }

  // Sort by market cap rank to get the most popular coin first
  const sortedCoins = searchResult.coins.sort((a, b) => {
    // Handle cases where market_cap_rank might be null
    const rankA = a.market_cap_rank || 999999;
    const rankB = b.market_cap_rank || 999999;
    return rankA - rankB;
  });

  // Return the coin with the highest market cap rank (lowest number)
  return sortedCoins[0].id;
};

const cryptoWorkflow = createWorkflow({
  id: 'crypto-workflow',
  inputSchema: z.object({
    token: z.string().describe('Cryptocurrency name or symbol to analyze'),
  }),
  outputSchema: z.object({
    analysis: z.string(),
  }),
})
  .then(fetchCryptoPrice)
  .then(analyzeMarket);

cryptoWorkflow.commit();

export { cryptoWorkflow }; 