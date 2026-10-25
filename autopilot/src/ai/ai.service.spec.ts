import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { DeepSeekClient } from './deepseek.client';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: DeepSeekClient,
          useValue: {
            generateChat: jest.fn().mockResolvedValue('{"regime":"Bullish","signal":"BUY","confidence":85,"reason":"Strong momentum"}'),
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
