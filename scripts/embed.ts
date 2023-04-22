import { Chapter, Chunk, Topic } from '@/types';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { Configuration, OpenAIApi } from 'openai';

loadEnvConfig('');

const generateEmbeddings = async (chunks: Chunk[]) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const {
      title,
      date,
      content,
      context,
      people,
      content_length,
      content_tokens,
    } = chunk;

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
        context,
        people,
        content,
        content_length,
        content_tokens,
        embedding,
      })
      .select('*');

    if (error) {
      console.log('error', error);
    } else {
      console.log('saved', i, i);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};

(async () => {
  const training: Chunk[] = JSON.parse(
    fs.readFileSync('scripts/data/AMA44/AMA44Parsed.json', 'utf8')
  );

  await generateEmbeddings(training);
})();
