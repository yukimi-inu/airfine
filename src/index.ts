#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { setupCommand, loadConfig } from './setup';
import { transformCommand, fetchAvailableModels } from './transform';
import { getModelSuggestions } from './providers';

const program = new Command();

// Set up basic program information
program.name('airfine').description('A minimal LLM-based text refinement CLI').version('0.1.0');

// Add setup command
program.command('setup').description('Setup API keys for LLM providers').action(setupCommand);

// Add transform command
program
  .command('transform')
  .description('Transform text using LLM')
  .option('-p, --prompt <text>', 'The prompt text to transform (if not provided, reads from stdin)')
  .option(
    '-c, --context <text>',
    'System context for the transformation',
  )
  .option('-m, --model <model>', 'Model to use (provider-specific)')
  .option('-r, --provider <provider>', 'LLM provider to use (openai, claude, gemini)', '')
  .option('-q, --quiet', 'Output only the result text without any logs')
  .option('--raw', 'Alias for --quiet')
  .option('-b, --before-after', 'Show before and after text')
  .action(transformCommand);

// Add models command
program
  .command('models')
  .description('List available models from configured providers')
  .action(async () => {
    const config = loadConfig();
    
    // Check if any provider is configured
    if (!config.openaiApiKey && !config.claudeApiKey && !config.geminiApiKey) {
      console.error(chalk.red('No API keys configured. Run `airfine setup` to configure.'));
      process.exit(1);
    }
    
    console.log(chalk.blue('Fetching available models from configured providers...'));
    
    try {
      const models = await fetchAvailableModels(config);
      
      // Display models for each provider
      Object.keys(models).forEach(provider => {
        console.log(chalk.green(`\n${provider.toUpperCase()} Models:`));
        if (models[provider].length === 0) {
          console.log(chalk.yellow('  No models found or API error occurred.'));
        } else {
          models[provider].forEach(model => {
            console.log(`  - ${model}`);
          });
        }
      });
      
      console.log(chalk.blue('\nNote: These are the models available with your current API keys.'));
      console.log(chalk.blue('Some models may require additional permissions or quotas from the provider.'));
    } catch (error) {
      console.error(chalk.red('Error fetching models:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Error handling
program.showHelpAfterError('(use --help for additional information)');

// Execute the program
try {
  program.parse(process.argv);
} catch (error) {
  console.error(chalk.red('An error occurred:'), error);
  process.exit(1);
}

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
