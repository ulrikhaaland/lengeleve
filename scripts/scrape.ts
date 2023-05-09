import puppeteer, { Page } from 'puppeteer';
import * as fs from 'fs';
import csv from 'csv-parser';
import { encode } from 'gpt-3-encoder';
import { createClient } from '@supabase/supabase-js';
import { Configuration, OpenAIApi } from 'openai';
import { loadEnvConfig } from '@next/env';
import { JSDOM } from 'jsdom';
import { Dish, Restaurant } from '@/types';

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
  chunks?: Restaurant[];
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

const generateEmbeddings = async (chunks: Restaurant[]): Promise<void> => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (let i = 0; i < chunks.length; i++) {
    // const chunk = chunks[i];
    // const {
    //   title,
    //   date,
    //   content,
    //   context,
    //   people,
    //   content_length,
    //   content_tokens,
    // } = chunk;
    // const embeddingResponse = await openai.createEmbedding({
    //   model: 'text-embedding-ada-002',
    //   input: content,
    // });
    // const [{ embedding }] = embeddingResponse.data.data;
    // const { data, error } = await supabase
    //   .from('training')
    //   .insert({
    //     title,
    //     date,
    //     context,
    //     people,
    //     content,
    //     content_length,
    //     content_tokens,
    //     embedding,
    //   })
    //   .select('*');
    // if (error) {
    //   console.log('error', error);
    // } else {
    //   console.log('saved', i, i);
    // }
    // await new Promise((resolve) => setTimeout(resolve, 200));
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

const checkForAndCloseLoginDialog = async (page: Page) => {
  const element = await page.$('.sc-b8df2b91-0.ljUssp');
  if (element) {
    await element.click();
    console.log('Element clicked');
  } else {
    console.log('Element not found, moving on');
  }
};

const scrape = async (
  restaurant: any,
  rerun: boolean = false
): Promise<Restaurant> => {
  const price = restaurant['price'];
  const url: string = restaurant['link'];
  const title: string = restaurant['title'];

  const browser = await puppeteer.launch({ headless: !rerun });
  const page = await browser.newPage();
  await page.goto(url);

  try {
    // accept privacy policy
    await page.click('.sc-eda0895a-2.kcvQDI');

    await page.waitForTimeout(5000);

    // Wait for more information button
    await page.waitForSelector('.sc-31447687-0.kWYCdN', {
      timeout: rerun ? 5000 : 1000,
    });

    // Click the button with the specified classname to open the dialog
    await page.click('.sc-31447687-0.kWYCdN');

    const waitForSelectorWithTimeout = async (
      selector: string,
      timeout: number
    ) => {
      try {
        await page.waitForSelector(selector, { timeout });
      } catch (error) {
        console.log(
          `Element with selector '${selector}' not found within the given timeout, moving on.`
        );
      }
    };

    // Wait for the dialog elements to appear
    await waitForSelectorWithTimeout(
      '.sc-28740013-0.gRpRjN',
      rerun ? 5000 : 1000
    );
    await waitForSelectorWithTimeout(
      '.sc-9ee401a5-2.bTmyip',
      rerun ? 5000 : 1000
    );
    await waitForSelectorWithTimeout(
      '.sc-1fe0cb69-0.gDRdqW',
      rerun ? 5000 : 1000
    );
  } catch (error) {
    await browser.close();
    console.log('Rerunning: ' + title);
    return scrape(restaurant, true);
  }

  // Fetch the text content of the <div> element with the specified classname
  const divElement = await page.$('.sc-28740013-0.gRpRjN');
  const address = divElement
    ? await page.$eval('.sc-28740013-0.gRpRjN', (div: Element) => {
        const divElement = div as HTMLDivElement;
        return divElement.textContent;
      })
    : undefined;

  // Fetch the text content of the <table> element with the specified classname
  const tableElement = await page.$('.sc-9ee401a5-2.bTmyip');
  const openingHours = tableElement
    ? await page.$eval('.sc-9ee401a5-2.bTmyip', (table: Element) => {
        const tableElement = table as HTMLTableElement;
        return tableElement.textContent;
      })
    : undefined;

  // Fetch the text content of all the <a> elements with the specified classname
  const contactElements = await page.$$('.sc-1fe0cb69-0.gDRdqW');
  const contact = contactElements.length
    ? await page.$$eval('.sc-1fe0cb69-0.gDRdqW', (aElements: Element[]) =>
        aElements.map((a: Element) => {
          const aElement = a as HTMLAnchorElement;
          return aElement.textContent;
        })
      )
    : undefined;

  // Close the dialog
  await page.click('.sc-b8df2b91-0.ljUssp');

  // Fetch the text content of all the <a> elements with the specified classname in the results function
  const categories = await page.$$eval(
    '.sc-1fe0cb69-0.gMWbKL.sc-4421a4fa-6.jNmnLj',
    (aElements: Element[]) =>
      aElements.map((a: Element) => {
        const aElement = a as HTMLAnchorElement;
        return aElement.textContent;
      })
  );

  // Find all button elements with the specified classname
  const results = await page.$$eval(
    'button.sc-31d77e20-1.lnDhFy',
    (buttons: HTMLButtonElement[]) => {
      return buttons.map((button) => {
        // Extract the text from the <h3> element with the specified classname
        const h3Element = button.querySelector('h3.sc-979c4fba-2.kFXweV');
        const h3Text = h3Element ? h3Element.textContent : '';

        // Extract the text from the first <p> element with the specified classname
        const pElement1 = button.querySelector('p.sc-979c4fba-0.deohUF');
        const pText1 = pElement1 ? pElement1.textContent : '';

        // Extract the text from the second <p> element with the specified classname
        const pElement2 = button.querySelector('p.sc-91d4e765-1.cURerU');
        const pText2 = pElement2 ? pElement2.textContent : '';

        // Extract the image link from the <img> element with the specified classname
        const imgElement = button.querySelector(
          'img.sc-36a7e468-1.flwxdV'
        ) as HTMLImageElement;
        const imgSrc = imgElement ? imgElement.src : '';

        const popular = !!button.querySelector('span.sc-22183055-1.kNEbpF');

        return { h3Text, pText1, pText2, imgSrc, popular };
      });
    }
  );

  const scrapedData = await page.$$eval(
    'button.sc-8c9b94e6-0.gXfAhD',
    (buttons: Element[]) => {
      return buttons.map((button: Element) => {
        const h3Text = button.querySelector(
          '.sc-5ba2664-2.gskVzg'
        )?.textContent;
        const pText1 = button.querySelector('.sc-5ba2664-0.ljehg')?.textContent;
        const pText2 = button.querySelector(
          '.sc-91d4e765-1.cURerU'
        )?.textContent;
        const imgElement = button.querySelector('img.sc-36a7e468-1.flwxdV');
        const imgSrc = imgElement ? (imgElement as HTMLImageElement).src : null;
        const popular = !!button.querySelector('span.sc-22183055-1.kNEbpF');

        return {
          h3Text,
          pText1,
          pText2,
          imgSrc,
          popular,
        };
      });
    }
  );

  const data = results.length > 0 ? results : scrapedData;

  await browser.close();

  // Id
  const restaurantId: string = url.split('/restaurant/')[1];
  // Address
  const restaurantAddress = address?.split('Adresse')[1].split('Se kart')[0];

  // Price
  let restaurantPrice: number | undefined;

  if (price) {
    // Using regex to find the content of the first span
    const regex = /<span>(.*?)<\/span>/;
    const match = price.match(regex);

    if (match && match[1]) {
      const dollarCount = match[1]
        .split('')
        .filter((char: string) => char === '$').length;
      restaurantPrice = dollarCount;
    }
  }

  // Rating
  const restaurantRating = restaurant['rating']
    ? Number(restaurant['rating'])
    : undefined;
  // Image
  const restaurantCoverImg: string = restaurant['img'];
  // Categories

  const restaurantDescription: string = restaurant['subtitle'];

  const restaurantOpeningHours =
    openingHours === null ? undefined : openingHours;

  const restaurantCategories = categories.map((category: string | null) => {
    if (category !== null) {
      return category;
    }
  });

  const restaurantHomePage =
    contact !== null && contact ? contact[1] : undefined;
  const restaurantPhone = contact !== null && contact ? contact[0] : undefined;
  const restaurantWoltPage = url;
  const restaurantDishes: Dish[] = [];

  const restaurantObject: Restaurant = {
    id: restaurantId,
    name: title,
    address: restaurantAddress,
    description: restaurantDescription,
    rating: restaurantRating,
    priceLevel: restaurantPrice,
    coverImg: restaurantCoverImg,
    categories: restaurantCategories,
    dishes: restaurantDishes,
    openingHours: restaurantOpeningHours,
    homepage: restaurantHomePage,
    woltPage: restaurantWoltPage,
    phone: restaurantPhone,
  };

  for (let i = 0; i < data.length; i++) {
    const { h3Text, pText1, pText2, imgSrc, popular } = data[i];

    let dishPrice: number | undefined;

    if (pText2) {
      const strippedString = pText2.replace(/[^0-9,.]/g, '');
      const parsedNumber = parseFloat(strippedString.replace(',', '.'));
      dishPrice = parsedNumber;
    }

    const dish: Dish = {
      id: undefined,
      restaurantId: restaurantId,
      name: h3Text ?? undefined,
      description: pText1 ?? undefined,
      price: dishPrice ?? undefined,
      imgUrl: imgSrc ?? undefined,
      popular: popular ?? undefined,
    };

    restaurantObject.dishes!.push(dish);
  }

  return restaurantObject;
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
            'I will give you a chunk of text. You will extract the parts that is relevant to disease. You will not use any personal names. You will leave out parts where they talk about peoples backgrounds. Then you will combine the relevant text into a chunks, give each chunk a title, and only return a JSON list containg each chunk as JSON format: {title: title, content: content}. It is crucial to respond in the JSON Format as requested.',
        },
        {
          role: 'user',
          content: content,
        },
      ],
      temperature: 0.0,
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

