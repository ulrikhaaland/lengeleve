import axios from 'axios';
import fs from 'fs';
import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';
import { Configuration, OpenAIApi } from 'openai';

loadEnvConfig('');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

async function fetchFineTunedResponses(): Promise<any[]> {
  const { data, error } = await supabase
    .from('fine_tuned_responses')
    .select('*');
    
  if (error || !data) {
    console.error('Error fetching fine-tuned responses:', error);
    return [];
  }
  return data;
}

async function formatDataForFineTuning(data: any[]): Promise<string> {
  const systemMessage = {
    role: 'system',
    content:
      'You are an assistant with expertise in exercise physiology, nutrition, longevity, and medicine.' +
      "You'll analyze questions and provide answers about health, nutrition, and exercise.",
  };

  const formattedData = data.map((row) => ({
    messages: [
      systemMessage,
      {
        role: 'user',
        content: row.question,
      },
      {
        role: 'assistant',
        content: row.answer,
      },
    ],
  }));

  // Writing each JSON object to separate lines in the file
  const fileContent = formattedData
    .map((entry) => JSON.stringify(entry))
    .join('\n');
  const filePath = 'scripts/fine_tune_data.json';
  fs.writeFileSync(filePath, fileContent);
  return filePath;
}

async function uploadFileToOpenAI(filePath: string): Promise<string> {
  const apiUrl = 'https://api.openai.com/v1/files';
  const apiKey = process.env.OPENAI_API_KEY;

  const fileStream = fs.createReadStream(filePath);

  const form = new FormData();
  form.append('purpose', 'fine-tune');
  form.append('file', fileStream);

  const response = await axios.post(apiUrl, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response.data.id; // Returns the TRAINING_FILE_ID
}

async function createFineTuningJob(trainingFileId: string) {
  const apiUrl = 'https://api.openai.com/v1/fine_tuning/jobs';
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const response = await axios.post(
      apiUrl,
      {
        training_file: trainingFileId,
        model: 'gpt-3.5-turbo-0613',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    return response.data; // Returns data about the fine-tuning job
  } catch (error: any) {
    if (error.response) {
      // The request was made, but the server responded with a status code outside the range of 2xx
      console.error('Server responded with an error:', error.response.data);
    } else if (error.request) {
      // The request was made, but no response was received
      console.error('No response received from the server:', error.request);
    } else {
      // Something happened in setting up the request that triggered an error
      console.error('Error in setting up the request:', error.message);
    }
    throw error; // Re-throw the error if you want it to propagate up
  }
}

async function main() {
  const data = await fetchFineTunedResponses();
  const filePath = await formatDataForFineTuning(data);
  const trainingFileId = await uploadFileToOpenAI(filePath);
  const jobData = await createFineTuningJob(trainingFileId);
  console.log(jobData);
}

main();
