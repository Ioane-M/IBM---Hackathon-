# Talk track: what to say and show (about 3 minutes)

Open the deck at `/pitch` (or `presentation/proflm-pitch.html`) and press **F** for fullscreen. **→** moves on. The demo slide starts by itself, so do not click during it.

| # | Time | Show | Say |
|---|---|---|---|
| 1 | 0:00 to 0:12 | Logo and the student writing | "This is a student with a notebook and her own thinking. This is how learning has always worked." |
| 2 | 0:12 to 0:30 | The laptop and the red "x = 2 or x = 3. Done." bubble | "Today she has an AI that answers everything. Homework in seconds. She did not have to think." |
| 3 | 0:30 to 1:00 | The big −17% and three bars | "In a controlled study of about 1,000 high-school maths students, those who practised with a plain AI scored 17% lower on the exam without AI. A tutor-style prompt avoided the harm but added no learning. Hints alone are not enough." |
| 4 | 1:00 to 1:40 | Four blocks and the three numbered dimensions | "ProfLM has four blocks and answers all three dimensions in your brief. One, engaged: the next step stays locked until the student explains it in their own words. Two, skills kept: no final answers, only hints. Three, trustworthy: it teaches from the teacher's files and shows its source. And it reads each student's level." |
| 5 | 1:40 to 2:40 | The demo (plays by itself) | See the table below. |
| 6 | 2:40 to 3:00 | One line | "The demo was a scripted walkthrough, and the tutor loop is built. Whether explain-back improves exam results is our hypothesis, and we would test it in a one-class pilot with a quiz without AI. AI as the coach. Not the autopilot. Thank you." |

## During the demo (slide 5)

| Moment | Say |
|---|---|
| She asks it to solve her homework | "A student asks ProfLM to solve her homework." |
| A question comes back | "No answer. It asks what she thinks solving means." |
| "finding x? idk", level bar lights up | "Short and unsure, so her level is starting out." |
| Simple explanation, source tag | "Simple words, an analogy, and the teacher's chapter as the source." |
| The explain-back box | "She must explain it back, in her own words." |
| Feedback, step stays locked | "Two ideas right, one missing. It asks, it does not tell." |
| She passes, level moves up | "She passes, and her level moves up to building." |
| Wording becomes precise | "Now the wording is precise. No analogy." |
| The graph | "She tests the idea on a graph. Predict, then check." |
| Two cards side by side | "A confident student gets a challenge instead. The AI never gave the answer." |

## If you show the live app instead (60 seconds)

1. Type the homework. Point out the question that comes back.
2. Click **Just give me the answer**. It redirects. Say: "That path never calls the model."
3. Answer `finding x? idk`. Point at the **level card** and its reason.
4. Explain back with one idea only. Point at **Partly there** and the locked step.
5. Explain fully. Point at the green node on the **mastery map**, then open **Try it** on the next step.

## Questions to expect

- **Is it working?** "Yes: the lesson runs end to end in demo mode and is wired to ICA for live mode. The deck demo is scripted. The teacher view uses mock data."
- **Does it improve learning?** "That is our hypothesis. The study shows plain AI can harm and tutor prompts avoid harm. We would test explain-back in a pilot, using a quiz without AI."
- **Can a student cheat?** "Copying the AI's text is detected and rejected. Copying from elsewhere is still possible. We remove the easy path and make copying visible."
- **Wrong answers or invented facts?** "It teaches from the teacher's files, shows the source, and says 'ask your teacher' outside them."
- **Privacy?** "Answers stay in the browser. The teacher view is class-level only."
- **Why a small model?** "Short focused answers, one step at a time. Lower cost and energy, with a visible token counter."
- **How is the level decided?** "From the first answer, then from how the student does: first-try passes raise it, two failures lower it."
