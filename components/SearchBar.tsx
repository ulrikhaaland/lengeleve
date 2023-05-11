import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  IconArrowRight,
  IconExternalLink,
  IconSearch,
} from '@tabler/icons-react';
import { getPreQuestion } from '@/utils/preQuestion';
import { set } from 'mobx';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  handleSearch: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  disabled: boolean;
  previousQuestions?: string[];
}

export default function SearchBar({
  query,
  setQuery,
  handleSearch,
  inputRef,
  disabled,
  previousQuestions,
}: SearchBarProps) {
  const [placeholder, setPlaceholder] = useState<string | undefined>();
  const [previousQ, setPreviousQuestions] = useState<string[]>([]);
  const [searchingQuestion, setSearchingQuestion] = useState<boolean>(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (query.length > 0 || placeholder) && !disabled) {
      onSearch();
    }
  };

  const onSearch = () => {
    if (disabled) return;

    if (query.length === 0) {
      query = placeholder!;
      setQuery(placeholder!);
      setPlaceholder(undefined);
    }
    setPreviousQuestions((prev) => [...prev, query]);
    handleSearch(query);
    genPreQuestion();
  };

  const genPreQuestion = async () => {
    const preQuestion = await getPreQuestion(previousQ);
    setSearchingQuestion(false);
    setPlaceholder(
      preQuestion?.replaceAll('"', '') ?? 'Hvordan søker jeg ferie?'
    );
  };

  useEffect(() => {
    if (searchingQuestion) return;
    setSearchingQuestion(true);
    genPreQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(query);
    if (previousQuestions) setPreviousQuestions(previousQuestions);
  }, [previousQuestions]);

  return (
    <div className='relative w-full max-w-[750px] mt-4 bottom-12'>
      <IconSearch className='absolute top-3 w-10 left-1 h-6 rounded-full opacity-50 sm:left-3 sm:top-4 sm:h-8' />

      <input
        ref={inputRef}
        className='h-12 w-full rounded-full border border-zinc-600 pr-12 pl-11 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 sm:h-16 sm:py-2 sm:pr-16 sm:pl-16 sm:text-lg'
        type='text'
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button disabled={disabled}>
        <IconArrowRight
          onClick={onSearch}
          style={{
            backgroundColor: disabled ? '#ccc' : '#3299cd',
          }}
          className='absolute right-2 top-2.5 h-7 w-7 rounded-full p-1 hover:cursor-pointer hover:bg-blue-600 sm:right-3 sm:top-3 sm:h-10 sm:w-10 text-white'
        />
      </button>
    </div>
  );
}
