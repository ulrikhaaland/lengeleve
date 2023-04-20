import fs from 'fs';
import { Chapter } from '@/types';
import { encode } from 'gpt-3-encoder';

const CHUNK_SIZE = 200;

const createChunks = async (pageContent: string) => {
  let essayTextChunks = [];

  if (encode(content).length > CHUNK_SIZE) {
    const split = content.split('. ');
    let chunkText = '';

    for (let i = 0; i < split.length; i++) {
      const sentence = split[i];
      const sentenceTokenLength = encode(sentence);
      const chunkTextTokenLength = encode(chunkText).length;

      if (chunkTextTokenLength + sentenceTokenLength.length > CHUNK_SIZE) {
        essayTextChunks.push(chunkText);
        chunkText = '';
      }

      if (sentence[sentence.length - 1].match(/[a-z0-9]/i)) {
        chunkText += sentence + '. ';
      } else {
        chunkText += sentence + ' ';
      }
    }

    essayTextChunks.push(chunkText.trim());
  } else {
    essayTextChunks.push(content.trim());
  }

  const essayChunks = essayTextChunks.map((text) => {
    const trimmedText = text.trim();

    const chunk: PGChunk = {
      essay_title: title,
      essay_url: url,
      essay_date: date,
      essay_thanks: thanks,
      content: trimmedText,
      content_length: trimmedText.length,
      content_tokens: encode(trimmedText).length,
      embedding: [],
    };

    return chunk;
  });

  if (essayChunks.length > 1) {
    for (let i = 0; i < essayChunks.length; i++) {
      const chunk = essayChunks[i];
      const prevChunk = essayChunks[i - 1];

      if (chunk.content_tokens < 100 && prevChunk) {
        prevChunk.content += ' ' + chunk.content;
        prevChunk.content_length += chunk.content_length;
        prevChunk.content_tokens += chunk.content_tokens;
        essayChunks.splice(i, 1);
        i--;
      }
    }
  }

  const chunkedSection: PGEssay = {
    ...essay,
    chunks: essayChunks,
  };

  return chunkedSection;
};

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
