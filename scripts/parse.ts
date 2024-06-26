import fs from 'fs';
import { Chapter, Chunk } from '@/types';
import { encode } from 'gpt-3-encoder';
import { Configuration, OpenAIApi } from 'openai';
import { loadEnvConfig } from '@next/env';
import { AMA44RAW } from './data/AMA44/AMA44RAW';
import { JSDOM } from 'jsdom';

const CHUNK_SIZE = 1000;
loadEnvConfig('');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

type EncodedString = {
  content: string;
  contentLength: number;
  encodedLength: number;
};

function removeHtmlElementsAndLinks(input: string): string {
  const dom = new JSDOM(input);

  // Return the text content without any HTML tags
  const textContent = dom.window.document.body.textContent || '';

  const startSearchString = '§Show Notes';
  const startSearchIndex = textContent.indexOf(startSearchString);

  // If the start specified string is found, remove all text before it
  const updatedTextContent =
    startSearchIndex !== -1
      ? textContent.substring(startSearchIndex)
      : textContent;

  const endSearchString = '§Selected Links';
  const endSearchIndex = updatedTextContent.indexOf(endSearchString);

  // If the end specified string is found, remove all text after it
  if (endSearchIndex !== -1) {
    return updatedTextContent.substring(0, endSearchIndex);
  }

  return updatedTextContent;
}

function splitString(input: string, maxLength: number = 1000): EncodedString[] {
  // Remove all HTML elements and links
  input = removeHtmlElementsAndLinks(input);

  const result: EncodedString[] = [];
  let currentSubstring = '';

  for (let i = 0; i < input.length; i++) {
    currentSubstring += input[i];
    const encoded = encode(currentSubstring);

    if (encoded.length >= maxLength - 1 || i === input.length - 1) {
      let lastIndex = currentSubstring.lastIndexOf('\n');

      // Ensure that we don't split on a number
      while (
        lastIndex > 0 &&
        !isNaN(parseInt(currentSubstring[lastIndex + 1], 10))
      ) {
        lastIndex = currentSubstring.lastIndexOf('\n', lastIndex - 1);
      }

      if (lastIndex === -1 || lastIndex === currentSubstring.length - 1) {
        result.push({
          content: currentSubstring,
          contentLength: currentSubstring.length,
          encodedLength: encode(currentSubstring).length,
        });
        currentSubstring = '';
      } else {
        const resultString = currentSubstring.substring(0, lastIndex);
        result.push({
          content: resultString,
          contentLength: resultString.length,
          encodedLength: encode(resultString).length,
        });
        currentSubstring = currentSubstring.substring(lastIndex);
      }
    }
  }

  if (currentSubstring) {
    result.push({
      content: currentSubstring,
      contentLength: currentSubstring.length,
      encodedLength: encode(currentSubstring).length,
    });
  }

  for (let i = 0; i < result.length; i++) {
    const chunk = result[i];
    console.log(chunk.content);
  }

  return result;
}

function writeStringsToJsonFile(
  strings: EncodedString[],
  filePath: string
): void {
  const jsonContent = JSON.stringify(strings, null, 2);

  fs.writeFile(filePath, jsonContent, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing to file ${filePath}:`, err);
    } else {
      console.log(`Successfully wrote strings to ${filePath}`);
    }
  });
}

const onParseFailure = async (failedContent: string) => {
  let response: any;

  try {
    response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You help with formatting JSON.',
        },
        {
          role: 'user',
          content:
            'This content was parsed incorrectly. Can you turn it into JSON list containg each chunk as JSON format: {title: title, content: content}. It is crucial to respond in the JSON Format as requested.',
        },
        {
          role: 'user',
          content: failedContent,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });
  } catch (e) {
    console.log(e);
    console.log(configuration.apiKey);
  }

  if (response!.status !== 200) {
    throw new Error('OpenAI API returned an error');
  } else {
    return response!.data.choices[0].message?.content;
  }
};
const chatCompletetion = async (content: string) => {
  let response: any;

  try {
    response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            "You are a helpful assistant that accurately answers queries using Peter Attia's knowledge of training. Use the text provided to form your answer, but avoid copying word-for-word from the essays. Try to use your own words when possible. Keep your answer under 5 sentences. Be accurate, helpful, concise, and clear.",
        },
        {
          role: 'user',
          content:
            'I will give you a chunk of text. You will extract the parts that is relevant to exercise. You will not use any personal names. You will leave out parts where they talk about peoples backgrounds. Then you will combine the relevant text into a chunks, give each chunk a title, and only return a JSON list containg each chunk as JSON format: {title: title, content: content}. It is crucial to respond in the JSON Format as requested.',
        },
        {
          role: 'user',
          content: content,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });
  } catch (e) {
    console.log(e);
    console.log(configuration.apiKey);
  }

  if (response!.status !== 200) {
    throw new Error('OpenAI API returned an error');
  } else {
    return response!.data.choices[0].message?.content;
  }
};

(async () => {
  // writeStringsToJsonFile(
  //   splitString(AMA44RAW),
  //   'scripts/data/AMA44/AMA44.json'
  // );

  const andy: EncodedString[] = JSON.parse(
    fs.readFileSync('scripts/data/AMA44/AMA44.json', 'utf8')
  );

  const chunks: Chunk[] = [];

  // const andyTry = andy.slice(17);

  for (let i = 0; i < andy.length; i++) {
    const chunk = andy[i];
    console.log(chunk.content.length);
    const content = await chatCompletetion(chunk.content);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.log(e);

      const tryContent = await onParseFailure(content);

      try {
        parsed = JSON.parse(tryContent);
      } catch (e) {
        console.log(e);
        continue;
      }
    }

    for (let j = 0; j < parsed.length; j++) {
      const chunk = parsed[j];
      chunks.push({
        title: chunk.title,
        date: '2023-04-21',
        context:
          'Training principles for mass and strength, changing views on nutrition, creatine supplementation, and more.',
        people: 'Layne Norton, Peter Attia',
        content: chunk.content.trim(),
        content_length: chunk.content.trim().length,
        content_tokens: encode(chunk.content.trim()).length,
        embedding: [],
      });
    }

    console.log(content.length);
  }

  const filePath = 'scripts/data/AMA44/AMA44Parsed.json';

  const jsonContent = JSON.stringify(chunks, null, 1);

  fs.writeFile(filePath, jsonContent, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing to file ${filePath}:`, err);
    } else {
      console.log(`Successfully wrote strings to ${filePath}`);
    }
  });
})();
