import React from "react";

// Mapeo clásico de emoticones estilo MSN Messenger (2004)
const EMOTICONS_MAP: Record<string, string> = {
  ":-)": "🙂",
  ":)": "🙂",
  ":-(": "🙁",
  ":(": "🙁",
  ":-D": "😀",
  ":D": "😀",
  ":d": "😀",
  ":-P": "😛",
  ":P": "😛",
  ":p": "😛",
  ":-p": "😛",
  ";-)": "😉",
  ";)": "😉",
  ":-O": "😮",
  ":O": "😮",
  ":-o": "😮",
  ":o": "😮",
  ":'(": "😢",
  ":'-(": "😢",
  ":-|": "😐",
  ":|": "😐",
  ":-*": "😘",
  ":*": "😘",
  "<3": "❤️",
  "</3": "💔",
  "(y)": "👍",
  "(Y)": "👍",
  "(n)": "👎",
  "(N)": "👎",
  "(l)": "❤️",
  "(L)": "❤️",
  "(u)": "💔",
  "(U)": "💔",
  "(k)": "💋",
  "(K)": "💋",
  "(h)": "😎",
  "(H)": "😎",
  ":@": "😡",
  ":-@": "😡",
  "XD": "😆",
  "xd": "😆",
  "Xd": "😆",
};

// Generar expresión regular escapando caracteres especiales
const ESCAPED_KEYS = Object.keys(EMOTICONS_MAP)
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"))
  .join("|");

const EMOTICON_REGEX = new RegExp(`(${ESCAPED_KEYS})`, "g");

export function parseEmoticons(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts = text.split(EMOTICON_REGEX);
  return parts.map((part, index) => {
    if (EMOTICONS_MAP[part]) {
      return (
        <span
          key={index}
          className="msn-emoji"
          title={part}
          style={{
            display: "inline-block",
            fontSize: "1.15em",
            verticalAlign: "-0.1em",
            padding: "0 1px",
          }}
        >
          {EMOTICONS_MAP[part]}
        </span>
      );
    }
    return part;
  });
}
