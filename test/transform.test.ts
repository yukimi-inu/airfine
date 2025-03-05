import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getModelSuggestions } from '../src/transform';
import * as setup from '../src/setup';
import chalk from 'chalk';

// Mock dependencies
vi.mock('../src/setup');
vi.mock('chalk', () => ({
  default: {
    red: vi.fn((text) => `RED:${text}`),
    blue: vi.fn((text) => `BLUE:${text}`),
    yellow: vi.fn((text) => `YELLOW:${text}`),
    green: vi.fn((text) => `GREEN:${text}`),
  },
}));
vi.mock('openai');

// Mock process.exit to prevent tests from exiting
const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as any);
// Mock console.log and console.error
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

describe('transform module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getModelSuggestions', () => {
    it('should return OpenAI models for openai provider', () => {
      const models = getModelSuggestions('openai');
      expect(models).toEqual(['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'o3-mini']);
    });

    it('should return Claude models for claude provider', () => {
      const models = getModelSuggestions('claude');
      expect(models).toEqual(['claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest']);
    });

    it('should return Gemini models for gemini provider', () => {
      const models = getModelSuggestions('gemini');
      expect(models).toEqual(['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro']);
    });

    it('should return empty array for unknown provider', () => {
      const models = getModelSuggestions('unknown');
      expect(models).toEqual([]);
    });
  });

  // Additional tests for transformCommand would go here
  // These would be more complex as they involve mocking OpenAI API responses
  // and testing various code paths through the command
});