import chalk from 'chalk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider } from './index';
import { Config } from '../setup';

/**
 * Gemini provider implementation
 */
export class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private config: Config;

  constructor(apiKey: string, config: Config) {
    this.apiKey = apiKey;
    this.config = config;
  }

  async transform(prompt: string, context: string | null, model: string): Promise<string | null> {
    try {
      // Initialize the Google Generative AI client
      const genAI = new GoogleGenerativeAI(this.apiKey);
      
      // Get the generative model
      const genModel = genAI.getGenerativeModel({
        model: model || this.getDefaultModel(),
      });

      // Create chat options
      const chatOptions: any = {};
      
      // Add history only if context is provided
      if (context && context.trim()) {
        chatOptions.history = [
          {
            role: "user",
            parts: [{ text: `<context>${context}</context>` }],
          },
        ];
      }

      // Create a chat session
      const chat = genModel.startChat(chatOptions);

      // Send the prompt to the model
      const result = await chat.sendMessage(prompt);
      
      // Extract the response text
      const responseText = result.response.text();
      
      return responseText || null;
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red('Gemini API Error:'), error.message);
      }
      throw error;
    }
  }

  getDefaultModel(): string {
    // Return the default model from config if available, otherwise use the hardcoded default
    return this.config.defaultModels?.gemini || 'gemini-2.0-flash';
  }
}

/**
 * Fetch available models from Gemini API
 */
export async function fetchGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.models
      .map((model: { name: string }) => model.name.replace('models/', ''))
      .filter((name: string) => name.startsWith('gemini-'))
      .sort();
  } catch (error) {
    console.error(chalk.red('Error fetching Gemini models:'), error instanceof Error ? error.message : error);
    return [];
  }
}