# Crypto Price Agent

![Crypto Agent](./assets/NosanaBuildersChallengeAgents.jpg)

# Deployment
<img alt="Screenshot 2025-07-07 110335" src="https://github.com/user-attachments/assets/eec0a8a3-b185-46e9-8aca-66f06e6cc9ea" />


## Overview

The **Crypto Price Agent** is an intelligent AI assistant that provides real-time cryptocurrency price data, market analysis, and trading insights. Built using the Mastra framework, this agent leverages the CoinGecko API to deliver accurate, up-to-date information about any cryptocurrency.

## Features

### 🔍 Real-Time Price Data
- Current cryptocurrency prices in USD
- 24-hour price changes and percentage movements
- Market capitalization and trading volume
- Last updated timestamps

### 📊 Market Analysis
- Comprehensive market sentiment analysis
- Trend identification (Bullish/Bearish)
- Volatility assessment
- Risk evaluation
- Trading volume analysis

### 🛠️ Smart Tool Integration
- Intelligent cryptocurrency name/symbol recognition
- Automatic coin ID mapping via CoinGecko search
- Error handling and fallback mechanisms
- Detailed logging for debugging

### 🔄 Workflow Capabilities
- Multi-step analysis workflows
- Automated market insights generation
- Structured data processing
- Professional formatting with emojis and sections

## Architecture

The Crypto Price Agent consists of three main components:

### 1. Agent Definition (`your-agent.ts`)
```typescript
export const cryptoPriceAgent = new Agent({
  name: "Crypto Price Agent",
  instructions: "You are a cryptocurrency price assistant...",
  model,
  tools: { cryptoPriceTool },
});
```

**Key Features:**
- Strict instructions to always use the crypto price tool
- No price estimates or guesses from memory
- Comprehensive error handling
- Clear response formatting guidelines

### 2. Tool Implementation (`your-tool.ts`)
```typescript
export const cryptoPriceTool = createTool({
  id: "get-crypto-price",
  description: "REQUIRED tool for getting real-time cryptocurrency prices...",
  inputSchema: z.object({
    token: z.string().describe("Cryptocurrency name or symbol..."),
  }),
  outputSchema: z.object({
    name: z.string(),
    symbol: z.string(),
    currentPrice: z.number(),
    // ... more fields
  }),
  execute: async ({ context }) => {
    // Implementation
  },
});
```

**Tool Capabilities:**
- **Input Validation**: Accepts cryptocurrency names or symbols (case-insensitive)
- **API Integration**: Connects to CoinGecko API for real-time data
- **Smart Search**: Maps user input to correct CoinGecko coin IDs
- **Data Processing**: Formats and validates API responses
- **Error Handling**: Graceful handling of API failures and invalid inputs

### 3. Workflow System (`crypto-workflow.ts`)
```typescript
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
```

**Workflow Steps:**
1. **Fetch Crypto Price**: Retrieves current market data
2. **Analyze Market**: Generates comprehensive market analysis

## API Integration

### CoinGecko API Endpoints Used

1. **Search API**: `https://api.coingecko.com/api/v3/search`
   - Maps user input to CoinGecko coin IDs
   - Sorts results by market cap rank

2. **Simple Price API**: `https://api.coingecko.com/api/v3/simple/price`
   - Retrieves current price, volume, market cap, and changes
   - More reliable than complex endpoints

3. **Coin Info API**: `https://api.coingecko.com/api/v3/coins/{id}`
   - Gets detailed coin information (name, symbol)
   - Used for data validation and formatting

### Data Schema

```typescript
interface CryptoData {
  name: string;                    // Full cryptocurrency name
  symbol: string;                  // Trading symbol (e.g., BTC, ETH)
  currentPrice: number;           // Current price in USD
  priceChange24h: number;         // 24h price change in USD
  priceChangePercentage24h: number; // 24h percentage change
  marketCap: number;              // Market capitalization
  volume24h: number;              // 24h trading volume
  lastUpdated: string;            // ISO timestamp
}
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd agent-challenge
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your preferred LLM configuration:
   ```env
   # For local development with Ollama
   MODEL_NAME_AT_ENDPOINT=qwen2.5:1.5b
   API_BASE_URL=http://localhost:11434/v1
   
   # For Nosana endpoint
   MODEL_NAME_AT_ENDPOINT=qwen2.5:1.5b
   API_BASE_URL=https://dashboard.nosana.com/jobs/GPVMUckqjKR6FwqnxDeDRqbn34BH7gAa5xWnWuNH1drf
   ```

4. **Start the development server**:
   ```bash
   pnpm run dev
   ```

5. **Access the agent**:
   Open your browser and navigate to `http://localhost:8080`

### Local LLM Setup (Optional)

If you prefer to run your own LLM locally:

1. **Install Ollama**:
   ```bash
   # Follow instructions at https://ollama.com/download
   ```

2. **Start Ollama service**:
   ```bash
   ollama serve
   ```

3. **Pull and run the model**:
   ```bash
   ollama pull qwen2.5:1.5b
   ollama run qwen2.5:1.5b
   ```

### Cloud LLM Setup with OpenRouter (Alternative)

If running a local LLM is not possible or you prefer cloud-based solutions, you can use OpenRouter as a fallback API:

