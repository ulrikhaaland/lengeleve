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
  const [apiKey, setApiKey] = useState<string>('');
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [passages, setPassages] = useState<Chunk[][]>([]);
  const [showPassages, setShowPassages] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();

  const handleAnswer = async (q?: string) => {
    setUserHasScrolled(false);
    setFollowUpQuestions([]);
    const query = q ?? question;
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

    let prompt: string = getQuestionPrompt(
      query,
      filteredResults,
      questions,
      answers
    );

    let prompt_token_length = encode(prompt).length;

    let i = filteredResults.length - 1;

    while (prompt_token_length > 3096) {
      i--;
      filteredResults.splice(i, 1);
      prompt = getQuestionPrompt(query, filteredResults, questions, answers);
      prompt_token_length = encode(prompt).length;
    }

    const answerResponse = await fetch('/api/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, apiKey }),
    });

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadingAnswerElement = (
    <>
      <div className='font-bold text-2xl'>Answer</div>
      <div className='animate-pulse mt-2'>
        <div className='h-4 bg-gray-300 rounded'></div>
        <div className='h-4 bg-gray-300 rounded mt-2'></div>
        <div className='h-4 bg-gray-300 rounded mt-2'></div>
        <div className='h-4 bg-gray-300 rounded mt-2'></div>
        <div className='h-4 bg-gray-300 rounded mt-2'></div>
      </div>
    </>
  );

  const handleClose = () => {
    setSelectedIndex(undefined);
  };

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
  }, [answer, userHasScrolled]);

  return (
    <>
      <Drawer
        anchor={'right'}
        open={selectedIndex !== undefined}
        onClose={handleClose}
        sx={{
          '.MuiPaper-root': {
            width: '23.625rem',
          },
          '.MuiDrawer-paper': {
            padding: '1.094rem 1.5rem',
          },
        }}
      >
        {selectedIndex !== undefined && (
          <div className=''>
            <div className='font-bold text-2xl mb-4'>
              {questions[selectedIndex]}
            </div>
            {passages[selectedIndex].map((chunk, index) => (
              <div key={index}>
                <div className='mt-4 border border-zinc-600 rounded-lg p-4'>
                  <div className='flex justify-between'>
                    <div>
                      <div className='font-bold text-xl'>{chunk.title}</div>
                      <div className='mt-1 font-bold text-sm'>
                        {chunk.people}
                      </div>
                      <div className='mt-1 font-bold text-sm'>
                        {chunk.context}
                      </div>
                      <div className='mt-1 font-bold text-sm'>{chunk.date}</div>
                    </div>
                  </div>
                  <div className='mt-2'>{chunk.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
      <Head>
        <title>Paul Graham GPT</title>
        <meta
          name='description'
          content={`AI-powered search and chat for Paul Graham's essays.`}
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <div className='flex flex-col h-screen w-full h-screen items-center'>
        <div
          className='flex-1 overflow-auto mb-12 overflow-auto max-h-screen'
          style={{ maxHeight: 'calc(100vh - 20px)' }}
          ref={divRef}
        >
          <div className='mx-auto flex h-full w-full max-w-[750px] flex-col items-start px-3 pt-4 sm:pt-8'>
            <button
              className='mt-4 flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm hover:opacity-50'
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? 'Hide' : 'Show'} Settings
            </button>

            {showSettings && (
              <div className='w-[340px] sm:w-[400px]'>
                <div className='mt-2'>
                  <div>Passage Count</div>
                  <input
                    type='number'
                    min={1}
                    max={30}
                    value={matchCount}
                    onChange={(e) => setMatchCount(Number(e.target.value))}
                    className='max-w-[400px] block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm'
                  />
                </div>

                <div className='mt-2'>
                  <div>OpenAI API Key</div>
                  <input
                    type='password'
                    placeholder='OpenAI API Key'
                    className='max-w-[400px] block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm'
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);

                      if (e.target.value.length !== 51) {
                        setShowSettings(true);
                      }
                    }}
                  />
                </div>

                <div className='mt-4 flex space-x-2 justify-center'>
                  <div
                    className='flex cursor-pointer items-center space-x-2 rounded-full bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600'
                    onClick={handleSave}
                  >
                    Save
                  </div>

                  <div
                    className='flex cursor-pointer items-center space-x-2 rounded-full bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600'
                    onClick={handleClear}
                  >
                    Clear
                  </div>
                </div>
              </div>
            )}
            {questions.map((q, i) => {
              return (
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
                  ) : i ===
                      questions.indexOf(questions[questions.length - 1]) &&
                    answering ? (
                    <>
                      <div className='font-bold text-2xl mb-2'>Answer</div>
                      <Answer text={answer} />
                    </>
                  ) : (
                    answers[i] && (
                      <>
                        <div className='font-bold text-2xl mt-6'>Answer</div>
                        <div className='mt-2'>{answers[i]}</div>
                      </>
                    )
                  )}

                  {i === questions.length - 1 && (
                    <div className='mt-6'>
                      {followUpQuestions.map((fuq, index) => (
                        <button
                          key={index}
                          className='mt-2 bg-blue-500 text-sm hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
                          onClick={() => {
                            setQuery(fuq);
                            handleAnswer(fuq);
                          }}
                        >
                          {fuq}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <SearchBar
          disabled={loading || answering}
          query={question}
          setQuery={function (query: string): void {
            setQuery(query);
          }}
          handleSearch={function (): void {
            handleAnswer();
          }}
          inputRef={inputRef}
        ></SearchBar>
      </div>
    </>
  );
}
