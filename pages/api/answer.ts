import { PromptItem } from '@/utils/getQueryPrompt';
import { OpenAIStream } from '@/utils';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { prompt, apiKey } = (await req.json()) as {
      prompt: PromptItem[];
      apiKey: string;
    };
    const stream = await OpenAIStream(prompt, apiKey);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    throw new Error(error as string);
  }
};

export default handler;
