import { OpenAIModel } from '@/types';
import { createClient } from '@supabase/supabase-js';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const OpenAIStream = async (prompt: string, apiKey: string) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const listContent: string[] = [
    "You are a helpful assistant that accurately answers queries using Peter Attia's knowledge of training.",
    'Use the text provided to form your answer.',
    'When the question indicates a need for a short answer, try to keep your answer short.',
    'When the question indicates a need for a long answer, try to expand your answer.',
    'Try to use your own words when possible.',
    'Try to keep your answer short, but expand if necessary.',
    'Be accurate, helpful, concise, and clear.',
  ];

  const content = listContent.join('\n\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-3.5-turbo-0301',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.4,
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
