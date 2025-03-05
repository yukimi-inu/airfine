import chalk from 'chalk';
import OpenAI from 'openai';
import { LLMProvider } from './index';
import { Config } from '../setup';

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private config: Config;

  constructor(apiKey: string, config: Config) {
    this.apiKey = apiKey;
    this.config = config;
  }

  async transform(prompt: string, context: string | null, model: string): Promise<string | null> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });

    const modelToUse = model || this.getDefaultModel();
    
    // Create base request parameters
    const requestParams: any = {
      model: modelToUse,
      messages: [],
    };
    
    // Add context message only if provided
    if (context && context.trim()) {
      requestParams.messages.push({
        role: 'developer',
        content: context,
      });
    }
    
    // Add prompt message
    requestParams.messages.push({
      role: 'user',
      content: prompt,
    });
    
    // Add temperature parameter only for models that support it
    // o1 and o3 series models don't support temperature
    if (!modelToUse.startsWith('o')) {
      requestParams.temperature = 0.7;
    }

    const response = await openai.chat.completions.create(requestParams);

    return response.choices[0]?.message?.content || null;
  }

  getDefaultModel(): string {
    // Return the default model from config if available, otherwise use the hardcoded default
    return this.config.defaultModels?.openai || 'gpt-4o';
  }
}

/**
 * Fetch available models from OpenAI API
 */
export async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data
      .map((model: { id: string }) => model.id)
      .filter((id: string) =>
        // Filter to include only the main models, excluding fine-tuned models
        id.startsWith('gpt-') ||
        id.startsWith('o') 
      )
      .sort();
  } catch (error) {
    console.error(chalk.red('Error fetching OpenAI models:'), error instanceof Error ? error.message : error);
    return [];
  }
}