import { Chapter, Topic } from '@/types';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { Configuration, OpenAIApi } from 'openai';

loadEnvConfig('');

const generateEmbeddings = async (topics: Topic[]) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (let i = 0; i < topics.length; i++) {
    const section = topics[i];

    for (let j = 0; j < section.chunks.length; j++) {
      const chunk = section.chunks[j];

      const { title, date, content, content_length, content_tokens } = chunk;

      const embeddingResponse = await openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: content,
      });

      const [{ embedding }] = embeddingResponse.data.data;

      const { data, error } = await supabase
        .from('training')
        .insert({
          title,
          date,
          content,
          content_length,
          content_tokens,
          embedding,
        })
        .select('*');

      if (error) {
        console.log('error', error);
      } else {
        console.log('saved', i, j);
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
};

(async () => {
  const training: Chapter = JSON.parse(
    fs.readFileSync('scripts/training.json', 'utf8')
  );

  await generateEmbeddings(training.topics);
})();
