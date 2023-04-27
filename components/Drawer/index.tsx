// CustomDrawer.tsx
import React from 'react';
import Drawer from '@mui/material/Drawer';

interface CustomDrawerProps {
  selectedIndex: number | undefined;
  handleClose: () => void;
  questions: string[];
  passages: {
    title: string;
    people: string;
    context: string;
    date: string;
    content: string;
  }[][];
  selectedText: string | undefined;
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({
  selectedIndex,
  handleClose,
  questions,
  passages,
  selectedText,
}) => {
  const filterAndSortPassages = () => {
    if (selectedIndex === undefined) return [];

    const filteredPassages = passages[selectedIndex].map((chunk, index) => {
      const similarity =
        selectedText !== undefined
          ? calculateSimilarity(chunk.content, selectedText)
          : 0;

      return {
        ...chunk,
        index,
        similarity,
      };
    });

    filteredPassages.sort((a, b) => b.similarity - a.similarity);

    return filteredPassages;
  };

  const calculateSimilarity = (content: string, selectedText: string) => {
    const words1 = content.toLowerCase().split(' ');
    const words2 = selectedText.toLowerCase().split(' ');

    const sharedWords = words1.filter((word) => words2.includes(word)).length;
    return sharedWords / Math.min(words1.length, words2.length);
  };

  const highlightSelectedText = (content: string, selectedWords: string[]) => {
    const regex = new RegExp(`\\b(${selectedWords.join('|')})\\b`, 'gi');
    const parts = content.split(regex);
    let highlightedCount = 0;
    const minWords = selectedWords.length < 3 ? 1 : 1;

    return (
      <>
        {parts.map((part, index) => {
          const isHighlighted = selectedWords.includes(part.toLowerCase());
          if (isHighlighted) {
            highlightedCount++;
          } else {
            highlightedCount = 0;
          }
          return highlightedCount >= minWords ? (
            <mark key={index} style={{ backgroundColor: 'yellow' }}>
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </>
    );
  };

  const sortedPassages = filterAndSortPassages();

  return (
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
          {selectedText && (
            <>
              <div className='font-semibold text-m mb-2'>Selected text:</div>
              <div className='text-m'>{selectedText}</div>
            </>
          )}
          {sortedPassages.map((chunk) => {
            const selectedWords = selectedText
              ? selectedText.toLowerCase().split(' ')
              : [];
            return (
              <div key={chunk.index}>
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
                  <div className='mt-2'>
                    {highlightSelectedText(chunk.content, selectedWords)}
                  </div>{' '}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
};

export default CustomDrawer;