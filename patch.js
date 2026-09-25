const fs = require('fs');
let code = fs.readFileSync('src/data/games.ts', 'utf8');

const targetClickMeta = `  {
    id: "target-click",
    name: "Target Click",
    description: "Aim Trainer. Click 20 targets as fast as possible.",
    rules: [
      "Click the 'Start Training' button to begin.",
      "A target will appear somewhere on the screen.",
      "Click it as fast as you can.",
      "Repeat until you've hit all 20 targets."
    ],
    category: "Skill",
    difficulty: "Medium",
    estimatedDuration: "30 seconds",
    scoreType: "time",
    path: "/target-click",
    Icon: Zap,
    colorClass: "text-blue-400 bg-blue-400/10",
    gradientClass: "from-blue-400/20 to-cyan-500/20"
  }`;

code = code.replace(/export const GAMES: GameMetadata\[\] = \[/, "export const GAMES: GameMetadata[] = [\n" + targetClickMeta + ",");
fs.writeFileSync('src/data/games.ts', code);
