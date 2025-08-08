import axios from 'axios';
import { SentimentData } from '../types';

export class SentimentAnalysisService {
  private static instance: SentimentAnalysisService;

  static getInstance(): SentimentAnalysisService {
    if (!SentimentAnalysisService.instance) {
      SentimentAnalysisService.instance = new SentimentAnalysisService();
    }
    return SentimentAnalysisService.instance;
  }

  private getApiKey(service: string): string {
    const keyMap: Record<string, string> = {
      'twitter': import.meta.env.VITE_TWITTER_BEARER_TOKEN || '',
      'huggingface': import.meta.env.VITE_HUGGINGFACE_API_KEY || ''
    };
    return keyMap[service] || '';
  }

  async analyzeSentiment(query: string): Promise<SentimentData> {
    try {
      // Get sentiment from multiple sources
      const [twitterSentiment, redditSentiment, bertScore] = await Promise.allSettled([
        this.getTwitterSentiment(query),
        this.getRedditSentiment(query),
        this.getBertSentiment(query)
      ]);
      
      const twitter = twitterSentiment.status === 'fulfilled' ? twitterSentiment.value : 0;
      const reddit = redditSentiment.status === 'fulfilled' ? redditSentiment.value : 0;
      const bert = bertScore.status === 'fulfilled' ? bertScore.value : 0;
      
      // Weighted average of sentiment scores
      const overallScore = (twitter * 0.4 + reddit * 0.3 + bert * 0.3);
      
      return {
        score: overallScore,
        magnitude: Math.abs(overallScore),
        sources: {
          twitter,
          reddit,
          telegram: Math.random() * 2 - 1, // Mock for now
          discord: Math.random() * 2 - 1   // Mock for now
        },
        trending: Math.abs(overallScore) > 0.6,
        keywords: await this.extractKeywords(query)
      };
    } catch (error) {
      console.error(`Error analyzing sentiment for ${query}:`, error);
      
      // Return fallback sentiment data
      return this.getFallbackSentiment(query);
    }
  }

