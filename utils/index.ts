import { PromptItem } from '@/utils/getQueryPrompt';
import { OpenAIModel } from '@/types';
import { createClient } from '@supabase/supabase-js';
import endent from 'endent';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';
import { currentSystemPrompt } from '../prompts/system';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const OpenAIStream = async (prompt: PromptItem[], apiKey: string) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Else if the question indicates a need for a long answer, expand your answer.,

  const systemCurrent = currentSystemPrompt;

  const contentPrompt = {
    role: 'system',
    content: systemCurrent,
  };

  /// insert content prompt at index 0 of prompt array
  prompt.unshift(contentPrompt);

  console.log('Running OpenAIStream...');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-4',
      messages: prompt,
      max_tokens: 1000,
      temperature: 0.0,
      stream: true,
    }),
  });

  if (res.status !== 200) {
    const errorRes = await res.text();
    console.log(JSON.parse(errorRes));

    throw new Error(errorRes);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if (data === '[DONE]') {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};
