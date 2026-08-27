import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateChatResponse } from '../geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('generateChatResponse', () => {
    it('should successfully generate a chat response', async () => {
      const mockResponse = { text: 'Hello, this is a response from Forge Assistant.' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const messages = [
        { role: 'user' as const, text: 'Hello' },
      ];

      const response = await generateChatResponse(messages);

      expect(response).toBe(mockResponse.text);
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello',
          image: null,
          history: [],
          systemInstruction: 'You are Forge Assistant, a specialized AI for DIY engineering, automotive repair, and hardware development.',
          customApiKey: undefined
        }),
      });
    });

    it('should correctly format history messages', async () => {
      const mockResponse = { text: 'Sure, here is the answer.' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const messages = [
        { role: 'user' as const, text: 'What is 2+2?' },
        { role: 'model' as const, text: '2+2 is 4.' },
        { role: 'user' as const, text: 'And 3+3?' },
      ];

      const response = await generateChatResponse(messages, 'fake-api-key', 'Custom instruction');

      expect(response).toBe(mockResponse.text);
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'And 3+3?',
          image: null,
          history: [
            { role: 'user', text: 'What is 2+2?', image: null },
            { role: 'model', text: '2+2 is 4.', image: null }
          ],
          systemInstruction: 'Custom instruction',
          customApiKey: 'fake-api-key'
        }),
      });
    });

    it('should throw an error if the API returns not ok', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'API limit exceeded' }),
      });

      const messages = [{ role: 'user' as const, text: 'Hello' }];

      await expect(generateChatResponse(messages)).rejects.toThrow('API limit exceeded');
    });

    it('should throw a default error if API returns not ok without error details', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => { throw new Error('invalid json'); },
      });

      const messages = [{ role: 'user' as const, text: 'Hello' }];

      await expect(generateChatResponse(messages)).rejects.toThrow('Failed to generate chat response.');
    });

    it('should parse messages with parts correctly', async () => {
      const mockResponse = { text: 'Parsed correctly' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const messages = [
        { role: 'user' as const, parts: [{ text: 'Hello in parts' }] },
      ];

      const response = await generateChatResponse(messages);

      expect(response).toBe(mockResponse.text);
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"message":"Hello in parts"'),
      });
    });
  });
});