  private async getTwitterSentiment(query: string): Promise<number> {
    try {
      const bearerToken = this.getApiKey('twitter');
      
      if (!bearerToken) {
        console.warn('Twitter Bearer Token not provided, using fallback sentiment');
        return Math.random() * 2 - 1;
      }
      
      // Twitter API v2 search
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        },
        params: {
          query: `${query} -is:retweet lang:en`,
          max_results: 100,
          'tweet.fields': 'text,created_at,public_metrics,context_annotations'
        }
      });

      if (!response.data.data || response.data.data.length === 0) {
        return 0;
      }

      // Analyze sentiment of tweets
      let totalScore = 0;
      let tweetCount = 0;

      for (const tweet of response.data.data) {
        const score = this.calculateTextSentiment(tweet.text);
        totalScore += score;
        tweetCount++;
      }

      return tweetCount > 0 ? totalScore / tweetCount : 0;
    } catch (error) {
      console.error('Error fetching Twitter sentiment:', error);
      return Math.random() * 2 - 1;
    }
  }

  private async getRedditSentiment(query: string): Promise<number> {
    try {
      // Reddit API (no auth required for public posts)
      const response = await axios.get('https://www.reddit.com/search.json', {
        params: {
          q: query,
          limit: 50,
          sort: 'new',
          t: 'day'
        },
        headers: {
          'User-Agent': 'ProtocolMonitor/1.0'
        }
      });

      if (!response.data.data || !response.data.data.children) {
        return 0;
      }

      let totalScore = 0;
      let postCount = 0;

      for (const post of response.data.data.children) {
        const text = `${post.data.title} ${post.data.selftext || ''}`;
        const score = this.calculateTextSentiment(text);
        
        // Weight by upvote ratio
        const upvoteRatio = post.data.upvote_ratio || 0.5;
        const weightedScore = score * upvoteRatio;
        
        totalScore += weightedScore;
        postCount++;
      }

      return postCount > 0 ? totalScore / postCount : 0;
    } catch (error) {
      console.error('Error fetching Reddit sentiment:', error);
      return Math.random() * 2 - 1;
    }
  }

  private async getBertSentiment(text: string): Promise<number> {
    try {
      const huggingfaceKey = this.getApiKey('huggingface');
      
      if (!huggingfaceKey) {
        console.warn('Hugging Face API key not provided, using simple sentiment analysis');
        return this.calculateTextSentiment(text);
      }
      
      // Hugging Face BERT sentiment analysis
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
        { inputs: text.slice(0, 512) }, // Limit text length
        {
          headers: {
            'Authorization': `Bearer ${huggingfaceKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && Array.isArray(response.data) && response.data[0]) {
        const results = response.data[0];
        let score = 0;
        
        for (const result of results) {
          if (result.label === 'LABEL_2') { // Positive
            score += result.score;
          } else if (result.label === 'LABEL_0') { // Negative
            score -= result.score;
          }
          // LABEL_1 is neutral, so we don't add/subtract
        }
        
        return Math.max(-1, Math.min(1, score));
      }
      
      return 0;
    } catch (error) {
      console.error('Error with BERT sentiment analysis:', error);
      return this.calculateTextSentiment(text);
    }
  }

  private calculateTextSentiment(text: string): number {
    const positiveWords = [
      'good', 'great', 'excellent', 'bullish', 'positive', 'upgrade', 'improvement',
      'moon', 'pump', 'gains', 'profit', 'buy', 'hold', 'strong', 'solid',
      'amazing', 'fantastic', 'awesome', 'love', 'best', 'winner', 'success'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'bearish', 'negative', 'downgrade', 'risk', 'concern',
      'dump', 'crash', 'loss', 'sell', 'weak', 'scam', 'rug', 'fail',
      'awful', 'horrible', 'worst', 'hate', 'disaster', 'panic', 'fear'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    let wordCount = 0;
    
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 2) {
        wordCount++;
        if (positiveWords.includes(cleanWord)) score += 1;
        if (negativeWords.includes(cleanWord)) score -= 1;
      }
    }
    
    return wordCount > 0 ? Math.max(-1, Math.min(1, score / Math.sqrt(wordCount))) : 0;
  }

  private async extractKeywords(query: string): Promise<string[]> {
    // Simple keyword extraction - can be enhanced with NLP libraries
    const commonWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ];
    
    const words = query.toLowerCase()
      .split(/\s+/)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 10);
    
    return [...new Set(words)]; // Remove duplicates
  }

  private getFallbackSentiment(query: string): SentimentData {
    const score = Math.random() * 2 - 1;
    
    return {
      score,
      magnitude: Math.abs(score),
      sources: {
        twitter: Math.random() * 2 - 1,
        reddit: Math.random() * 2 - 1,
        telegram: Math.random() * 2 - 1,
        discord: Math.random() * 2 - 1
      },
      trending: Math.random() > 0.5,
      keywords: ['upgrade', 'protocol', 'governance', 'defi']
    };
  }

  async getTrendingTopics(timeframe: '1h' | '24h' | '7d' = '24h'): Promise<Array<{
    topic: string;
    mentions: number;
    sentiment: number;
    change: number;
  }>> {
    try {
      // This would integrate with social media APIs to get trending topics
      // For now, return mock trending data
      
      const topics = [
        'ethereum upgrade',
        'defi governance',
        'protocol security',
        'yield farming',
        'liquidity mining',
        'dao proposal',
        'smart contract audit',
        'tokenomics'
      ];
      
      return topics.map(topic => ({
        topic,
        mentions: Math.floor(Math.random() * 10000),
        sentiment: Math.random() * 2 - 1,
        change: (Math.random() - 0.5) * 200 // Percentage change
      })).sort((a, b) => b.mentions - a.mentions);
      
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }
}