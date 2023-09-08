import axios from "axios";
import fs from "fs";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import FormData from "form-data";
import { Configuration, OpenAIApi } from "openai";

loadEnvConfig("");

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
    .from("fine_tuned_responses")
    .select("*");
  if (error || !data) {
    console.error("Error fetching fine-tuned responses:", error);
    return [];
  }
  return data;
}

async function formatDataForFineTuning(data: any[]): Promise<string> {
  const formattedData = {
    messages: data.flatMap((row) => [
      {
        role: "system",
        content:
          "You are an assistan with expertise in exercise physiology, nutrition, longevity, and medicine." +
          "You'll analyze question and provide answers about health, nutrition, and exercise.",
      },
      {
        role: "user",
        content: row.question,
      },
      {
        role: "assistant",
        content: row.answer,
      },
    ]),
  };

  const filePath = "scripts/fine_tune_data.json";
  fs.writeFileSync(filePath, JSON.stringify(formattedData, null, 2));
  return filePath;
}

async function uploadFileToOpenAI(filePath: string): Promise<string> {
  const apiUrl = "https://api.openai.com/v1/files";
  const apiKey = process.env.OPENAI_API_KEY;

  const fileStream = fs.createReadStream(filePath);

  const form = new FormData();
  form.append("purpose", "fine-tune");
  form.append("file", fileStream);

  const response = await axios.post(apiUrl, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response.data.id; // Returns the TRAINING_FILE_ID
}

async function createFineTuningJob(trainingFileId: string) {
  const apiUrl = "https://api.openai.com/v1/fine_tuning/jobs";
  const apiKey = process.env.OPENAI_API_KEY;

  const response = await axios.post(
    apiUrl,
    {
      training_file: trainingFileId,
      model: "gpt-3.5-turbo-0613",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  return response.data; // Returns data about the fine-tuning job
}

async function main() {
  const data = await fetchFineTunedResponses();
  const filePath = await formatDataForFineTuning(data);
  const trainingFileId = await uploadFileToOpenAI(filePath);
  const jobData = await createFineTuningJob(trainingFileId);
  console.log(jobData);
}

main();
