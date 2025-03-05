#!/usr/bin/env node

// Suppress warnings by setting NODE_OPTIONS
process.env.NODE_OPTIONS = '--no-deprecation';

import chalk from 'chalk';
import { Command } from 'commander';
import { setupCommand } from './setup';
import { getModelSuggestions, transformCommand } from './transform';

const program = new Command();

// Set up basic program information
program.name('airfine').description('A minimal LLM-based text refinement CLI').version('0.1.0');

// Add setup command
program.command('setup').description('Setup API keys for LLM providers').action(setupCommand);

// Add transform command
program
  .command('transform')
  .description('Transform text using LLM')
  .option('-p, --prompt <text>', 'The prompt text to transform')
  .option(
    '-c, --context <text>',
    'System context for the transformation',
    'You are a skilled editor. Please improve the following text.',
  )
  .option('-m, --model <model>', 'Model to use (provider-specific)')
  .option('-r, --provider <provider>', 'LLM provider to use (openai, claude, gemini)', '')
  .option('-q, --quiet', 'Output only the result text without any logs')
  .option('--raw', 'Alias for --quiet')
  .action(transformCommand);

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
