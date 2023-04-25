import { openai } from './openAIConfig';

export const getFollowUpQuestions = async (question: string, answer: string) => {
  let response;

  try {
    response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-0301',
      messages: [
        {
          role: 'user',
          content:
            'This is an answer to a question a user asked my chatbot.' +
            '\n\n' +
            'It primarily answer questions about health, nutrition and exercise, specifically related to longevity, and how to live a long and healthy life.' +
            '\n\n' +
            'Question: ' +
            question +
            '\n\n' +
            'Answer: ' +
            answer +
            '\n\n' +
            'Based on the question and the answer to the question, create 3 follow-up questions that the user might be likely to ask.' +
            '\n\n' +
            'Then return the questions as a JSON-list.' +
            'Return only the questions, not answers.' +
            'Return each answer as a JSON object in a list: [{"question": "Question 1"}, {"question": "Question 2"}, {"question": "Question 3"}]',
        },
      ],
      max_tokens: 1000,
      temperature: 0.0,
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
