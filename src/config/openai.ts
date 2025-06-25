// OpenAI Configuration for KCT Menswear AI Features
// This file contains the configuration and utility functions for OpenAI integration

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  models: {
    text: string;
    embeddings: string;
    audio: string;
    images: string;
  };
}

// Default configuration - update with your actual API keys
export const openAIConfig: OpenAIConfig = {
  apiKey: process.env.VITE_OPENAI_API_KEY || 'your-openai-api-key-here',
  organization: process.env.VITE_OPENAI_ORG_ID || undefined,
  models: {
    text: 'gpt-4o',
    embeddings: 'text-embedding-3-large', // Most capable embedding model
    audio: 'gpt-4o-audio-preview',
    images: 'dall-e-3'
  }
};

// Product-specific prompts for different AI tasks
export const productPrompts = {
  description: `You are an expert copywriter for a luxury menswear brand. Create compelling, conversion-optimized product descriptions that:
- Highlight premium quality and craftsmanship
- Appeal to discerning gentlemen
- Include emotional triggers for purchase decisions
- Optimize for SEO while maintaining elegance
- Focus on occasions and lifestyle benefits

Product details: {{PRODUCT_DATA}}
Additional context: {{USER_INPUT}}

Write a description that converts browsers into buyers.`,

  styling: `You are a professional men's fashion stylist with expertise in formal wear and wedding attire. Provide styling advice that:
- Considers color coordination and fabric compatibility
- Suggests appropriate occasions for the garment
- Recommends complementary accessories
- Takes into account current fashion trends
- Offers seasonal and regional style variations

Product: {{PRODUCT_DATA}}
Customer preferences: {{USER_INPUT}}

Provide actionable styling recommendations.`,

  seo: `You are an SEO expert specializing in e-commerce and fashion retail. Analyze this product and provide:
- Primary and secondary keyword recommendations
- Optimized title suggestions (60 characters max)
- Meta descriptions (155 characters max)
- Content structure recommendations
- Schema markup suggestions for rich snippets

Product: {{PRODUCT_DATA}}
Target market: Luxury menswear, wedding attire, formal wear

Focus on high-converting, search-friendly content.`,

  semanticSearch: `Analyze the user's search query and find semantically similar products using embedding-based matching:
Query: {{SEARCH_QUERY}}
Product catalog: {{PRODUCT_CATALOG}}

Return products that match the intent, style, and context of the search, not just keyword matches.`,

  voiceDescription: `Create a professional voice-over script for this product that:
- Uses conversational, engaging tone
- Includes appropriate pauses and emphasis
- Tells a story about the product's value
- Guides the listener toward a purchase decision
- Maintains luxury brand positioning

Product: {{PRODUCT_DATA}}
Target audience: {{TARGET_AUDIENCE}}

Script should be 30-60 seconds when read aloud.`
};

// Utility function to replace placeholders in prompts
export const fillPromptTemplate = (
  template: string, 
  variables: Record<string, any>
): string => {
  let filledTemplate = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key.toUpperCase()}}}`;
    const replacement = typeof value === 'object' ? JSON.stringify(value) : String(value);
    filledTemplate = filledTemplate.replace(new RegExp(placeholder, 'g'), replacement);
  });
  
  return filledTemplate;
};

// API call helpers (ready for production use)
export const openAIHelpers = {
  // Text completion using GPT-4
  async generateText(prompt: string, maxTokens: number = 1000): Promise<string> {
    // Implementation would go here
    // const response = await openai.chat.completions.create({...});
    throw new Error('OpenAI API not implemented yet - add your API key and uncomment');
  },

  // Generate embeddings for semantic search
  async generateEmbeddings(text: string): Promise<number[]> {
    // Implementation would go here
    // const response = await openai.embeddings.create({...});
    throw new Error('OpenAI Embeddings API not implemented yet');
  },

  // Generate audio from text
  async generateAudio(text: string, voice: string = 'alloy'): Promise<ArrayBuffer> {
    // Implementation would go here
    // const response = await openai.audio.speech.create({...});
    throw new Error('OpenAI Audio API not implemented yet');
  },

  // Generate product images
  async generateProductImage(prompt: string): Promise<string> {
    // Implementation would go here
    // const response = await openai.images.generate({...});
    throw new Error('OpenAI Images API not implemented yet');
  }
};

// Rate limiting and cost management
export const usageTracking = {
  // Track API usage to manage costs
  trackUsage: (endpoint: string, tokens: number, cost: number) => {
    console.log(`API Usage: ${endpoint} - ${tokens} tokens - $${cost.toFixed(4)}`);
    // Store in database or analytics service
  },

  // Rate limiting to prevent quota exhaustion
  rateLimiter: {
    requests: 0,
    maxRequestsPerMinute: 50,
    resetTime: Date.now(),
    
    canMakeRequest(): boolean {
      const now = Date.now();
      if (now - this.resetTime > 60000) {
        this.requests = 0;
        this.resetTime = now;
      }
      return this.requests < this.maxRequestsPerMinute;
    },
    
    recordRequest(): void {
      this.requests++;
    }
  }
};

// Error handling for API failures
export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiError?: any
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

// Environment variable validation
export const validateOpenAIConfig = (): boolean => {
  const requiredVars = ['VITE_OPENAI_API_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`Missing OpenAI configuration: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

export default openAIConfig; 