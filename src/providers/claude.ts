import chalk from 'chalk';
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider } from './index';
import { Config } from '../setup';

/**
 * Claude provider implementation
 */
export class ClaudeProvider implements LLMProvider {
  private apiKey: string;
  private config: Config;

  constructor(apiKey: string, config: Config) {
    this.apiKey = apiKey;
    this.config = config;
  }

  async transform(prompt: string, context: string | null, model: string): Promise<string | null> {
    const anthropic = new Anthropic({
      apiKey: this.apiKey,
    });

    try {
      // Prepare content based on whether context is provided
      const content = context && context.trim() 
        ? `<context>${context}</context>\n\n${prompt}` 
        : prompt;
      
      const response = await anthropic.messages.create({
        model: model || this.getDefaultModel(),
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: content,
          },
        ],
        temperature: 0.7,
      });

      // Extract the text content from the response
      if (response.content && response.content.length > 0) {
        const textContent = response.content
          .filter((item) => item.type === 'text')
          .map((item) => item.text)
          .join('\n');
        
        return textContent || null;
      }
      
      return null;
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red('Claude API Error:'), error.message);
      }
      throw error;
    }
  }

  getDefaultModel(): string {
    // Return the default model from config if available, otherwise use the hardcoded default
    return this.config.defaultModels?.claude || 'claude-3-7-sonnet-latest';
  }
}

/**
 * Fetch available models from Claude API
 */
export async function fetchClaudeModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data
      .map((model: { id: string }) => model.id)
      .sort();
  } catch (error) {
    console.error(chalk.red('Error fetching Claude models:'), error instanceof Error ? error.message : error);
    return [];
  }
}