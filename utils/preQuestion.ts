import { openai } from "./openAIConfig";

export const getPreQuestion = async () => {
  let response;

  try {
    response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0301",
      messages: [
        {
          role: "user",
          content:
            "I need a question that is health related, it should be related to longevity, exercise, nutrition, sleep, cardiovascular health, lipids, blood pressure, blood sugar, or something similar." +
            "The question should start with the word 'How', 'What' or 'Why'." + 
            "The question should be specific and advanced, it should not be a general question." +
            "The question should be something that a person who is interested in health, nutrition and exercise would ask." +
            "The question must be maximally 5 words long. This is very important!"
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });
  } catch (e) {
    console.log(e);
    throw new Error("Error in GPT-3 request");
  }

  if (response.status !== 200) {
    throw new Error("OpenAI API returned an error");
  }

  const message = response.data.choices[0].message?.content;

  return message;
};