const parse = async (scraped: Scraped): Promise<Restaurant[]> => {
  const chunks: Restaurant[] = [];

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

      try {
        chunk.content.trim();
      } catch (error) {
        continue;
      }

      // chunks.push({
      //   title: chunk.name,
      //   date: scraped.date,
      //   context: scraped.category,
      //   people: 'Peter Attia',
      //   content: chunk.content.trim(),
      //   content_length: chunk.content.trim().length,
      //   content_tokens: encode(chunk.content.trim()).length,
      //   embedding: [],
      // });
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

async function runScrape(row: any): Promise<Restaurant> {
  const number = row['position'];
  const title = row['title'];
  const url = row['link'];
  const price = row['price'];

  return await scrape(row);

  // console.log('scraping: ' + title);

  // const content = splitString(scrapeItem!.content);
  // scrapeItem!.contentEncoded = content;
  // const jsonContent = JSON.stringify(content, null, 2);
  // fs.writeFileSync(`scripts/data/json/${scrapeItem!.title}.json`, jsonContent);
  // const parsed = await parse(scrapeItem!);
  // scrapeItem!.chunks = parsed;

  // await generateEmbeddings(scrapeItem!.chunks!);
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

async function insertRestaurants(restaurants: Restaurant[]): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const restaurant of restaurants) {
    const { data: insertedRestaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert([
        {
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          description: restaurant.description,
          rating: restaurant.rating,
          price_level: restaurant.priceLevel,
          cover_img: restaurant.coverImg,
          opening_hours: restaurant.openingHours,
          homepage: restaurant.homepage,
          wolt_page: restaurant.woltPage,
          phone: restaurant.phone,
        },
      ])
      .single();

    if (restaurantError) {
      console.error('Error inserting restaurant:', restaurantError);
      continue;
    }

    const restaurantId = restaurant?.id;
    if (!restaurantId) continue;

    if (restaurant.categories) {
      for (const category of restaurant.categories) {
        if (category) {
          await supabase.from('restaurant_categories').insert([
            {
              restaurant_id: restaurantId,
              category: category,
            },
          ]);
        }
      }
    }

    if (restaurant.dishes) {
      for (const dish of restaurant.dishes) {
        await supabase.from('dishes').insert([
          {
            restaurant_id: restaurantId,
            name: dish.name,
            description: dish.description,
            price: dish.price,
            img_url: dish.imgUrl,
            popular: dish.popular,
          },
        ]);
      }
    }
  }
}

async function startScrape(results: any[]) {
  const restaurants: Restaurant[] = [];

  for (let i = 450; i < 500; i++) {
    const row = results[i];
    const r = await runScrape(row);

    restaurants.push(r);

    console.log('generated embeddings for: ' + row['title']);
  }

  console.log(
    'Inserting ' + restaurants.length + ' restaurants' + ' into database'
  );

  await insertRestaurants(restaurants);
}

async function main() {
  const results: any[] = [];

  fs.createReadStream('scripts/data/wolt.csv')
    .pipe(csv())
    .on('data', (data: any) => results.push(data))
    .on('end', () => {
      startScrape(results);
    });
}

main().catch((error) => {
  console.error('Error:', error);
});
