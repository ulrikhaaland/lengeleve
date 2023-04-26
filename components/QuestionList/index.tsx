import React, { useEffect, useRef, useState } from 'react';
import { Answer } from '../Answer/Answer';
import TextHighlighter from './TextHighlighter';
import FadeInButton from './FadeInButton';

interface ButtonPosition {
  top: number;
  left: number;
}

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
  text: string;
  onTextHighlighted: (selectedText: string) => void;
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
  text,
  onTextHighlighted,
}) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadingAnswerElement = (
    <>
      <div className='font-bold text-2xl mt-6'>Answer</div>
      <div className='animate-pulse mt-2'>
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
          <div className='font-bold text-2xl w-max'>Question</div>
          <div
            className='mt-2 cursor-pointer'
            onClick={() => setSelectedIndex(i)}
          >
            {q}
          </div>
          {i === questions.indexOf(questions[questions.length - 1]) &&
          loading ? (
            loadingAnswerElement
          ) : i === questions.indexOf(questions[questions.length - 1]) &&
            answering ? (
            <>
              <div className='font-bold text-2xl mb-2 mt-6'>Answer</div>
              <Answer text={answer} />
            </>
          ) : (
            answers[i] && (
              <>
                <div className='font-bold text-2xl mt-6'>Answer</div>
                <TextHighlighter
                  text={answers[i]}
                  onTextHighlighted={(selectedText) => {
                    console.log('Highlighted text:', selectedText);
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
