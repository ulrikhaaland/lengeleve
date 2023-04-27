import React, { useEffect, useRef, useState } from 'react';

interface TextHighlighterProps {
  text: string;
  onTextHighlighted: (selectedText: string) => void;
}

interface ButtonPosition {
  top: number;
  left: number;
}

const TextHighlighter: React.FC<TextHighlighterProps> = ({
  text,
  onTextHighlighted,
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [buttonVisible, setButtonVisible] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<ButtonPosition>({
    top: 0,
    left: 0,
  });
  const [selectedText, setSelectedText] = useState<string | undefined>();

  const handleButtonClick = () => {
    if (selectedText) {
      onTextHighlighted(selectedText);
    }
    setButtonVisible(false);
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (
        selectedText &&
        textRef.current?.contains(selection?.anchorNode as Node)
      ) {
        setSelectedText(selectedText);

        const range = selection?.getRangeAt(0);
        if (range && textRef.current) {
          const rect = range.getBoundingClientRect();
          const containerRect = textRef.current.getBoundingClientRect();
          setButtonPosition({
            top: rect.bottom - containerRect.top,
            left: rect.left - containerRect.left + rect.width / 2,
          });
          setButtonVisible(true);
        }
      } else {
        setButtonVisible(false);
      }
    };

    if (textRef.current) {
      textRef.current.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (textRef.current) {
        textRef.current.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [onTextHighlighted]);

  return (
    <div className='mt-2' ref={textRef} style={{ position: 'relative' }}>
      {text}
      {buttonVisible && (
        <button
          className='bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded inline-flex items-center transition duration-200'
          style={{
            position: 'absolute',
            top: buttonPosition.top,
            left: buttonPosition.left,
            transform: 'translate(-50%, 0)',
          }}
          onClick={handleButtonClick}
        >
          <svg
            className='w-4 h-4 mr-2'
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 011.414-1.414L10 9.586l2.293-2.293a1 1 0 011.414 1.414l-3 3A1 1 0 0110 12z'
              clipRule='evenodd'
            />
          </svg>
          Go to passage
        </button>
      )}
    </div>
  );
};

export default TextHighlighter;
