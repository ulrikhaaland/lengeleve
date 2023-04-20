import fs from 'fs';
import { Chapter } from '@/types';
import { encode } from 'gpt-3-encoder';

(async () => {
  const book: Chapter = JSON.parse(
    fs.readFileSync('scripts/training.json', 'utf8')
  );

  const topicGeneral = book.topics[3];

  for (let i = 0; i < topicGeneral.chunks.length; i++) {
    const chunk = topicGeneral.chunks[i];

    const trimmedContent = chunk.content.trim();
    console.log(chunk.title);
    console.log('content length: ' + trimmedContent.length);

    console.log('token length: ' + encode(trimmedContent).length);
  }
})();
