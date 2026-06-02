import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AI_PROVIDER, AiProvider } from './ai-provider.interface';
import { AiService } from './ai.service';
import { HeuristicProvider } from './providers/heuristic.provider';
import { OpenAiProvider } from './providers/openai.provider';

/**
 * Resolves the AI provider explicitly. OpenAI when a key is present; otherwise
 * the heuristic provider, which env validation only permits outside production
 * (or with ALLOW_HEURISTIC_FALLBACK=true). There is no silent prod degradation.
 */
const aiProviderFactory = {
  provide: AI_PROVIDER,
  inject: [ConfigService, HeuristicProvider],
  useFactory: (config: ConfigService, heuristic: HeuristicProvider): AiProvider => {
    const logger = new Logger('AiModule');
    const apiKey = config.get<string>('ai.openaiApiKey') || '';
    const model = config.get<string>('ai.openaiModel') || 'gpt-4o-mini';
    if (apiKey) {
      logger.log(`AI provider: openai (${model})`);
      return new OpenAiProvider(new OpenAI({ apiKey }), model, heuristic);
    }
    logger.warn('AI provider: heuristic (no OPENAI_API_KEY) - degraded analysis');
    return heuristic;
  },
};

@Global()
@Module({
  providers: [HeuristicProvider, aiProviderFactory, AiService],
  exports: [AiService],
})
export class AiModule {}
