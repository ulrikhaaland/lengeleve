import { PromptItem } from '@/utils/getQueryPrompt';
import { OpenAIStream } from '@/utils';
import { Settings } from '@/stores/settings.store';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { promptItem, apiKey, settings } = (await req.json()) as {
      promptItem: PromptItem[];
      apiKey: string;
      settings: Settings;
    };
    const stream = await OpenAIStream(promptItem, apiKey, settings);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    throw new Error(error as string);
  }
};

export default handler;
