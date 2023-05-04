import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { IconArrowRight, IconSearch } from '@tabler/icons-react';
import { getPreQuestion } from '@/utils/preQuestion';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  handleSearch: (query: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
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
  const [isExpanded, setIsExpanded] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (query.length > 0 || placeholder) && !disabled) {
      onSearch();
    }
  };

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
    setPlaceholder(preQuestion?.replaceAll('"', '') ?? 'What is longevity?');
  };

  useEffect(() => {
    genPreQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log(query);
    if (previousQuestions) setPreviousQuestions(previousQuestions);
  }, [previousQuestions]);

  const handleChange = (e: any) => {
    setQuery(e.target.value);
    resizeTextArea();
  };

  const resizeTextArea = () => {
    if (inputRef.current) {
      const scrollHeight = inputRef.current.scrollHeight;
      const clientHeight = inputRef.current.clientHeight;

      if (scrollHeight > clientHeight) {
        inputRef.current.style.height = 'auto'; // Reset the height to 'auto' before calculating the new height
        inputRef.current.style.height = `${scrollHeight}px`;
      } else {
        inputRef.current.style.height = '48px'; // Reset the height to 'auto' before calculating the new height
      }
    }
  };

  return (
    <div className='relative w-full max-w-[750px] mt-4 flex items-end bottom-10'>
      <IconSearch className='absolute bottom-2.5 w-10 left-1 h-6 rounded-full text-gray-300 sm:left-3 sm:h-8' />

      <textarea
        ref={inputRef}
        className={`text-white w-full h-12 rounded border border-gray-800 bg-gray-700 pr-12 pl-11 pt-3 pb-3 overflow-hidden resize-none focus:border-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-500 sm:pt-5 sm:pb-5 sm:pr-16 sm:pl-16 sm:text-lg`}
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      <button disabled={disabled}>
        <IconArrowRight
          onClick={onSearch}
          className='absolute right-2 bottom-2.5 h-7 w-7 rounded-full bg-indigo-500 p-1 hover:cursor-pointer hover:bg-indigo-600 sm:right-3 sm:h-10 sm:w-10 text-white'
        />
      </button>
    </div>
  );
}
