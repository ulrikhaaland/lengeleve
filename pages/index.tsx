import { Answer } from '@/components/Answer/Answer';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import { Chunk } from '@/types';
import { getFollowUpQuestions } from '@/utils/followUp';
import {
  IconArrowRight,
  IconExternalLink,
  IconSearch,
} from '@tabler/icons-react';
import endent from 'endent';
import Head from 'next/head';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Drawer, useMediaQuery, Theme } from '@mui/material';
import { getQuestionPrompt } from '@/prompts/prompts';
import { getPreQuestion } from '@/utils/preQuestion';
import QuestionsList from '@/components/QuestionList';
import CustomDrawer from '@/components/Drawer';
const { encode, decode } = require('@nem035/gpt-3-encoder');

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLInputElement>(null);

  const [question, setQuery] = useState<string>('');
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [answering, setAnswering] = useState<boolean>(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [matchCount, setMatchCount] = useState<number>(5);
  const [apiKey, setApiKey] = useState<string>(
    process.env.NEXT_PUBLIC_OPENAI_API_KEY!
  );
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [passages, setPassages] = useState<Chunk[][]>([]);
  const [showPassages, setShowPassages] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();
  const [highlightedText, setHighlightedText] = useState<string | undefined>();

  const handleAnswer = async (q?: string, followUpQuestion?: boolean) => {
    setUserHasScrolled(false);
    setFollowUpQuestions([]);
    const query = q ?? question;
    const followUpAnswer: string | undefined =
      followUpQuestion === true ? answers[answers.length - 1] : undefined;
    setQuery('');
    if (!apiKey) {
      alert('Please enter an API key.');
      return;
    }

    if (!query) {
      alert('Please enter a query.');
      return;
    }

    setAnswer('');
    setChunks([]);

    setLoading(true);

    setQuestions((prev) => [...prev, query]);

    const searchResponse = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, apiKey, matches: matchCount }),
    });

    if (!searchResponse.ok) {
      setLoading(false);
      throw new Error(searchResponse.statusText);
    }

    const results: Chunk[] = await searchResponse.json();

    const filteredResults: Chunk[] = [];

    let tokens = 0;

    for (let i = 0; i < results.length; i++) {
      const chunk = results[i];
      tokens += chunk.content_tokens;
      if (tokens > 2048) {
        tokens = tokens - chunk.content_tokens;
        continue;
      } else {
        filteredResults.push(chunk);
      }
    }

    setPassages((prev) => [...prev, filteredResults]);

    if (tokens > 2048) {
      console.log(
        'The total number of tokens in the passages exceeds the limit of 2048. Please try a different query.'
      );
      console.log('Total number of tokens: ' + tokens);
      // setLoading(false);
      // return;
    }

    setChunks(filteredResults);

    console.log('chunks' + chunks.length);

    // const preQuestion = await getPreQuestion(query);

    let prompt: string = getQuestionPrompt(
      query,
      filteredResults,
      questions,
      answers,
      followUpAnswer
    );

    let prompt_token_length = encode(prompt).length;

    let i = filteredResults.length - 1;

    while (prompt_token_length > 3096) {
      i--;
      filteredResults.splice(i, 1);
      prompt = getQuestionPrompt(
        query,
        filteredResults,
        questions,
        answers,
        followUpAnswer
      );
      prompt_token_length = encode(prompt).length;
    }

    let answerResponse;

    try {
      answerResponse = await fetch('/api/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, apiKey }),
      });
    } catch (error) {
      setLoading(false);
      throw new Error(error as string);
    }

    if (!answerResponse.ok) {
      setLoading(false);
      throw new Error(answerResponse.statusText);
    }

    const data = answerResponse.body;

    if (!data) {
      return;
    }

    setLoading(false);
    setAnswering(true);

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    let newAnswer = '';

    let followUpQuestions: string[] = [];

    onFollowUpQuestions(query, questions).then((data) => {
      if (data) {
        followUpQuestions = data;
      }
    });

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);

      chunkValue.replace('Answer:', '');

      setAnswer((prev) => {
        newAnswer = prev + chunkValue;
        return prev + chunkValue;
      });
    }

    if (done) {
      setAnswers((prev) => [...prev, newAnswer]);
      if (followUpQuestions) setFollowUpQuestions(followUpQuestions);
      setAnswering(false);
    }

    inputRef.current?.focus();
  };

  const onFollowUpQuestions = async (
    query: string,
    previousQuestions: string[]
  ): Promise<string[] | undefined> => {
    console.log('onFollowUpQuestions');
    const followUp = await getFollowUpQuestions(query, previousQuestions);

    /// parse json string
    if (followUp) {
      try {
        const parsed = await JSON.parse(followUp);
        const followUps = parsed.map((d: any) => d.question);
        return followUps;
      } catch (e) {
        console.log(e);
        return undefined;
      }
    }
  };

  const handleSave = () => {
    if (apiKey.length !== 51) {
      alert('Please enter a valid API key.');
      return;
    }

    localStorage.setItem('PG_KEY', apiKey);
    localStorage.setItem('PG_MATCH_COUNT', matchCount.toString());

    setShowSettings(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    localStorage.removeItem('PG_KEY');
    localStorage.removeItem('PG_MATCH_COUNT');
    localStorage.removeItem('PG_MODE');

    setApiKey('');
    setMatchCount(5);
  };

  useEffect(() => {
    setMatchCount(matchCount);
  }, [matchCount]);

  useEffect(() => {
    const PG_KEY = localStorage.getItem('PG_KEY');
    const PG_MATCH_COUNT = localStorage.getItem('PG_MATCH_COUNT');
    const PG_MODE = localStorage.getItem('PG_MODE');

    if (PG_KEY) {
      setApiKey(PG_KEY);
    }

    if (PG_MATCH_COUNT) {
      setMatchCount(parseInt(PG_MATCH_COUNT));
    }

    inputRef.current?.focus();
  }, []);

  const handleScroll = (e: any) => {
    const divElement = divRef.current!;
    const threshold = 20; // Adjust this value to control the sensitivity
    const isScrolledToBottom =
      divElement.scrollHeight - divElement.clientHeight <=
      divElement.scrollTop + threshold;

    if (!isScrolledToBottom) {
      setUserHasScrolled(true);
    } else {
      setUserHasScrolled(false);
    }
  };

  useEffect(() => {
    const divElement = divRef.current!;
    divElement.addEventListener('scroll', handleScroll);

    return () => {
      divElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const divElement = divRef.current;
    if (divElement && !userHasScrolled) {
      divElement.scrollTop = divElement.scrollHeight - divElement.clientHeight;
    }
  }, [answer, userHasScrolled, followUpQuestions]);

  return (
    <>
      <CustomDrawer
        selectedIndex={selectedIndex}
        handleClose={function (): void {
          setSelectedIndex(undefined);
          setHighlightedText(undefined);
        }}
        questions={questions}
        passages={passages}
        selectedText={highlightedText}
      />
      <Head>
        <title>ChatAttia</title>
        <meta
          name='description'
          content={`AI-powered search and chat for Paul Graham's essays.`}
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div className='flex flex-col h-screen w-full h-screen items-center'>
        <div className='border-b w-full text-center'>
          <h2 className='text-2xl font-bold mt-4 mb-2'>ChatLongevity</h2>
          <h2 className='text-m mb-2 text-gray-600'>Model: Attia01</h2>
        </div>
        <div
          className='flex-1 w-full text-grey overflow-auto mb-12 overflow-auto max-h-screen'
          style={{ maxHeight: 'calc(100vh - 20px)' }}
          ref={divRef}
        >
          <div className='mx-auto flex h-full w-full max-w-[750px] flex-col px-3'>
            <QuestionsList
              questions={questions}
              answers={answers}
              setSelectedIndex={setSelectedIndex}
              loading={loading}
              answering={answering}
              answer={answer}
              followUpQuestions={followUpQuestions}
              setQuery={setQuery}
              handleAnswer={handleAnswer}
              onTextHighlighted={setHighlightedText}
              passages={passages}
            />
          </div>
        </div>

        <SearchBar
          disabled={loading || answering}
          query={question}
          setQuery={function (query: string): void {
            setQuery(query);
          }}
          handleSearch={handleAnswer}
          inputRef={inputRef}
        ></SearchBar>
      </div>
    </>
  );
}
