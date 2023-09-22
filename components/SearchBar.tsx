import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { IconArrowRight, IconSearch } from "@tabler/icons-react";
import { getPreQuestion } from "@/utils/preQuestion";

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  handleSearch: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  disabled: boolean;
  previousQuestions?: string[];
  preQuestion?: string;
}

export default function SearchBar({
  query,
  setQuery,
  handleSearch,
  inputRef,
  disabled,
  previousQuestions,
  preQuestion,
}: SearchBarProps) {
  const [placeholder, setPlaceholder] = useState<string | undefined>();
  const [previousQ, setPreviousQuestions] = useState<string[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (query.length > 0 || placeholder) && !disabled) {
      onSearch();
    }
  };

  useEffect(() => {
    if (preQuestion) setPlaceholder(preQuestion);
  }, [preQuestion]);

  const onSearch = () => {
    if (disabled) return;
    if (query.length === 0) {
      query = placeholder!;
      setQuery(placeholder!);
    }
    setPreviousQuestions((prev) => [...prev, query]);
    handleSearch(query);
    genPreQuestion();
  };

  const genPreQuestion = async () => {
    const preQuestion = await getPreQuestion(previousQ);
    setPlaceholder(preQuestion?.replaceAll('"', "") ?? "What is longevity?");
  };

  useEffect(() => {
    console.log(query);
    if (previousQuestions) setPreviousQuestions(previousQuestions);
  }, [previousQuestions]);

  return (
    <div className="relative w-full max-w-[750px] mt-4 bottom-12">
      <IconSearch className="absolute top-3 w-10 left-1 h-6 rounded-full opacity-50 sm:left-3 sm:top-4 sm:h-8" />

      <input
        ref={inputRef}
        className="h-12 w-full rounded-full border border-zinc-600 pr-12 pl-11 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 sm:h-16 sm:py-2 sm:pr-16 sm:pl-16 sm:text-lg"
        type="text"
        placeholder={placeholder}
        value={disabled ? "" : query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button disabled={disabled}>
        <IconArrowRight
          onClick={onSearch}
          className="absolute right-2 top-2.5 h-7 w-7 rounded-full bg-blue-500 p-1 hover:cursor-pointer hover:bg-blue-600 sm:right-3 sm:top-3 sm:h-10 sm:w-10 text-white"
        />
      </button>
    </div>
  );
}
