import React, { useState, useEffect } from 'react';

interface FadeInButtonProps {
  index: number;
  text: string;
  onClick: () => void;
}

const FadeInButton: React.FC<FadeInButtonProps> = ({
  index,
  text,
  onClick,
}) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(1);
    }, index * 200);

    return () => {
      clearTimeout(timer);
    };
  }, [index]);

  return (
    <button
      className={`mt-2 mr-3 bg-sky-600 text-sm hover:bg-sky-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-opacity duration-300 ease-in`}
      style={{ opacity: opacity, transitionDelay: `${index * 100}ms` }}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

export default FadeInButton;
