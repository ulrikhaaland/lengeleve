import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { Chunk } from "@/types";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";

dotenv.config({ path: "./.env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // Supabase Project URL from .env.local
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Supabase Service Role Key from .env.local
);

export { supabaseAdmin };

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

const handler = async (
  query: string,
  apiKey: string,
  matches: number
): Promise<{ data: any; status: number }> => {
  try {
    const input = query.replace(/\n/g, " ");

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = (await res.json()) as EmbeddingResponse;
    const embedding = json.data[0].embedding;

    const { data: chunks, error } = await supabaseAdmin.rpc("training_search", {
      query_embedding: embedding,
      similarity_threshold: 0.01,
      match_count: matches,
    });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return { data: chunks, status: 200 };
  } catch (error) {
    console.error(error);
    return { data: "Error", status: 500 };
  }
};

export default handler;

// Function to save chunks to a JSON file in the 'writings' directory
function saveChunksToFile(chunks: Chunk[], query: string) {
  // Ensure the 'writings' folder exists
  const directoryPath = path.join(__dirname, "..", "writings");
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath);
  }

  // Define the file path inside the 'writings' folder
  const filePath = path.join(directoryPath, `${query}_chunks.json`);

  fs.writeFile(filePath, JSON.stringify(chunks, null, 2), "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log(`Saved chunks to ${filePath}`);
    }
  });
}

async function main() {
  const query = "zone 2";

  const response = await handler(
    query,
    "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",
    200
  );

  if (response.status === 200) {
    const chunks = response.data;
    console.log(chunks);
    saveChunksToFile(chunks, query.replaceAll(" ", "_"));
  } else {
    console.error("Error fetching chunks:", response.data);
  }
}

main().catch((error) => {
  console.error("Error:", error);
});
