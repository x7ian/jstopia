# JS QuizUp — Project Overview
An approachable description of the game we are building, focused on the player experience rather than the tech stack.

---

## What the game is
- A JavaScript learning adventure with a visible **skill tree**. Each node represents a topic (e.g., Variables, Functions, Async).
- Players clear short **quiz rounds** to unlock the next nodes. Rounds are quick: answer a handful of questions, earn points, move on.
- Difficulty adapts as you play: if you are breezing through, questions get tougher; if you struggle, the game softens and gives clearer feedback.
- Every question comes with a short explanation so players learn even when they miss.

## How a session feels
1) Pick the next unlocked node on the skill tree.  
2) Enter a focused quiz card with four options per question.  
3) A slim progress bar shows how close you are to finishing the round.  
4) After each answer you see whether you were right, why, and links to learn more.  
5) Finish the bar to clear the round, earn points, and unlock the next topics.

## Player goals
- **Learn fast:** understand core JavaScript ideas without digging through docs.
- **See progress:** a clear bar for each round and unlocks on the tree.
- **Stay motivated:** streaks, points, and celebratory moments when a node unlocks.
- **Return easily:** a review lane surfaces topics that need a refresh.

## Content structure
- **Fundamentals track:** Variables & Scope, Operators, Functions, Async JavaScript, Arrays & Objects, and more to come.
- Each topic is broken into a few clear objectives (e.g., let/const/var, hoisting, equality quirks).
- Questions are short, practical, and avoid trick wording.

## Game rules in plain English
- A round is a short series of questions. Correct answers push the progress bar forward; wrong answers pull it back a bit. End the round by filling the bar.
- Unlocking the next node requires showing you can consistently answer across that topic, not just streak once.
- Points accumulate for streaks and clears; leaderboards can rank weekly and all-time.
- If you miss a question, you get an explanation plus a quick “try a similar one” option so you can fix the mistake right away.

## What “adaptive” means here
- The game keeps an internal sense of how confident it is that you know a topic.
- If you keep getting a topic right, it offers slightly tougher questions. If you miss, it eases up and gives clearer hints.
- This keeps rounds challenging but fair and reduces the chance of getting stuck.

## Why it’s fun and useful
- Visual skill tree makes progress obvious.
- Fast rounds respect time: you can finish one in a couple of minutes.
- Explanations and linked references turn every mistake into a mini lesson.
- Points, streaks, and unlocks deliver quick rewards without feeling grindy.

## Current slice (MVP focus)
- One main track: **JavaScript Fundamentals** with a handful of nodes unlocked in order.
- Quiz flow, explanations, and points are live; unlock logic keeps you moving only when you have evidence you understand the material.
- Basic leaderboards to compare points; review lane surfaces topics to revisit.

## What’s planned next (player-facing)
- More nodes beyond Fundamentals (async patterns, performance, testing basics).
- Smarter review reminders so you come back right before you forget.
- Achievement badges for milestones like “first perfect round” or “7-day streak.”
- More visual polish for unlock moments (celebrations, better summaries of what you learned).


