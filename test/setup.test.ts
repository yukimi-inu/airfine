import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Config, loadConfig } from '../src/setup';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Mock fs and path modules
vi.mock('node:fs');
vi.mock('node:path');
vi.mock('node:os');

describe('setup module', () => {
  const mockConfig: Config = {
    openaiApiKey: 'test-openai-key',
    claudeApiKey: 'test-claude-key',
    geminiApiKey: 'test-gemini-key',
    defaultProvider: 'openai',
  };

  beforeEach(() => {
    // Setup mocks
    vi.mocked(os.homedir).mockReturnValue('/mock/home');
    vi.mocked(path.join).mockImplementation((...args: string[]) => args.join('/'));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loadConfig', () => {
    it('should return an empty object if config file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const config = loadConfig();
      expect(config).toEqual({});
    });

    it('should load and parse config file if it exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      const config = loadConfig();
      expect(config).toEqual(mockConfig);
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should return an empty object if there is an error reading the config file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('Mock file read error');
      });

      const config = loadConfig();
      expect(config).toEqual({});
    });
  });
});