1. **Sign up for OpenRouter**:
   - Visit [OpenRouter](https://openrouter.ai/)
   - Create an account and get your API key
   - Start with free models (no payment required initially)

2. **Configure environment variables**:
   ```env
   # OpenRouter Configuration
   MODEL_NAME_AT_ENDPOINT=gpt-3.5-turbo
   API_BASE_URL=https://openrouter.ai/api/v1
   OPENAI_API_KEY=your_openrouter_api_key_here
   ```

3. **Free models available on OpenRouter**:
   - **Open Source Models**: `meta-llama/llama-2-70b-chat`, `microsoft/wizardlm-13b`
   - **Community Models**: Various free models from the community
   - **Trial Models**: Some models offer free trial periods
   - Check [OpenRouter Models](https://openrouter.ai/models) for current free options

5. **Benefits of OpenRouter**:
   - No local setup required
   - Access to multiple AI models
   - Free models available
   - High availability and reliability
   - Easy API integration

6. **Security considerations**:
   - Keep your API key secure
   - Use environment variables
   - Monitor usage for rate limits
   - Check model availability and restrictions

## Usage Examples

### Basic Price Queries

```
User: "What's the price of Bitcoin?"
Agent: [Calls cryptoPriceTool with "bitcoin"]
Response: Displays current price, 24h change, market cap, etc.

User: "How much is ETH worth?"
Agent: [Calls cryptoPriceTool with "ETH"]
Response: Shows Ethereum's current market data

User: "Price of Solana"
Agent: [Calls cryptoPriceTool with "solana"]
Response: Provides SOL's real-time information
```



### Supported Cryptocurrencies

The agent supports **any cryptocurrency** available on CoinGecko, including:

- **Major Cryptocurrencies**: Bitcoin (BTC), Ethereum (ETH), Solana (SOL)
- **Altcoins**: Dogecoin (DOGE), Cardano (ADA), Polkadot (DOT)
- **DeFi Tokens**: Uniswap (UNI), Aave (AAVE), Compound (COMP)
- **Meme Coins**: Shiba Inu (SHIB), Pepe (PEPE)
- **And thousands more...**

## Error Handling

The agent includes robust error handling for various scenarios:

### Invalid Cryptocurrency
```
User: "Price of INVALIDCOIN"
Agent: "Could not find a CoinGecko coin ID for 'INVALIDCOIN'. 
       Please check the name or symbol."
```

### API Failures
```
User: "What's the price of Bitcoin?"
Agent: "Error fetching crypto price for bitcoin: 
       Failed to fetch data. Please try again."
```

### Network Issues
- Automatic retry mechanisms
- Graceful degradation
- Clear error messages to users

## Testing

### Local Testing

1. **Start the development server**:
   ```bash
   pnpm run dev
   ```

2. **Test basic functionality**:
   - Navigate to `http://localhost:8080`
   - Try various cryptocurrency queries
   - Verify tool calls and responses
   - Test error scenarios

3. **Monitor console logs**:
   ```bash
   # Watch for tool execution logs
   [CRYPTO TOOL] Called with token: bitcoin
   [CRYPTO API] Fetching price for: bitcoin
   [CRYPTO API] Found coin ID: bitcoin for token: bitcoin
   [CRYPTO TOOL] Success for bitcoin: Bitcoin
   ```

### Docker Testing

1. **Build the container**:
   ```bash
   docker build -t yourusername/crypto-agent:latest .
   ```

2. **Run locally**:
   ```bash
   docker run -p 8080:8080 --env-file .env yourusername/crypto-agent:latest
   ```

3. **Test the containerized agent**:
   - Access `http://localhost:8080`
   - Verify all functionality works in containerized environment

## Deployment

### Docker Deployment

1. **Build and tag**:
   ```bash
   docker build -t yourusername/crypto-agent:latest .
   ```

2. **Login to Docker Hub**:
   ```bash
   docker login
   ```

3. **Push to registry**:
   ```bash
   docker push yourusername/crypto-agent:latest
   ```

### Nosana Deployment

1. **Update the job definition** (`nos_job_def/nosana_mastra.json`):
   ```json
   {
     "image": "docker.io/yourusername/crypto-agent:latest",
     "market": "nvidia-3060",
     "timeout": 30
   }
   ```

2. **Deploy using Nosana CLI**:
   ```bash
   nosana job post --file nosana_mastra.json --market nvidia-3060 --timeout 30
   ```

3. **Or deploy via Nosana Dashboard**:
   - Visit [Nosana Dashboard](https://dashboard.nosana.com/deploy)
   - Paste the job definition
   - Select appropriate GPU
   - Click Deploy

## Technical Details

### Dependencies

- **@mastra/core**: Mastra framework for agent and tool creation
- **zod**: Schema validation and type safety
- **fetch**: HTTP requests to CoinGecko API

### File Structure

```
src/mastra/agents/your-agent/
├── your-agent.ts          # Main agent definition
├── your-tool.ts           # Crypto price tool implementation
└── crypto-workflow.ts     # Multi-step workflow system
```

### Performance Considerations

- **API Rate Limiting**: CoinGecko API has rate limits
- **Caching**: Consider implementing caching for frequently requested coins
- **Error Recovery**: Graceful handling of API failures
- **Response Time**: Optimized for quick responses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Nosana Builders Challenge and follows the same license as the main repository.


---

**Built with ❤️ using Mastra and deployed on Nosana** 
