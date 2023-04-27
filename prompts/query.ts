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
`;
