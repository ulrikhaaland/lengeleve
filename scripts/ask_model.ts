import axios from 'axios';
import { loadEnvConfig } from '@next/env';
import { Configuration, OpenAIApi } from 'openai';

loadEnvConfig('');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ChatCompletionResponse {
  status?: number;
  data?: {
    choices: {
      message: {
        content: string;
      };
    }[];
  };
  response?: any;
}

async function askModel(question: string, modelName: string): Promise<string> {
  const prompt = `You are an assistant with expertise in exercise physiology, nutrition, longevity, and medicine. Analyze questions and provide answers about health, nutrition, and exercise. Question: ${question}`;

  let response;

  try {
    response = await openai.createChatCompletion({
      model: modelName,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.0,
      max_tokens: 2000,
    });
  } catch (e: any) {
    console.log(e);
    console.log(OPENAI_API_KEY);
    response = e.response;
  }

  if (!response || response!.status !== 200) {
    if (response?.status === 429) {
      console.log('Too many requests, waiting 60 seconds');
      await new Promise((resolve) => setTimeout(resolve, 60000));
      return askModel(question, modelName);
    }
    throw new Error('OpenAI API returned an error');
  } else {
    return response!.data!.choices[0].message?.content.trim();
  }
}

async function main(question: string) {
  const fineTunedResponse = await askModel(
    question,
    'ft:gpt-3.5-turbo-0613:galante::81Aiojgv'
  );
  const regularResponse = await askModel(question, 'gpt-3.5-turbo-0613');

  console.log('Fine-Tuned Model Response:', fineTunedResponse);
  console.log('Regular Model Response:', regularResponse);
}

// Example: You can replace the question below with any of your choice.
main('What is the RQ test used for??');
