import puppeteer from 'puppeteer';
import * as fs from 'fs';
import csv from 'csv-parser';
import { encode } from 'gpt-3-encoder';
import { Chunk } from '@/types';
import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'openai';
import { loadEnvConfig } from '@next/env';
import { JSDOM } from 'jsdom';

const loginUrl = 'https://peterattiamd.com/login/';
const targetUrl = 'https://peterattiamd.com/ama39/';
const username = 'ulrikhaaland2@gmail.com';
const password = 'Ulrik1994';

export type Scraped = {
  position: number;
  title: string;
  content: string;
  category: string;
  date: string;
  contentEncoded?: EncodedString[];
  chunks?: Chunk[];
};

export type EncodedString = {
  content: string;
  contentLength: number;
  encodedLength: number;
};

loadEnvConfig('');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

const generateEmbeddings = async (chunks: Chunk[]): Promise<void> => {
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
  return;
};

const extractText = (firstH4: Element, secondH4: Element): string => {
  let extractedText = '';
  let currentElement = firstH4.nextSibling;

  while (currentElement && currentElement !== secondH4) {
    if (currentElement.nodeType === Node.TEXT_NODE) {
      extractedText += currentElement.textContent;
    } else if (currentElement.nodeType === Node.ELEMENT_NODE) {
      extractedText += currentElement.textContent;
    }
    currentElement = currentElement.nextSibling;
  }

  return extractedText;
};

const scrape = async (
  position: number,
  title: string,
  url: string
): Promise<Scraped | undefined> => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(loginUrl);

  await page.type('#user_login', username);
  await page.type('#user_pass', password);
  await page.click('#wp-submit');

  await page.waitForTimeout(2000);
  await page.goto(url);
  await page.waitForTimeout(2000);

  let { content, category, date, firstH4 } = await page.evaluate(() => {
    console.log('asd');

    const titleElement = document.querySelector(
      '.heading--page'
    ) as HTMLElement;
    const categoryElement = document.querySelector(
      '.list-item__category'
    ) as HTMLElement;
    const dateElement = document.querySelector(
      '.list-item__meta'
    ) as HTMLElement;
    const contentElement = document.querySelector(
      '.content--post'
    ) as HTMLElement;

    const title = titleElement.textContent;
    const category = categoryElement.textContent!;
    const date = dateElement.textContent!;

    const firstH4 = contentElement.querySelector('h4[id="notes"]:nth-child(1)');
    const secondH4 = contentElement.querySelector(
      'h4[id="notes"]:nth-child(2)'
    );

    console.log('ASDASDASDASDSAD');

    const content =
      firstH4 && secondH4
        ? extractText(firstH4, secondH4).trim()
        : contentElement.textContent;

    return { content, category, date, firstH4 };
  });

  await browser.close();

  if (title && content) {
    content = content.trim();
    date = date.replace('\n', '').trim();
    console.log('Title:', title.replace(/\s+/g, ' ').trim());
    // console.log("Content:", content.trim());

    const jsonContent = JSON.stringify({ title, content }, null, 2);
    fs.writeFileSync(`scripts/data/raw/${title}.json`, jsonContent);
    return { position, title, content, category, date };
  } else {
    console.log('Could not find the specified text or title.');
    return undefined;
  }
};
export const onParseFailure = async (failedContent: string) => {
  let response: any;

  try {
    response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-0301',
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
      model: 'gpt-3.5-turbo-0301',
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
async function PP(content: any, tries?: number): Promise<any> {
  let parsed;

  if (tries === 3) return undefined;

  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.log(e);

    const tryContent = await onParseFailure(content);

    try {
      parsed = JSON.parse(tryContent);
    } catch (e) {
      PP(content, tries ? tries + 1 : 1);
    }
  }

  return parsed;
}

const parse = async (scraped: Scraped): Promise<Chunk[]> => {
  const chunks: Chunk[] = [];

  // const andyTry = andy.slice(17);

  for (let i = 0; i < scraped.contentEncoded!.length; i++) {
    const chunk = scraped.contentEncoded![i];
    console.log(chunk.content.length);
    let content;
    try {
      content = await chatCompletetion(chunk.content);
    } catch (error) {
      content = await chatCompletetion(chunk.content);
    }

    let parsed = await PP(content);

    if (!parsed || parsed?.length === 0) {
      continue;
    }

    for (let j = 0; j < parsed.length; j++) {
      const chunk = parsed[j];
      chunks.push({
        title: chunk.title,
        date: scraped.date,
        context: scraped.category,
        people: 'Peter Attia',
        content: chunk.content.trim(),
        content_length: chunk.content.trim().length,
        content_tokens: encode(chunk.content.trim()).length,
        embedding: [],
      });
    }

    console.log(content.length);
  }

  const filePath = `scripts/data/jsonParsed/${scraped.title}.json`;

  const jsonContent = JSON.stringify(chunks, null, 1);

  fs.writeFile(filePath, jsonContent, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing to file ${filePath}:`, err);
    } else {
      console.log(`Successfully wrote strings to ${filePath}`);
    }
  });

  return chunks;
};

async function runScrape(row: any) {
  const number = row['position'];
  const title = row['title'];
  const url = row['link'];

  const scrapeItem = await scrape(number, title, url);

  console.log('scraping: ' + title);

  const content = splitString(scrapeItem!.content);
  scrapeItem!.contentEncoded = content;
  const jsonContent = JSON.stringify(content, null, 2);
  fs.writeFileSync(`scripts/data/json/${scrapeItem!.title}.json`, jsonContent);
  const parsed = await parse(scrapeItem!);
  scrapeItem!.chunks = parsed;

  await generateEmbeddings(scrapeItem!.chunks!);
}

function removeHtmlElementsAndLinks(input: string): string {
  const dom = new JSDOM(input);

  // Return the text content without any HTML tags
  const textContent = dom.window.document.body.textContent || '';

  const startSearchString = 'Show Notes*';
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

  return result;
}
async function startScrape(results: any[]) {
  for (let i = 83; i < results.length; i++) {
    const row = results[i];
    await runScrape(row);
    console.log('generated embeddings for: ' + row['title']);
  }
}

async function main() {
  const results: any[] = [];

  fs.createReadStream('scripts/csvdata.csv')
    .pipe(csv())
    .on('data', (data: any) => results.push(data))
    .on('end', () => {
      startScrape(results);
    });
}

main().catch((error) => {
  console.error('Error:', error);
});
