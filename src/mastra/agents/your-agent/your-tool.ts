import { createTool } from "@mastra/core/tools";
import { z } from "zod";

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

export const cryptoPriceTool = createTool({
	id: "get-crypto-price",
	description: "Get current cryptocurrency price and market data",
	inputSchema: z.object({
		token: z.string().describe("Cryptocurrency name or symbol (e.g., 'bitcoin', 'BTC', 'ethereum', 'ETH')"),
	}),
	outputSchema: z.object({
		name: z.string(),
		symbol: z.string(),
		currentPrice: z.number(),
		priceChange24h: z.number(),
		priceChangePercentage24h: z.number(),
		marketCap: z.number(),
		volume24h: z.number(),
		lastUpdated: z.string(),
	}),
	execute: async ({ context }) => {
		return await getCryptoPrice(context.token);
	},
});

const getCryptoPrice = async (token: string) => {
	const coinId = await getCoinGeckoId(token);
	if (!coinId) {
		throw new Error(`Could not find a CoinGecko coin ID for '${token}'. Please check the name or symbol.`);
	}
	
	// Use the simple price API which is more reliable
	const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true`;
	
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch data for ${token}. Please check if the token name/symbol is correct.`);
		}
		const data = (await response.json()) as SimplePriceResponse;
		
		if (!data[coinId]) {
			throw new Error(`No price data available for ${token}. The coin might not be actively traded.`);
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
	} catch (error) {
		throw new Error(`Error fetching crypto price for ${token}: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
};

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
