import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLM_PROVIDER } from './llm.types';
import { MockProvider } from './mock.provider';
import { OpenAiProvider } from './openai.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('LLM_PROVIDER') === 'openai'
          ? new OpenAiProvider(config)
          : new MockProvider(),
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
