import React, { useEffect, useRef, useState } from 'react';
import { Answer } from '../Answer/Answer';
import TextHighlighter from './TextHighlighter';
import FadeInButton from './FadeInButton';
import { Chunk } from '@/types';
import { IconArrowRight } from '@tabler/icons-react';
import { ExtractedData } from '@/scripts/parse';

interface QuestionsListProps {
  questions: string[];
  answers: string[];
  setSelectedIndex: (index: number) => void;
  loading: boolean;
  answering: boolean;
  answer: string;
  followUpQuestions: string[];
  setQuery: (query: string) => void;
  handleAnswer: (query: string, followUp: boolean) => void;
  onTextHighlighted: (selectedText: string) => void;
  passages: ExtractedData[][];
}

const QuestionsList: React.FC<QuestionsListProps> = ({
  questions,
  answers,
  setSelectedIndex,
  loading,
  answering,
  answer,
  followUpQuestions,
  setQuery,
  handleAnswer,
  onTextHighlighted,
  passages,
}) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadingAnswerElement = (
    <>
      <div className='font-bold text-2xl mt-6 w-full'>Answer</div>
      <div className='animate-pulse mt-2 pb-2 w-full'>
        <div className='h-4 bg-gray-300 rounded'></div>
        <div className='h-4 bg-gray-300 rounded mt-2'></div>
        <div className='h-4 bg-gray-300 rounded mt-2'></div>
        <div className='h-4 bg-gray-300 rounded mt-2'></div>
        <div className='h-4 bg-gray-300 rounded mt-2'></div>
      </div>
    </>
  );
  return (
    <>
      {questions.map((q, i) => (
        <div
          key={i}
          className={`${
            i === questions.length - 1 ? '' : 'mt-6'
          } w-full flex flex-col mt-6`}
        >
          <div className='font-bold text-2xl w-full'>Question</div>
          <div className='mt-2'>{q}</div>
          {i === questions.indexOf(questions[questions.length - 1]) &&
          loading ? (
            loadingAnswerElement
          ) : i === questions.indexOf(questions[questions.length - 1]) &&
            answering ? (
            <>
              <div className='mt-6 items-center flex-row flex w-full justify-between pb-2'>
                <h2 className='font-bold text-2xl '>Answer</h2>{' '}
                <button
                  className='bg-gray-400 text-sm hover:bg-gray-700 text-white py-1 px-2 rounded inline-flex items-center transition duration-200'
                  onClick={() => setSelectedIndex(i)}
                >
                  Go to passages ({passages[i].length})
                </button>
              </div>
              <Answer text={answer} />
            </>
          ) : (
            answers[i] && (
              <>
                <div className='mt-6 items-center flex-row flex w-full justify-between'>
                  <h2 className='font-bold text-2xl '>Answer</h2>{' '}
                  <button
                    className='bg-gray-400 text-sm hover:bg-gray-700 text-white py-1 px-2 rounded inline-flex items-center transition duration-200'
                    onClick={() => setSelectedIndex(i)}
                  >
                    Go to passages ({passages[i].length})
                  </button>
                </div>
                <TextHighlighter
                  text={answers[i]}
                  onTextHighlighted={(selectedText) => {
                    onTextHighlighted(selectedText);
                    setSelectedIndex(i);
                  }}
                />
              </>
            )
          )}
          {i === questions.length - 1 && (
            <div className='mt-6'>
              {followUpQuestions.map((fuq, index) => (
                <FadeInButton
                  key={index}
                  index={index}
                  text={fuq}
                  onClick={() => {
                    setQuery(fuq);
                    handleAnswer(fuq, true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
};

export default QuestionsList;
