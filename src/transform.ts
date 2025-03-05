import chalk from 'chalk';
import { type Config, loadConfig } from './setup';
import { createProvider, getModelSuggestions } from './providers';
import { fetchOpenAIModels } from './providers/openai';
import { fetchClaudeModels } from './providers/claude';
import { fetchGeminiModels } from './providers/gemini';

// Transform command options type definition
interface TransformOptions {
  prompt?: string;
  context?: string;
  model?: string;
  provider?: string;
  quiet?: boolean;
  raw?: boolean;
  beforeAfter?: boolean; // Flag to indicate if before/after display mode is enabled
}

/**
 * Fetch available models from all configured providers
 */
export async function fetchAvailableModels(config: Config): Promise<Record<string, string[]>> {
  const result: Record<string, string[]> = {};
  const promises: Promise<void>[] = [];

  if (config.openaiApiKey) {
    promises.push(
      fetchOpenAIModels(config.openaiApiKey).then((models) => {
        result.openai = models;
      })
    );
  }

  if (config.claudeApiKey) {
    promises.push(
      fetchClaudeModels(config.claudeApiKey).then((models) => {
        result.claude = models;
      })
    );
  }

  if (config.geminiApiKey) {
    promises.push(
      fetchGeminiModels(config.geminiApiKey).then((models) => {
        result.gemini = models;
      })
    );
  }

  await Promise.all(promises);
  return result;
}

/**
 * Read input from stdin
 */
async function readFromStdin(): Promise<string> {
  return new Promise<string>((resolve) => {
    let data = '';
    
    // Check if stdin is connected to a terminal (TTY)
    // If it's not, it means data is being piped in
    if (!process.stdin.isTTY) {
      process.stdin.on('data', (chunk) => {
        data += chunk;
      });
      
      process.stdin.on('end', () => {
        resolve(data.trim());
      });
    } else {
      // If stdin is a TTY, there's no piped data
      resolve('');
    }
  });
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

  // Read from stdin if no prompt is provided
  let promptText = options.prompt || '';
  if (!promptText) {
    if (!isQuietMode) {
      console.log(chalk.blue('Reading prompt from stdin...'));
    }
    promptText = await readFromStdin();
  }

  // Check if prompt is provided (either via option or stdin)
  if (!promptText) {
    console.error(chalk.red('No prompt specified. Use the --prompt option or pipe content to stdin.'));
    process.exit(1);
  }

  // Determine which provider to use
  let providerName = options.provider || config.defaultProvider || '';

  // If no provider specified or the specified provider is not configured,
  // use any configured provider based on available API keys
  if (
    !providerName ||
    (providerName === 'openai' && !config.openaiApiKey) ||
    (providerName === 'claude' && !config.claudeApiKey) ||
    (providerName === 'gemini' && !config.geminiApiKey)
  ) {
    // Check which providers have API keys configured and use the first available one
    if (config.openaiApiKey) {
      providerName = 'openai';
    } else if (config.claudeApiKey) {
      providerName = 'claude';
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
      promptText,
      options.context || null,
      model,
    );

    if (result) {
      // Output result to stdout
      if (isQuietMode) {
        // In quiet mode, just output the raw result without newlines or formatting
        process.stdout.write(result);
      } else if (options.beforeAfter) {
        // In before/after mode, show both the original prompt and the result
        console.log(chalk.blue('\n=== Before ==='));
        console.log(promptText);
        console.log(chalk.green('\n=== After ==='));
        console.log(result);
        console.log(''); // Add an empty line at the end
      } else {
        // Standard output mode
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

// Re-export getModelSuggestions for use in other modules
export { getModelSuggestions };
