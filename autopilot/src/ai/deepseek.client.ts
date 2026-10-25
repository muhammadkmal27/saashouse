import { Injectable, Logger } from '@nestjs/common';

export interface DeepSeekChatOptions {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class DeepSeekClient {
  private readonly logger = new Logger(DeepSeekClient.name);
  private readonly apiUrl = 'https://api.deepseek.com/chat/completions';

  private getApiKey(): string {
    const key = process.env.DEEPSEEK_API_KEY || 'sk-c5d213d08c9247b48b7c8fd8011f5ae8';
    return key.trim();
  }

  async generateChat(options: DeepSeekChatOptions): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY tidak dikonfigurasikan di .env');
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: options.messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 600,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Ralat API DeepSeek (${response.status}): ${errorText}`);
        throw new Error(`Ralat DeepSeek: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err: any) {
      this.logger.error(`Gagal memanggil DeepSeek API: ${err.message}`);
      throw err;
    }
  }
}
