import puppeteer from 'puppeteer';
import * as fs from 'fs';
import csv from 'csv-parser';
import {
  EncodedString,
  chatCompletetion,
  onParseFailure,
  splitString,
} from './parse';
import { encode } from 'gpt-3-encoder';
import { Chunk } from '@/types';

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

  let { content, category, date } = await page.evaluate(() => {
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

    const fullTextContent = contentElement.textContent;
    const showNotesIndex = fullTextContent!.indexOf('Show Notes');
    const selectedLinksIndex = fullTextContent!.indexOf('Selected Links');

    let content = contentElement.textContent;

    if (showNotesIndex !== -1 && selectedLinksIndex !== -1) {
      content = fullTextContent!
        .slice(showNotesIndex, selectedLinksIndex)
        .trim();
    }

    return { content, category, date };
  });

  await browser.close();

  if (title && content) {
    content = content.trim();

    console.log('Title:', title.replace(/\s+/g, ' ').trim());
    console.log('Content:', content.trim());

    const jsonContent = JSON.stringify({ title, content }, null, 2);
    fs.writeFileSync(`scripts/data/raw/${title}.json`, jsonContent);
    return { position, title, content, category, date };
  } else {
    console.log('Could not find the specified text or title.');
    return undefined;
  }
};

const parse = async (scraped: Scraped): Promise<Chunk[]> => {
  const chunks: Chunk[] = [];

  // const andyTry = andy.slice(17);

  for (let i = 0; i < scraped.contentEncoded!.length; i++) {
    const chunk = scraped.contentEncoded![i];
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

async function runScrape(data: any[]) {
  const scraped: Scraped[] = [];

  for (let i = 0; i < 1; i++) {
    const row = data[i];

    const number = row['position'];
    const title = row['title'];
    const url = row['link'];

    const scrapeItem = await scrape(number, title, url);

    if (scrapeItem) {
      scraped.push(scrapeItem);
    }
  }

  for (let i = 0; i < scraped.length; i++) {
    const item = scraped[i];
    const content = splitString(item.content);
    item.contentEncoded = content;
    const jsonContent = JSON.stringify(content, null, 2);
    fs.writeFileSync(`scripts/data/json/${item.title}.json`, jsonContent);
    const parsed = await parse(item);
    item.chunks = parsed;
  }

  console.log(scraped);
}

async function main() {
  const results: any[] = [];

  fs.createReadStream('scripts/csvdata.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      runScrape(results);
    });
}

main().catch((error) => {
  console.error('Error:', error);
});
