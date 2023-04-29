import React, { useEffect, useState } from 'react';

interface AnswerProps {
  text: string;
}

export const Answer: React.FC<AnswerProps> = ({ text }) => {
  const [formattedText, setFormattedText] = useState<string>('');

  useEffect(() => {
    const processedText = text
      .split('\n')
      .map((line) => line.split('-').join("<span class='dash'>&ndash;</span>"))
      .join('<br/>');

    setFormattedText(processedText);
  }, [text]);

  const fadeInStyle = {
    opacity: 1,
    transitionProperty: 'opacity',
    transitionDuration: '300ms',
    animationDelay: '0.01s',
  };

  const dashStyle = {
    marginLeft: '0.25rem',
    marginRight: '0.25rem',
  };

  const processedTextWithStyles = formattedText.replace(
    /class='dash'/g,
    `style='${JSON.stringify(dashStyle).replace(/"/g, '')}'`
  );

  return (
    <div
      className='answer'
      style={fadeInStyle}
      dangerouslySetInnerHTML={{ __html: processedTextWithStyles }}
    ></div>
  );
};
