import SearchBar from "@/components/SearchBar";
import { Chunk } from "@/types";
import { getFollowUpQuestions } from "@/utils/followUp";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { PromptItem, getQuestionPrompt } from "@/utils/getQueryPrompt";
import QuestionsList from "@/components/QuestionList";
import CustomDrawer from "@/components/Drawer";
import PageHeader from "@/components/PageHeader";
import { useStore } from "@/stores/RootStoreProvider";
import { observer } from "mobx-react";
import { ChatMode } from "@/stores/general.store";
const { encode } = require("@nem035/gpt-3-encoder");

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLInputElement>(null);

  const { generalStore } = useStore();

  const {
    user,
    setHasAskedQuestion,
    hasAskedQuestion,
    setBgClicked,
    chatMode,
  } = generalStore;

  const [question, setQuery] = useState<string>("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [answering, setAnswering] = useState<boolean>(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [matchCount, setMatchCount] = useState<number>(100);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [passages, setPassages] = useState<Chunk[][]>([]);
  const [showPassages, setShowPassages] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number | undefined>();
  const [highlightedText, setHighlightedText] = useState<string | undefined>();

  const handleAnswer = async (q?: string, followUpQuestion?: boolean) => {
    if (!hasAskedQuestion) setHasAskedQuestion(true);

    setUserHasScrolled(false);
    setFollowUpQuestions([]);
    const query = q ?? question;

    const followUpAnswer: string | undefined =
      followUpQuestion === true ? answers[answers.length - 1] : undefined;

    setQuery("");

    if (!apiKey) {
      alert("Please enter an API key.");
      return;
    }

    if (!query) {
      alert("Please enter a query.");
      return;
    }

    setAnswer("");
    setChunks([]);

    setLoading(true);

    setQuestions((prev) => [...prev, query]);

    const searchResponse = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      if (tokens > 4096) {
        tokens = tokens - chunk.content_tokens;
        continue;
      } else {
        filteredResults.push(chunk);
      }
    }

    setPassages((prev) => [...prev, filteredResults]);

    if (tokens > 4096) {
      console.log(
        "The total number of tokens in the passages exceeds the limit of 4096. Please try a different query."
      );
      console.log("Total number of tokens: " + tokens);
      // setLoading(false);
      // return;
    }

    setChunks(filteredResults);

    // const preQuestion = await getPreQuestion(query);

    let prompt: PromptItem[] = getQuestionPrompt(
      query,
      filteredResults,
      questions,
      answers,
      followUpAnswer,
      chatMode === ChatMode.specific ? user : undefined
    );

    const getPromptEncodedLength = (prompt: PromptItem[]) => {
      let prompt_token_length = 0;
      prompt.forEach((p) => {
        prompt_token_length += encode(p.content).length;
      });
      return prompt_token_length;
    };

    let prompt_token_length = getPromptEncodedLength(prompt);

    let i = filteredResults.length - 1;

    while (prompt_token_length > 3000) {
      i--;
      filteredResults.splice(i, 1);
      prompt = getQuestionPrompt(
        query,
        filteredResults,
        questions,
        answers,
        followUpAnswer,
        chatMode === ChatMode.specific ? user : undefined
      );
      prompt_token_length = getPromptEncodedLength(prompt);
    }

    let answerResponse;

    try {
      answerResponse = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

    let newAnswer = "";

    let followUpQuestions: string[] = [];

    onFollowUpQuestions(query, questions).then((data) => {
      /// await for two seconds before fetching follow up questions

      if (data) {
        followUpQuestions = data;
      }
      if (done) {
        setFollowUpQuestions(followUpQuestions);
      }
    });

    // let parsingJson = false;

    // let followUpString = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      let chunkValue = decoder.decode(value);

      /// if the chunk contains the value "JSON", then it is the follow up questions, and we need to cut the chunkValue and parse it and set to done
      // if (chunkValue.includes('JSON')) {
      //   chunkValue.replace('JSON:', '');
      //   parsingJson = true;
      // }

      // if (parsingJson) {
      //   followUpString += chunkValue;
      //   continue;
      // }

      // /// Alter chunkvalue to contain the part that comes before "JSON:"
      // if (chunkValue.includes('JSON')) {
      //   chunkValue = chunkValue.substring(0, chunkValue.indexOf('JSON'));
      // }

      setAnswer((prev) => {
        newAnswer = prev + chunkValue;
        newAnswer = newAnswer.replace("Answer:", "");
        return newAnswer;
      });
    }

    if (done) {
      console.log(newAnswer);
      // followUpString = followUpString.replace('JSON:', '').trim();
      // const parsed = await JSON.parse(followUpString);
      // const followUps = parsed.map((d: any, index: number) => d.question);

      setAnswers((prev) => [...prev, newAnswer]);
      // if (followUps.length > 0) {
      //   setFollowUpQuestions(followUps);
      // } else
      if (followUpQuestions) {
        setFollowUpQuestions(followUpQuestions);
      } else {
        throw new Error("No follow up questions");
      }
      setAnswering(false);
    }

    inputRef.current?.focus();
  };

  const onFollowUpQuestions = async (
    query: string,
    previousQuestions: string[]
  ): Promise<string[] | undefined> => {
    console.log("onFollowUpQuestions");

    let followUp;

    try {
      followUp = await getFollowUpQuestions(query, previousQuestions);
    } catch (error) {
      /// wait for two seconds then try again
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        followUp = await getFollowUpQuestions(query, previousQuestions);
      } catch (error) {
        console.log(error);
      }
      console.log(error);
    }

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

  useEffect(() => {
    setMatchCount(matchCount);
  }, [matchCount]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScroll = () => {
    const divElement = divRef.current!;
    const threshold = 40; // Adjust this value to control the sensitivity
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
    divElement.addEventListener("scroll", handleScroll);

    return () => {
      divElement.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const divElement = divRef.current;
    if (divElement && !userHasScrolled) {
      divElement.scrollTop = divElement.scrollHeight - divElement.clientHeight;
    }
  }, [answer, userHasScrolled, followUpQuestions]);

  const [open, setOpen] = useState(false);

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
          name="description"
          content={`AI-powered search and chat for Paul Graham's essays.`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        className="flex flex-col h-screen w-full h-screen items-center"
        onClick={() => {
          setBgClicked(true);
        }}
      >
        <PageHeader></PageHeader>
        <div
          className="flex-1 w-full text-grey overflow-auto mb-12 overflow-auto max-h-screen"
          style={{ maxHeight: "calc(100vh - 20px)" }}
          ref={divRef}
        >
          <div className="mx-auto flex h-full w-full max-w-[750px] flex-col px-3">
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
          previousQuestions={questions}
        ></SearchBar>
      </div>
    </>
  );
}

export default observer(Home);
