import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface DeepSeekChatOptions {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class DeepSeekClient {
  private readonly logger = new Logger(DeepSeekClient.name);
  private readonly apiUrl = 'https://api.deepseek.com/chat/completions';
  private customApiKey: string | null = null;
  private readonly configPath = path.resolve(process.cwd(), 'deepseek_config.json');

  constructor() {
    this.loadPersistedKey();
  }

  private loadPersistedKey() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        if (data?.apiKey && typeof data.apiKey === 'string') {
          this.customApiKey = data.apiKey.trim();
          this.logger.log('Loaded persisted DeepSeek API Key from local storage');
        }
      }
    } catch (e: any) {
      this.logger.warn('Could not read persisted api key: ' + e.message);
    }
  }

  public setApiKey(key: string): void {
    const trimmed = (key || '').trim();
    if (!trimmed.startsWith('sk-') || trimmed.length < 15) {
      throw new Error('Format kunci API DeepSeek tidak sah (mesti bermula dengan sk-)');
    }
    this.customApiKey = trimmed;
    try {
      fs.writeFileSync(this.configPath, JSON.stringify({ apiKey: trimmed }), 'utf8');
      this.logger.log('Persisted new DeepSeek API key to storage');
    } catch (e: any) {
      this.logger.warn('Could not persist key to file: ' + e.message);
    }
  }

  public getMaskedApiKey(): { hasKey: boolean; maskedKey: string } {
    const key = this.getApiKey();
    if (!key) return { hasKey: false, maskedKey: '' };
    if (key.length <= 10) return { hasKey: true, maskedKey: '***' };
    const masked = key.slice(0, 7) + '...' + key.slice(-4);
    return { hasKey: true, maskedKey: masked };
  }

  private getApiKey(): string {
    if (this.customApiKey) return this.customApiKey;
    const key = process.env.DEEPSEEK_API_KEY || 'sk-c5d213d08c9247b48b7c8fd8011f5ae8';
    return key.trim();
  }

  async generateChat(options: DeepSeekChatOptions): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY tidak dikonfigurasikan');
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
        throw new Error(`Ralat DeepSeek (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err: any) {
      this.logger.error(`Gagal memanggil DeepSeek API: ${err.message}`);
      throw err;
    }
  }
}
