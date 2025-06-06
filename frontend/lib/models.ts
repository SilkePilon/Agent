export interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description: string;
  architecture: {
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string;
  };
  top_provider: {
    is_moderated: boolean;
  };
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
    input_cache_read: string;
    input_cache_write: string;
    web_search: string;
    internal_reasoning: string;
  };
  context_length: number;
  hugging_face_id: string;
  per_request_limits: Record<string, any>;
  supported_parameters: string[];
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export interface ModelOption {
  id: string;
  name: string;
  provider: 'openrouter' | 'google';
  pricing?: {
    prompt: number;
    completion: number;
  };
  contextLength?: number;
  description?: string;
  created?: number;
  architecture?: {
    inputModalities: string[];
    outputModalities: string[];
    tokenizer: string;
  };
  topProvider?: {
    isModerated: boolean;
  };
  supportedParameters?: string[];
}

// Google Gemini models (fixed options)
export const googleModels: ModelOption[] = [
  {
    id: 'gemini-2.5-flash-preview-05-20',
    name: 'Gemini 2.5 Flash Preview',
    provider: 'google',
    contextLength: 1000000,
    description: 'Google\'s latest fast multimodal model with large context window'
  }
];

// Cache for OpenRouter models
let cachedModels: ModelOption[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchOpenRouterModels(): Promise<ModelOption[]> {
  // Return cached models if still valid
  if (cachedModels && Date.now() - lastFetchTime < CACHE_DURATION) {
    return cachedModels;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) {
      throw new Error('Failed to fetch OpenRouter models');
    }

    const data: OpenRouterModelsResponse = await response.json();    // Convert to our ModelOption format and filter for relevant models
    cachedModels = data.data
      .map(model => ({
        id: model.id,
        name: model.name,
        provider: 'openrouter' as const,
        pricing: {
          prompt: parseFloat(model.pricing.prompt),
          completion: parseFloat(model.pricing.completion)
        },
        contextLength: model.context_length,
        description: model.description,
        created: model.created,
        architecture: {
          inputModalities: model.architecture.input_modalities,
          outputModalities: model.architecture.output_modalities,
          tokenizer: model.architecture.tokenizer
        },
        topProvider: {
          isModerated: model.top_provider.is_moderated
        },
        supportedParameters: model.supported_parameters
      }))
      .sort((a, b) => {
        // Sort by prompt price, then by name
        if (a.pricing && b.pricing) {
          const priceDiff = a.pricing.prompt - b.pricing.prompt;
          if (Math.abs(priceDiff) > 0.0001) return priceDiff;
        }
        return a.name.localeCompare(b.name);
      })

    lastFetchTime = Date.now();
    return cachedModels;
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    
    // Return some fallback popular models if fetch fails
    return [
      {
        id: 'google/gemini-2.5-flash-preview-05-20:thinking',
        name: 'Gemini 2.5 Flash Preview (Thinking)',
        provider: 'openrouter',
        pricing: { prompt: 0.0007, completion: 0.0007 },
        contextLength: 128000,
        description: 'Google Gemini with reasoning capabilities'
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'openrouter',
        pricing: { prompt: 3, completion: 15 },
        contextLength: 200000,
        description: 'Anthropic\'s most capable model'
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        provider: 'openrouter',
        pricing: { prompt: 5, completion: 15 },
        contextLength: 128000,
        description: 'OpenAI\'s latest multimodal model'
      }
    ];
  }
}

export function formatPrice(price: number): string {
  if (price < 0.001) {
    return `$${(price * 1000).toFixed(3)}/1M tokens`;
  } else if (price < 1) {
    return `$${price.toFixed(3)}/1K tokens`;
  } else {
    return `$${price.toFixed(2)}/1K tokens`;
  }
}

export function getAllModels(): Promise<ModelOption[]> {
  return fetchOpenRouterModels().then(openRouterModels => [
    ...googleModels,
    ...openRouterModels
  ]);
}
