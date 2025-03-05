import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import chalk from 'chalk';
import inquirer from 'inquirer';

// Configuration file paths
const CONFIG_DIR = path.join(os.homedir(), '.config', 'airfine');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Configuration file type definition
export interface Config {
  openaiApiKey?: string;
  claudeApiKey?: string;
  geminiApiKey?: string;
  defaultProvider?: 'openai' | 'claude' | 'gemini';
}

/**
 * Ensure the configuration directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    console.log(chalk.green(`Created configuration directory: ${CONFIG_DIR}`));
  }
}

/**
 * Save configuration to file
 */
function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(chalk.green('Configuration saved!'));
}

/**
 * Load configuration from file
 */
export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(configData) as Config;
    }
  } catch (error) {
    console.error(chalk.yellow('Failed to load configuration file. Creating a new one.'));
  }
  return {};
}

/**
 * Setup command implementation
 */
export async function setupCommand(): Promise<void> {
  console.log(chalk.blue('airfine Setup'));
  console.log('Set up API keys for LLM providers.');
  console.log(chalk.yellow('API keys will be saved to ~/.config/airfine/config.json'));

  const currentConfig = loadConfig();

  // Provider selection
  const providerAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select a provider to configure:',
      choices: [
        { name: 'OpenAI (GPT-3.5, GPT-4)', value: 'openai' },
        { name: 'Anthropic (Claude)', value: 'claude' },
        { name: 'Google (Gemini)', value: 'gemini' },
        { name: 'Set default provider', value: 'default' },
      ],
    },
  ]);

  if (providerAnswer.provider === 'default') {
    // Default provider setting
    const defaultAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'defaultProvider',
        message: 'Select the default provider to use:',
        choices: [
          { name: 'OpenAI (GPT-3.5, GPT-4)', value: 'openai' },
          { name: 'Anthropic (Claude)', value: 'claude' },
          { name: 'Google (Gemini)', value: 'gemini' },
        ],
        default: currentConfig.defaultProvider || 'openai',
      },
    ]);

    currentConfig.defaultProvider = defaultAnswer.defaultProvider;
    saveConfig(currentConfig);
    console.log(chalk.green(`Default provider set to ${defaultAnswer.defaultProvider}!`));
    return;
  }

  // API key input
  let keyPrompt: string;
  let keyName: string;
  let keyPrefix: string;

  switch (providerAnswer.provider) {
    case 'openai':
      keyPrompt = 'Enter your OpenAI API key:';
      keyName = 'openaiApiKey';
      keyPrefix = 'sk-';
      break;
    case 'claude':
      keyPrompt = 'Enter your Anthropic (Claude) API key:';
      keyName = 'claudeApiKey';
      keyPrefix = 'sk-';
      break;
    case 'gemini':
      keyPrompt = 'Enter your Google (Gemini) API key:';
      keyName = 'geminiApiKey';
      keyPrefix = '';
      break;
    default:
      keyPrompt = '';
      keyName = '';
      keyPrefix = '';
      break;
  }

  const keyAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: keyPrompt,
      default: currentConfig[keyName as keyof Config] || '',
      validate: (input: string) => {
        if (!input.trim()) {
          return 'API key is required';
        }
        if (keyPrefix && !input.startsWith(keyPrefix)) {
          return `${providerAnswer.provider} API keys typically start with "${keyPrefix}"`;
        }
        return true;
      },
    },
  ]);

  // Update configuration
  currentConfig[keyName as keyof Config] = keyAnswer.apiKey;

  // Set the first configured provider as default if none is set
  if (!currentConfig.defaultProvider) {
    currentConfig.defaultProvider = providerAnswer.provider as 'openai' | 'claude' | 'gemini';
  }

  saveConfig(currentConfig);
  console.log(chalk.green('API key saved!'));
  console.log(chalk.blue('Setup complete. Use the `airfine transform` command to transform text.'));
}
