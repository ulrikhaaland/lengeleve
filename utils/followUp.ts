import endent from 'endent';
import { openai } from './openAIConfig';
import { supabaseAdmin } from '.';
import { ExtractedData } from '@/scripts/parse';

export const getFollowUpQuestions = async (
  question: string,
  previousQuestions: string[]
) => {
  let response;

  const data = await getRandomRows();

  const content = endent`
    This is the most recent question that my user asked my company's handbook-chatbot, it has not yet been answered.
    Most recent question: ${question}
    These are previous questions that the user has asked my chatbot
    The previous questions are delimited by triple quotes.
    """${previousQuestions.join('\n')}"""
    The passages from the handbook are delimited by double quotes.
    ${data.map((d) => `"${d.content}"`).join('\n')}
    The chatbot answer questions related to my company's employee handbook.
    Based on the content from the passages create 3 follow-up questions, in Norwegian Bokmål, that the employee might be likely to ask. But do not use any of the same words as the most recent question.
    Make sure these 3 new follow-up questions does not resemble the previous questions.
    Never use the word "policy" in your questions.
    Make sure the two first questions are not equal to the most recent question.
    Make sure the questions are not equal to each other.
    Make sure the questions are not equal to the question above.
    Make sure the questions are no longer than 10 words.
    Then return the questions as a JSON-list.
    Return only the questions, not answers.
    Return each answer as a JSON object in a list: [{"question": "Question 1"}, {"question": "Question 2"}, {"question": "Question 3"}]
    Make sure you only return a JSON LIST. Do not return any ordinary text. Only a JSON LIST as a string
    Make sure the follow-up questions don't contain the same key-words as the most recent question. This is very important!
  `;

  try {
    response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-0301',
      messages: [
        {
          role: 'user',
          content: content,
        },
      ],
      max_tokens: 500,
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

const getRandomRows = async (): Promise<ExtractedData[]> => {
  const { data: allRows, error: allRowsError } = await supabaseAdmin
    .from('handbook')
    .select('id');

  if (allRowsError || !allRows) {
    console.error('Error fetching rows:', allRowsError);
    return [];
  }

  // Shuffle array using Fisher-Yates algorithm
  for (let i = allRows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRows[i], allRows[j]] = [allRows[j], allRows[i]];
  }

  const selectedRows: ExtractedData[] = [];
  let totalTokens = 0;

  for (let i = 0; i < allRows.length && selectedRows.length < 3; i++) {
    const { data: row, error: rowError } = await supabaseAdmin
      .from('handbook')
      .select(
        'id, title, author, date, content, content_length, content_tokens'
      )
      .eq('id', allRows[i].id);

    if (rowError || !row) {
      console.error('Error fetching row:', rowError);
      continue;
    }

    const rowData = row[0] as ExtractedData;

    if (totalTokens + (rowData.content_tokens || 0) <= 3000) {
      selectedRows.push(rowData);
      totalTokens += rowData.content_tokens || 0;
    }
  }

  if (selectedRows.length < 3) {
    console.warn(
      'Could not find 3 rows with a combined content_tokens of <= 3000'
    );
  }

  return selectedRows;
};
