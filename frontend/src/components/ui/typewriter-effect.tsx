// components/Typewriter.tsx
import React, { useState, useEffect } from "react";

type TypewriterProps = {
  text: string;
  speed?: number;
};

const Typewriter: React.FC<TypewriterProps> = ({ text, speed }) => {
  const [displayedText, setDisplayedText] = useState<string[]>([""]);

  useEffect(() => {
    const words = text.split(/(\s+)/); // Split text into words and spaces
    let wordIndex = 0;
    const interval = setInterval(() => {
      if (wordIndex < words.length) {
        setDisplayedText((prev) => {
          const newWords = [...prev];
          newWords.push(words[wordIndex]);
          return newWords;
        });
        wordIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div>
      {displayedText.map((word, index) => (
        <span key={index}>{word}</span>
      ))}
    </div>
  );
};

export default Typewriter;
