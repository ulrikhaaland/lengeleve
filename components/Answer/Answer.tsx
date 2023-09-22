import React, { useEffect, useState } from "react";

interface AnswerProps {
  text: string;
}

// Helper function to escape HTML characters
const escapeHtml = (text: string) => {
  const map: { [key: string]: string } = {
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[<>&"']/g, (m) => map[m]);
};

export const Answer: React.FC<AnswerProps> = ({ text }) => {
  const [formattedText, setFormattedText] = useState<string>("");

  useEffect(() => {
    let workingText = text;

    // Remove the first 4 characters if they are asterisks "****"
    if (workingText.startsWith("****")) {
      workingText = workingText.slice(5);
    }

    // Remove leading line breaks
    workingText = workingText.replace(/^[\n\r]+/, "");

    // Escape HTML characters
    const escapedText = escapeHtml(workingText);

    let isBold = false;
    let asteriskCount = 0;
    let processedText = "";
    let wasBold = false;

    for (let i = 0; i < escapedText.length; i++) {
      const char = escapedText[i];

      if (char === "*") {
        asteriskCount++;

        if (asteriskCount === 2) {
          processedText += isBold ? "</strong>" : "<strong>";
          wasBold = isBold;
          isBold = !isBold;
          asteriskCount = 0;
        }
      } else {
        if (asteriskCount === 1) {
          processedText += "*";
          asteriskCount = 0;
        }

        if (char === "-") {
          processedText += "<span class='dash'>&ndash;</span>";
        } else if (char === "\n") {
          processedText += "<br/>";
          if (wasBold) {
            processedText += "<br/>";
            wasBold = false;
          }
        } else {
          processedText += char;
        }
      }
    }

    setFormattedText(processedText);
  }, [text]);
  const fadeInStyle = {
    opacity: 1,
    transitionProperty: "opacity",
    transitionDuration: "300ms",
    animationDelay: "0.01s",
  };

  const dashStyle = {
    marginLeft: "0.25rem",
    marginRight: "0.25rem",
  };

  const processedTextWithStyles = formattedText.replace(
    /class='dash'/g,
    `style='${JSON.stringify(dashStyle).replace(/"/g, "")}'`
  );

  return (
    <div
      className="answer"
      style={fadeInStyle}
      dangerouslySetInnerHTML={{ __html: processedTextWithStyles }}
    ></div>
  );
};
