import endent from 'endent';
import { openai } from './openAIConfig';

export const getPreQuestion = async (previousQuestion: string[]) => {
  let response;

  try {
    response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: endent`
            I need a question that is health related, it should be related to any of these: exercise, nutrition, sleep, zone 2, VO2 Max, alcohol, cardiovascular health, lipids, cholesterol, blood pressure, blood sugar, or something similar.
            The question should start with the word 'How', 'What', or 'Why'.
            The question should be specific and advanced, it should not be a general question.
            The question is to be answered by a quadruple PhD in exercise physiology, nutrition, longevity, and medicine, it can be very specific.
            Assure that the question is not identical to any of the previous questions.
            The previous questions are delimited by triple quotes.
            """${previousQuestion.join('\n')}"""
            The question should be something that a person who is interested in health, nutrition and exercise would ask.
            The question must be maximally 5 words long. This is very important!
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
