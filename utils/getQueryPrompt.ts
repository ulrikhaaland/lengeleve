import { getCurrentQuery } from '@/prompts/query';
import { useStore } from '@/stores/RootStoreProvider';
import { User } from '@/stores/general.store';
import { Chunk } from '@/types';
import endent from 'endent';

export interface PromptItem {
  role: string;
  content: string;
}

export const getQuestionPrompt = (
  query: string,
  filteredResults: Chunk[],
  questions: string[],
  answers: string[],
  followUpAnswer?: string,
  user?: User
): PromptItem[] => {
  const prompts = [];

  const chatHistory =
    answers.length > 0
      ? `Chat history Start:
${answers
  .map((a, i) => 'Question: ' + questions[i] + '\n' + 'Answer: ' + a)
  .join('\n\n')}
Chat History End:
`
      : '';

  const chatHistoryInstruction =
    answers.length > 0
      ? 'Be aware of the chat history, make sure you do not repeat information contained in previous answers unless you deem it extremely relevant — This is very important!'
      : '';

  const followUp = followUpAnswer
    ? endent`
  This question is a follow-up question to an answer you have already provided.
  Make sure you respond accordingly to the question without repeating the information from the answer above.  
  The answer: ${followUpAnswer}
  `
    : '';

  // for (let i = 0; i < answers.length && i < 5; i++) {
  //   const answer = answers[i];
  //   const question = questions[i];

  //   prompts.push({
  //     role: "user",
  //     content: question,
  //   });
  //   prompts.push({
  //     role: "assistant",
  //     content: answer,
  //   });
  // }

  const queryPrompt = getCurrentQuery(user);

  const final = endent`
    ${user ? 'The user profile is delimited by double commas.' : null}
    ${
      user
        ? endent`,,UserProfile: {
      ageGroup: ${user!.ageGroup}, 
      gender: ${user!.gender}, 
      activityLevel: ${user!.activityLevel}, 
      dietaryPreferences: ${user!.dietaryPreferences}, 
      healthGoals: ${user!.healthGoals}, 
      allergies: ${user!.allergies},
      sleepHabits: ${user!.sleepHabits},
      preferences: ${user!.stressLevels},
      stressLevels: ${user!.stressLevels},
      timeAvailability: ${user!.timeAvailability},
  },,`
        : null
    }
    The question is delimited by triple quotes.
    Question: """${query}"""
    ${queryPrompt}
    The passages is delimited by tripple dashes.
    Passages:
    ---${filteredResults?.map((d: Chunk) => d.date + d.content).join('\n\n')}---
`;

  prompts.push({
    role: 'user',
    content: final,
  });

  return prompts;
};

/// V2
// return endent`
// Question: ${query}
// First generate your own full, descriptive and adequate answer to the question, as you would when normally prompted with the question without any additional information provided.
// It is very important that you ensure your answer is complete and accurate, before you use the passages below.
// Then, use the following passages to modify your answer while keeping the format of your own answer the same.
// Before each passage text is the passage date, try to use the most up to date information.
// Do not provide dates in your answer unless dates are explicitly asked for.
// Evaluate each passage in relation to your answer.
// If a passage conflicts with your answer, modify your answer accordingly to the passage.
// Only use the passage if you deem it relevant to your answer.
// You may use as many or as few passages as you like.
// Try to not repeat yourself.
// When the question indicates a need for a short answer, try to keep your answer short.
// When the question indicates a need for a long answer, try to expand your answer.
// Try to use your own words when possible.
// Try to keep your answer short, but expand if necessary.
// Be accurate, helpful, concise, and clear.
// Do not include information that does not address the question.
// Passages:
// ${filteredResults?.map((d: Chunk) => d.date + d.content).join('\n\n')}
// `;

/// CHAT HISTORY
// ${chatHistoryInstruction}
// ${chatHistory}
// Be concise and clear when corresponding your answer to the query.

// return endent`
// Question: ${query}
//   First you generate your own answer to the question.
// ${chatHistory}
// Use the following passages to provide an answer to the query: "${query}"
// \n\n Evaluate each passage in relation to the question
// and use the passage if you deem it relevant.
// \n\n You may use as many or as few passages as you like.
// ${chatHistoryInstruction}
// \n\n Combine the information in the passages to form a coherent answer to the query.
// \n\n If the passages do not contain information that is fit to answer the query,
// you should form your own answer, based on information from the internet.
// \n\n Be concise and clear when corresponding your answer to the query.
// \n\n Try to not repeat yourself.
// \n\n Do not include information that does not address the question.
// \n\n Before each passage text is the passage date, try to use the most up to date information.
// \n\n Passages:

// ${filteredResults?.map((d: Chunk) => d.date + d.content).join('\n\n')}
// `;
