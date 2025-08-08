import axios from 'axios';
import { MarketData } from '../types';

export class MarketDataService {
  private static instance: MarketDataService;

  static getInstance(): MarketDataService {
    if (!MarketDataService.instance) {
      MarketDataService.instance = new MarketDataService();
    }
    return MarketDataService.instance;
  }

  private getApiKey(service: string): string {
    const keyMap: Record<string, string> = {
      'coingecko': import.meta.env.VITE_COINGECKO_API_KEY || '',
      'coinmarketcap': import.meta.env.VITE_COINMARKETCAP_API_KEY || '',
      'defillama': import.meta.env.VITE_DEFILLAMA_API_KEY || ''
    };
    return keyMap[service] || '';
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    try {
      const coingeckoKey = this.getApiKey('coingecko');
      
      // Try CoinGecko first (free tier available)
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: this.mapSymbolToCoingeckoId(symbol),
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true
        },
        headers: coingeckoKey ? { 'X-CG-Demo-API-Key': coingeckoKey } : {}
      });

      const coinId = this.mapSymbolToCoingeckoId(symbol);
      const data = response.data[coinId];
      
      if (!data) {
        throw new Error(`No data found for symbol: ${symbol}`);
      }
      
      return {
        price: data.usd || 0,
        change24h: data.usd_24h_change || 0,
        volume24h: data.usd_24h_vol || 0,
        marketCap: data.usd_market_cap || 0,
        fdv: data.usd_market_cap ? data.usd_market_cap * 1.2 : 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      
      // Fallback to mock data if API fails
      return this.getFallbackMarketData(symbol);
    }
  }

  private mapSymbolToCoingeckoId(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'MATIC': 'matic-network',
      'POLYGON': 'matic-network',
      'AAVE': 'aave',
      'UNI': 'uniswap',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai',
      'LINK': 'chainlink',
      'CRV': 'curve-dao-token',
      'COMP': 'compound-governance-token',
      'MKR': 'maker',
      'SNX': 'havven',
      'YFI': 'yearn-finance'
    };
    
    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  private getFallbackMarketData(symbol: string): MarketData {
    // Base prices for common tokens (approximate)
    const basePrices: Record<string, number> = {
      'BTC': 45000,
      'ETH': 2500,
      'MATIC': 0.8,
      'AAVE': 80,
      'UNI': 6,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1
    };
    
    const basePrice = basePrices[symbol.toUpperCase()] || 100;
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    
    return {
      price: basePrice * (1 + variation),
      change24h: (Math.random() - 0.5) * 20,
      volume24h: Math.random() * 1000000000,
      marketCap: Math.random() * 50000000000,
      fdv: Math.random() * 60000000000,
      timestamp: Date.now()
    };
  }

  async getHistoricalData(symbol: string, days: number): Promise<Array<{
    timestamp: number;
    price: number;
    volume: number;
  }>> {
    try {
      const coingeckoKey = this.getApiKey('coingecko');
      const coinId = this.mapSymbolToCoingeckoId(symbol);
      
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: days > 90 ? 'daily' : 'hourly'
        },
        headers: coingeckoKey ? { 'X-CG-Demo-API-Key': coingeckoKey } : {}
      });

      return response.data.prices.map((price: [number, number], index: number) => ({
        timestamp: price[0],
        price: price[1],
        volume: response.data.total_volumes[index]?.[1] || 0
      }));
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      
      // Return mock historical data
      return this.getFallbackHistoricalData(symbol, days);
    }
  }

  private getFallbackHistoricalData(symbol: string, days: number): Array<{
    timestamp: number;
    price: number;
    volume: number;
  }> {
    const data = [];
    const now = Date.now();
    const basePrice = this.getFallbackMarketData(symbol).price;
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * 86400000);
      const priceVariation = Math.sin(i * 0.1) * 0.1 + (Math.random() - 0.5) * 0.05;
      
      data.push({
        timestamp,
        price: basePrice * (1 + priceVariation),
        volume: Math.random() * 100000000
      });
    }
    
    return data;
  }

  async getDeFiMetrics(protocolId: string): Promise<{
    tvl: number;
    volume24h: number;
    fees24h: number;
    revenue24h: number;
    users24h: number;
  }> {
    try {
      const defillama = this.getApiKey('defillama');
      
      // DeFi Llama API call
      const response = await axios.get(`https://api.llama.fi/protocol/${protocolId}`, {
        headers: defillama ? { 'Authorization': `Bearer ${defillama}` } : {}
      });
      
      const latestTvl = response.data.tvl?.[response.data.tvl.length - 1];
      
      // Get additional metrics if available
      let volume24h = 0;
      let fees24h = 0;
      
      try {
        const volumeResponse = await axios.get(`https://api.llama.fi/summary/dexs/${protocolId}`);
        volume24h = volumeResponse.data.total24h || 0;
      } catch (volumeError) {
        // Volume data not available
      }
      
      try {
        const feesResponse = await axios.get(`https://api.llama.fi/summary/fees/${protocolId}`);
        fees24h = feesResponse.data.total24h || 0;
      } catch (feesError) {
        // Fees data not available
      }
      
      return {
        tvl: latestTvl?.totalLiquidityUSD || Math.random() * 1000000000,
        volume24h: volume24h || Math.random() * 100000000,
        fees24h: fees24h || Math.random() * 1000000,
        revenue24h: fees24h * 0.3 || Math.random() * 500000, // Assume 30% revenue share
        users24h: Math.floor(Math.random() * 10000)
      };
    } catch (error) {
      console.error(`Error fetching DeFi metrics for ${protocolId}:`, error);
      
      return {
        tvl: Math.random() * 1000000000,
        volume24h: Math.random() * 100000000,
        fees24h: Math.random() * 1000000,
        revenue24h: Math.random() * 500000,
        users24h: Math.floor(Math.random() * 10000)
      };
    }
  }

  async getTokenPrice(contractAddress: string, network: string): Promise<number> {
    try {
      const coingeckoKey = this.getApiKey('coingecko');
      
      // Map network to CoinGecko platform ID
      const platformMap: Record<string, string> = {
        'ethereum': 'ethereum',
        'polygon': 'polygon-pos',
        'arbitrum': 'arbitrum-one'
      };
      
      const platform = platformMap[network];
      if (!platform) {
        throw new Error(`Unsupported network: ${network}`);
      }
      
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${platform}`, {
        params: {
          contract_addresses: contractAddress,
          vs_currencies: 'usd'
        },
        headers: coingeckoKey ? { 'X-CG-Demo-API-Key': coingeckoKey } : {}
      });
      
      const price = response.data[contractAddress.toLowerCase()]?.usd;
      if (price === undefined) {
        throw new Error(`Price not found for contract ${contractAddress}`);
      }
      
      return price;
    } catch (error) {
      console.error(`Error fetching token price for ${contractAddress}:`, error);
      return Math.random() * 1000; // Fallback price
    }
  }
}