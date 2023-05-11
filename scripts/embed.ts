import { Chapter, Chunk, Topic } from '@/types';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { Configuration, OpenAIApi } from 'openai';
import { ExtractedData } from './parse';

loadEnvConfig('');

const generateEmbeddings = async (extractedDatas: ExtractedData[]) => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (let i = 0; i < extractedDatas.length; i++) {
    const extractedData = extractedDatas[i];

    const { id, title, author, date, content, content_length, content_tokens } =
      extractedData;

    const inputString = `${content}`; // Adjust this format as needed.

    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: inputString,
    });

    const [{ embedding }] = embeddingResponse.data.data;

    const { data, error } = await supabase
      .from('handbook') // I assume you're using a different table here.
      .insert({
        id,
        title,
        author,
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
      console.log('saved', i, data);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};

(async () => {
  const training: Chunk[] = JSON.parse(
    fs.readFileSync('scripts/data/layne3/parsedLayne3.json', 'utf8')
  );

  await generateEmbeddings(training);
})();
