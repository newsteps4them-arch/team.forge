import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeImage, generateChatResponse } from '../geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('analyzeImage', () => {
    it('should successfully analyze an image and return text', async () => {
      const mockResponse = { text: 'Analyzed image text' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const prompt = 'What is in this image?';
      const base64Image = 'fakebase64string';
      const result = await analyzeImage(prompt, base64Image);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          image: `image/jpeg;base64,${base64Image}`,
          history: [],
          systemInstruction: "You are an expert visual inspector.",
          customApiKey: undefined
        }),
      });
      expect(result).toBe(mockResponse.text);
    });

    it('should handle API errors correctly', async () => {
      const errorMessage = 'API rate limit exceeded';
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      const prompt = 'What is in this image?';
      const base64Image = 'fakebase64string';

      await expect(analyzeImage(prompt, base64Image)).rejects.toThrow(errorMessage);
    });

    it('should handle API errors correctly when json parsing fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => Promise.reject(new Error('Invalid JSON')),
      });

      const prompt = 'What is in this image?';
      const base64Image = 'fakebase64string';

      await expect(analyzeImage(prompt, base64Image)).rejects.toThrow('Failed to analyze image.');
    });

    it('should pass custom api key and system instruction', async () => {
      const mockResponse = { text: 'Custom response' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const prompt = 'What is in this image?';
      const base64Image = 'fakebase64string';
      const apiKey = 'test-api-key';
      const sysInst = 'Custom system instruction';

      const result = await analyzeImage(prompt, base64Image, apiKey, sysInst);

      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          image: `image/jpeg;base64,${base64Image}`,
          history: [],
          systemInstruction: sysInst,
          customApiKey: apiKey
        }),
      });
      expect(result).toBe(mockResponse.text);
    });
  });

  describe('generateChatResponse', () => {
    it('should successfully generate chat response', async () => {
      const mockResponse = { text: 'Chat response text' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const messages = [
        { role: 'user' as const, text: 'Hello' },
        { role: 'model' as const, text: 'Hi there' },
        { role: 'user' as const, text: 'How are you?' }
      ];

      const result = await generateChatResponse(messages);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'How are you?',
          image: null,
          history: [
            { role: 'user', text: 'Hello', image: null },
            { role: 'model', text: 'Hi there', image: null }
          ],
          systemInstruction: "You are Forge Assistant, a specialized AI for DIY engineering, automotive repair, and hardware development.",
          customApiKey: undefined
        }),
      });
      expect(result).toBe(mockResponse.text);
    });

    it('should handle parts format for messages', async () => {
      const mockResponse = { text: 'Chat response text' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const messages = [
        { role: 'user' as const, parts: [{ text: 'Hello' }] }
      ];

      const result = await generateChatResponse(messages);

      expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
        body: expect.stringContaining('"message":"Hello"')
      }));
      expect(result).toBe(mockResponse.text);
    });

    it('should throw error when api fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error generating chat' }),
      });

      const messages = [
        { role: 'user' as const, text: 'Hello' }
      ];

      await expect(generateChatResponse(messages)).rejects.toThrow('Error generating chat');
    });

    it('should throw default error when json parsing fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => Promise.reject(new Error('Invalid JSON')),
      });

      const messages = [
        { role: 'user' as const, text: 'Hello' }
      ];

      await expect(generateChatResponse(messages)).rejects.toThrow('Failed to generate chat response.');
    });
  });
});
