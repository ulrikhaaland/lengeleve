import endent from 'endent';
import { openai } from './openAIConfig';

export const getPreQuestion = async (previousQuestion: string[]) => {
  let response;

  try {
    response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-0301',
      messages: [
        {
          role: 'user',
          content: endent`
            I need a question, in Norwegian Bokmål, for a chatbot trained on IT Company 'Netpower's' handbook that is related to my companys handbook, and is not too long.
            It should be something an employee would ask in relation to the handbook.
            Assure that the question is not identical to any of the previous questions.
            The previous questions are delimited by triple quotes.
            """${previousQuestion.join('\n')}"""
            The question must be maximally 8 words long. This is very important!
            Your response must only consist of Norwegian Bokmål.
            Never use English or any other language than Norwegian.
            Never translate to english.
            Never use the word "policy" in your question.
            `,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });
  } catch (e) {
    console.log(e);
    throw new Error('Error in GPT-3 request');
  }

  if (response.status !== 200) {
    throw new Error('OpenAI API returned an error');
  }

  const message = response.data.choices[0].message?.content;

  return message;
};
