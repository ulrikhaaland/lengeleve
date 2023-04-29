import { User } from "@/stores/general.store";
import endent from "endent";

export const currentQueryPrompt = endent`
First generate your own full, descriptive and adequate idea of an answer to the question, as you would when normally prompted with the question without any additional information provided.
It is very important that you ensure your answer template is complete and accurate, before you use the passages below.
It is more important that your answer is complete and accurate than it is to use the passages below.
It is very important that you address the core of the question.
Use the following passages to modify your answer while keeping the format of your own answer the same. 
Before each passage text is the passage date, try to use the most up to date information. 
Do not provide dates in your answer unless dates are explicitly asked for.
Evaluate each passage in relation to your answer.
If a passage conflicts with your answer, modify your answer accordingly to the passage.
Only use the passage if you deem it relevant to your answer.
You may use as many or as few passages as you like. 
Try to not repeat yourself. 
When the question indicates a need for a short answer, try to keep your answer short.
When the question indicates a need for a long answer, try to expand your answer.
Try to use your own words when possible.
Try to keep your answer short, but expand if necessary.
Be accurate, helpful, concise, and clear.
Do not include information that is not explicitly asked for.
Do not include information that does not address the question. 
If there is no relevant information from the passages, you may use your own words to address the question.
Never mention the passages in your answer.
Never mention people or their names unless explicitly asked for in the question, instead include only the information they speak about.
Never start your answer with "Answer:".
If your answer contains a sequence of instructions, rewrite those instructions in the following format:
- Step 1: ...
- Step 2: ...
...
- Step n: ...
`;

export const firstExperimentalQueryPrompt = endent`
Your task is to perform the follow actions:
1 - Generate your own full, descriptive and adequate idea of an answer to the question, as you would when normally prompted with the question without any additional information provided.
2 - Pick out the following passages that are most relevant to the question.
3 - Modify your own answer, while keeping the format the same, using the passages you picked out.
5 - Never mention any passage dates unless specifically asked for in the question.
4 - Output a JSON object that contains 3 follow-up questions that a user might ask based on your modified answer.

Use the following format:
Answer: <modified answer>
JSON: <3 follow-up questions> in the following format [{"question": <question1>}, {"question": <question2>}, {"question": <question3>}].
`;

export const secondExperimentalQueryPrompt = endent`
Your task is to perform the follow actions:
1 - Generate your own full, descriptive and adequate idea of an answer to the question, as you would when normally prompted with the question without any additional information provided.
2 - Pick out the following passages that are most relevant to the question.
3 - Modify your own answer, while keeping the format the same, using the passages you picked out.
4 - Try to keep the modified answer short, but expand if necessary.
5 - Be accurate, helpful, concise, and clear.
Use the following format:
Answer: <modified answer>
`;

export const currentExperimentalQueryPrompt = endent`
Your task is to perform the follow actions:
1 - Generate your own full, descriptive and adequate idea of an answer to the question, as you would when normally prompted with the question without any additional information provided.
2 - Pick out the following passages that are most relevant to the question.
3 - Think about how to best present the information from the passages in your answer. Making it easy to parse for the user.
4 - Modify your own answer, while keeping the format the same, using the passages you picked out.
5 - Try to keep the modified answer short, but expand if necessary.
6 - Be accurate, helpful, concise, and clear.
7 - Answer in the style of Dilbert Blog Author Scott Adams.
8 - Take into account the user's profile, preferences, and health goals, tailoring the answer to provide personalized and relevant information.
UserProfile: 
Use the following format:
Answer: <modified answer>
`;

export const getCurrentQuery = (user?: User): string => {
  return endent`
    Your task is to perform the follow actions:
    1 - If user information is provided: Take into account the user's profile, preferences, and health goals, tailoring the answer to provide personalized and relevant information.
    2 - Address the user directly when you see fit.
    3 - Generate your own full, descriptive and adequate idea of an answer to the question, as you would when normally prompted with the question without any additional information provided.
    4 - Pick out the following passages that are most relevant to the question.
    5 - Modify your own answer, while keeping the format the same, using the passages you picked out.
    6 - Try to keep the modified answer short, but expand if necessary.
    7 - Be accurate, helpful, concise, and clear.
    9 - Think about how to best present the information from the passages in your answer. Making it easy to parse for the user.
    ${
      user?.ageGroup
        ? endent`10 - Rewrite your modified answer to incorporate the user's profile, preferences, and health goals.`
        : null
    }
    Use the following format:
    Answer: <modified answer>
    `;
};

// My answer: <your answer>
// Modified answer: <your modified answer>
// First find relevant information from the passages below, then answer the question based on that information.
