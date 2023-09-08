import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { loadEnvConfig } from '@next/env';
import { Configuration, OpenAIApi } from 'openai';
import endent from 'endent';

loadEnvConfig('');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

type TrainingContent = {
  title: string;
  date: string;
  context: string;
  content: string;
  questionsAnswers: FineTuned[];
  chunkID: number;
};

async function fetchDataFromSupabase(): Promise<TrainingContent[]> {
  const { data, error } = await supabase
    .from('training')
    .select('id, title, date, context, content')
    .range(800, 900); // fetches rows 50 to 100 (0-based indexing)

  if (error) {
    console.error('Error fetching data:', error);
    return [];
  }

  // Transform the data to match the TrainingContent type
  return data!.map((row) => ({
    chunkID: row.id,
    title: row.title,
    date: row.date,
    context: row.context,
    content: row.content,
    questionsAnswers: [], // This will be populated by the OpenAI analysis
  }));
}

async function chatCompletetion(content: TrainingContent) {
  let response: any;

  try {
    const prompt = endent`
    We're fine-tuning a language model. Assume expertise in exercise physiology, nutrition, longevity, and medicine. You'll analyze content about health, nutrition, and exercise.

    Details:
    - Topic: ${content.context}
    - Date: ${content.date}
    - Title: ${content.title}
    - Content: "${content.content}"
    
    Your tasks:
    1. Identify questions that the content answers.
    2. Formulate these questions as the general public would ask them.
    3. Specify which part of the content answers each question.
    4. You will respond only with a JSON list containg each question the content text answers and the part of the content text that answers that question as JSON format: {question: [the question the content text answers], answer: [the part of the content text that answers said question]}.
    It is crucial to respond in the JSON Format as requested.
    
    Guidelines:
    - Only provide clear, specific questions and answers.
    - If an answer is partial, use your expertise to complete it.
    - Ensure all answers are in complete sentences. If not, modify them accordingly.
    - If the content provided does not provide any specific information or answer any questions. Please respond with an empty JSON list. 
    `;

    response = await openai.createChatCompletion({
      model: 'gpt-4',
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
    console.log(configuration.apiKey);
    response = e.response;
  }

  if (!response || response!.status !== 200) {
    if (response?.status === 429) {
      console.log('Too many requests, waiting 60 seconds');
      await new Promise((resolve) => setTimeout(resolve, 60000));
      return chatCompletetion(content);
    }
    return null;
    throw new Error('OpenAI API returned an error');
  } else {
    return response!.data.choices[0].message?.content;
  }
}

async function uploadToSupabase(content: TrainingContent): Promise<void> {
  for (let qa of content.questionsAnswers) {
    const { error: qaError } = await supabase
      .from('fine_tuned_responses')
      .insert([
        {
          question: qa.question,
          answer: qa.answer,
          contentid: content.chunkID,
        },
      ]);

    if (qaError) {
      console.error('Error inserting question/answer:', qaError);
    }
  }
}

async function main() {
  const contents = await fetchDataFromSupabase();

  for (let i = 0; i < contents.length; i++) {
    const content = contents[i];
    console.log('INDEX: ' + i + ' ID: ' + content.chunkID);
    const analysis = await chatCompletetion(content);
    const parsedResponse: FineTuned[] = JSON.parse(analysis);

    content.questionsAnswers = parsedResponse;

    if (parsedResponse.length > 0) {
      for (let qa of parsedResponse) {
        console.log('Question: ' + qa.question);
        console.log('Answer: ' + qa.answer);
      }

      await uploadToSupabase(content);
    }
  }
}

main();

type FineTuned = {
  question: string;
  answer: string;
};

// const promptV1 = endent`
// We are parsing content for fine tuning a large language model.
// Act as a quadruple PhD in exercise physiology, nutrition, longevity, and medicine.
// Your job is to answer questions about health, nutrition, and exercise.
// The following content is on the topic of ${content.context},
// discussed at the following date ${content.date},
// and is titled ${content.title}.
// We need questions and answers for the content text: "${content.content}".
// Does the content text answer any questions, if so, what questions?
// Please write the the question to each answer in the most generic way, as most people would ask it.
// What part of the content text answers what question?
// You will respond only with a JSON list containg each question the content text answers and the part of the content text that answers that question as JSON format: {question: [the question the content text answers], answer: [the part of the content text that answers said question]}.
// It is crucial to respond in the JSON Format as requested. Another important thing: Don't return vague questions and answers, it is better to not return anything, than returning question and answer that are inadequate.
// Finally, something that you must get right: If a question is partially answered, please expand upon the answer with your own knowledge, it is crucial to always give a complete answer to the question being asked.
// Lastly, make sure to only return answers that have complete sentences, if they are not complete, you must complete them with your own knowledge.`;
