const fs = require('fs');
let code = fs.readFileSync('src/data/games.ts', 'utf8');

code = code.replace(
  /name: "Word Guess",[\s\S]*?rules: \[[\s\S]*?\],/m,
  `name: "Word Scramble",
    description: "Unscramble the letters to find the hidden word.",
    rules: [
      "You will be given a scrambled word.",
      "Click the letters in the correct order to spell the word.",
      "Use backspace if you make a mistake.",
      "Find the word to win!"
    ],`
);

fs.writeFileSync('src/data/games.ts', code);
