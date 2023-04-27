import endent from "endent";
import { openai } from "./openAIConfig";

export const getFollowUpQuestions = async (
  question: string,
  previousQuestions: string[]
) => {
  let response;

  const content = endent`
    This is the most recent question that my user asked my chatbot, it has not yet been answered.
    Most recent question: ${question}
    These are previous questions that the user has asked my chatbot
    start of previous questions:
    ${previousQuestions.join("\n\n")}
    end of previous questions
    The chatbot primarily answer questions about health, nutrition and exercise, specifically about how one can live a long and healthy life.
    The chatbot is aimed at people who wants to go deep into esoteric health and nutrition topics, therefore you should create specific and advanced questions.
    Based on the most recent question create 3 follow-up questions that the user might be likely to ask. But do not use any of the same words as the most recent question.
    It is very important that your follow-up questions does not use any of the words contained in the most recent question.
    Make sure these 3 new follow-up questions does not resemble the previous questions.
    Make sure the third follow-up question is not related to the most recent question, but is related to health, nutrition or exercise.
    Make sure the two first questions are not equal to the most recent question.
    Make sure the questions are not equal to each other.
    Make sure the questions are not equal to the question above.
    Then return the questions as a JSON-list.
    Return only the questions, not answers.
    Return each answer as a JSON object in a list: [{"question": "Question 1"}, {"question": "Question 2"}, {"question": "Question 3"}]
    Make sure you only return a JSON LIST. Do not return any ordinary text. Only a JSON LIST as a string
    Make sure the first and second follow-up questions never use the same words as the most recent question. This is very important! E.G if the most recent question use the word "Longevity" or "Lifespan" you need to form questions that describe longevity, rather than use the word longevity.
    Make sure the follow-up questions don't contain the same key-words as the most recent question. This is very important!
    For the first two follow-up questions use a different wording than the most recent question. This is very important!
  `;

  try {
    response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0301",
      messages: [
        {
          role: "user",
          content: content,
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
