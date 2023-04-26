import { openai } from './openAIConfig';

export const getPreQuestion = async (question: string) => {
  let response;

  try {
    response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-0301',
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });
  } catch (e) {
    console.log(process.env.REACT_APP_OPEN_AI_API_KEY);
    console.log(e);
    throw new Error('Error in GPT-3 request');
  }

  if (response.status !== 200) {
    throw new Error('OpenAI API returned an error');
  }

  const message = response.data.choices[0].message?.content;

  return message;
};
