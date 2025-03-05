import chalk from 'chalk';
import type {Config} from '../setup';
import {ClaudeProvider} from './claude';
import {GeminiProvider} from './gemini';
import {OpenAIProvider} from './openai';

/**
 * Interface for LLM providers
 */
export interface LLMProvider {
  transform(prompt: string, context: string | null, model: string): Promise<string | null>;

  getDefaultModel(config?: Config): string;
}

/**
 * Factory function to create the appropriate provider
 */
export function createProvider(providerName: string, config: Config): LLMProvider | null {
  switch (providerName) {
    case 'openai':
      if (!config.openaiApiKey) {
        console.error(chalk.red('OpenAI API key not found. Run `airfine setup` to configure.'));
        return null;
      }
      return new OpenAIProvider(config.openaiApiKey, config);

    case 'claude':
      if (!config.claudeApiKey) {
        console.error(chalk.red('Claude API key not found. Run `airfine setup` to configure.'));
        return null;
      }
      return new ClaudeProvider(config.claudeApiKey, config);

    case 'gemini':
      if (!config.geminiApiKey) {
        console.error(chalk.red('Gemini API key not found. Run `airfine setup` to configure.'));
        return null;
      }
      return new GeminiProvider(config.geminiApiKey, config);

    default:
      console.error(chalk.red(`Unknown provider: ${providerName}`));
      return null;
  }
}

/**
 * Get model suggestions based on provider
 */
export function getModelSuggestions(provider: string): string[] {
  switch (provider) {
    case 'openai':
      return ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'o3-mini'];
    case 'claude':
      return ['claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'];
    case 'gemini':
      return ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'];
    default:
      return [];
  }
}
