import chalk from 'chalk';
import OpenAI from 'openai';
import { type Config, loadConfig } from './setup';

// Transform command options type definition
interface TransformOptions {
  prompt?: string;
  context?: string;
  model?: string;
  provider?: string;
  quiet?: boolean;
  raw?: boolean;
}

/**
 * Interface for LLM providers
 */
interface LLMProvider {
  transform(prompt: string, context: string, model: string): Promise<string | null>;
  getDefaultModel(): string;
}

/**
 * OpenAI provider implementation
 */
class OpenAIProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transform(prompt: string, context: string, model: string): Promise<string | null> {
    const openai = new OpenAI({
      apiKey: this.apiKey,
    });

    const response = await openai.chat.completions.create({
      model: model || this.getDefaultModel(),
      messages: [
        {
          role: 'developer',
          content: context,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || null;
  }

  getDefaultModel(): string {
    return 'gpt-4o';
  }
}

/**
 * Claude provider implementation
 * Note: This is a placeholder. Actual implementation requires Anthropic API client.
 */
class ClaudeProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transform(prompt: string, context: string, model: string): Promise<string | null> {
    // TODO: Implement Claude API integration
    console.log(chalk.yellow('Claude API integration is not yet implemented.'));
    console.log(chalk.yellow('This is a placeholder for future implementation.'));

    // For now, return a message indicating this is not implemented
    return 'Claude API integration is not yet implemented. Please use OpenAI provider for now.';
  }

  getDefaultModel(): string {
    return 'claude-3.7-sonnet';
  }
}

/**
 * Gemini provider implementation
 * Note: This is a placeholder. Actual implementation requires Google AI API client.
 */
class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transform(prompt: string, context: string, model: string): Promise<string | null> {
    // TODO: Implement Gemini API integration
    console.log(chalk.yellow('Gemini API integration is not yet implemented.'));
    console.log(chalk.yellow('This is a placeholder for future implementation.'));

    // For now, return a message indicating this is not implemented
    return 'Gemini API integration is not yet implemented. Please use OpenAI provider for now.';
  }

  getDefaultModel(): string {
    return 'gemini-2.0-flash';
  }
}

/**
 * Factory function to create the appropriate provider
 */
function createProvider(providerName: string, config: Config): LLMProvider | null {
  switch (providerName) {
    case 'openai':
      if (!config.openaiApiKey) {
        console.error(chalk.red('OpenAI API key not found. Run `airfine setup` to configure.'));
        return null;
      }
      return new OpenAIProvider(config.openaiApiKey);

    case 'claude':
      if (!config.claudeApiKey) {
        console.error(chalk.red('Claude API key not found. Run `airfine setup` to configure.'));
        return null;
      }
      return new ClaudeProvider(config.claudeApiKey);

    case 'gemini':
      if (!config.geminiApiKey) {
        console.error(chalk.red('Gemini API key not found. Run `airfine setup` to configure.'));
        return null;
      }
      return new GeminiProvider(config.geminiApiKey);

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
      return ['claude-3.7-sonnet', 'claude-3.5-sonnet'];
    case 'gemini':
      return ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'];
    default:
      return [];
  }
}

/**
 * Transform command implementation
 */
export async function transformCommand(options: TransformOptions): Promise<void> {
  // Check if quiet mode is enabled (either --quiet or --raw)
  const isQuietMode = options.quiet || options.raw;

  // Load configuration
  const config = loadConfig();

  // Check if any provider is configured
  if (!config.openaiApiKey && !config.claudeApiKey && !config.geminiApiKey) {
    console.error(chalk.red('No API keys configured. Run `airfine setup` to configure.'));
    process.exit(1);
  }

  // Check if prompt is provided
  if (!options.prompt) {
    console.error(chalk.red('No prompt specified. Use the --prompt option.'));
    process.exit(1);
  }

  // Determine which provider to use
  let providerName = options.provider || config.defaultProvider || 'claude';

  // If the specified provider is not configured, fall back to any configured provider
  if (
    (providerName === 'openai' && !config.openaiApiKey) ||
    (providerName === 'claude' && !config.claudeApiKey) ||
    (providerName === 'gemini' && !config.geminiApiKey)
  ) {
    if (config.claudeApiKey) {
      providerName = 'claude';
    } else if (config.openaiApiKey) {
      providerName = 'openai';
    } else if (config.geminiApiKey) {
      providerName = 'gemini';
    }
  }

  try {
    // Create provider
    const provider = createProvider(providerName, config);
    if (!provider) {
      process.exit(1);
      return; // This line is added to help TypeScript understand that the function exits
    }

    // Get default model for the provider if not specified
    const model = options.model || provider.getDefaultModel();

    // Only log if not in quiet mode
    if (!isQuietMode) {
      console.log(chalk.blue(`Starting text transformation using ${providerName} (${model})...`));
    }

    // Transform text
    const result = await provider.transform(
      options.prompt || '',
      options.context || 'You are a skilled editor. Please improve the following text.',
      model,
    );

    if (result) {
      // Output result to stdout
      // In quiet mode, just output the raw result without newlines or formatting
      if (isQuietMode) {
        process.stdout.write(result);
      } else {
        console.log(`\n${result}\n`);
      }
    } else {
      if (!isQuietMode) {
        console.error(chalk.yellow('Empty response from API.'));
      }
      process.exit(1);
    }
  } catch (error) {
    if (!isQuietMode) {
      if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message);
      } else {
        console.error(chalk.red('Unknown error occurred'));
      }
    }
    process.exit(1);
  }
}
