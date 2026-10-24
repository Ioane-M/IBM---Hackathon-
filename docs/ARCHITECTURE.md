# Architecture

## Data flow

1. The browser holds the lesson state: current step, attempt count, hint level, student level, messages. It sends only what the server needs for each call.
2. `POST /api/tutor` builds a prompt from the step's rubric, the examples, the student's level and the intent, calls the model, validates the JSON and applies the guards.
3. `POST /api/validate` checks the explain-back. Short and copied answers are rejected **before** any model call. Otherwise a grader call compares the answer to the step's rubric.
4. Only the grading result unlocks a step (`unlocked: verdict === "understood"`). A grading failure returns `partial` and never unlocks.

## Intents (tutor)

| Intent | Used for | Model call |
|---|---|---|
| `start` | Ask one probe question for the step | yes |
| `explain` | After the probe answer: judge the level, explain at that level, ask for an explain-back | yes |
| `reexplain` | After two failed tries: explain a different way | yes |
| `request_hint` | Hint at level 1, 2 or 3 | yes |
| `request_answer` | "Just give me the answer": fixed friendly redirect | **no** |

## The model contract

The tutor replies with JSON only:

```json
{
  "type": "probe | explain | hint | refuse",
  "message": "text shown to the student",
  "verdict": null,
  "feedback_points": [],
  "next_question": "string or null",
  "hint_level": 0,
  "flags": { "unsupported_claim": false, "reason": null },
  "student_level": 1,
  "level_reason": "one short sentence the student can read, or null"
}
```

The grader replies with:

```json
{ "verdict": "understood | partial | missing", "covered": ["..."], "missing": ["..."], "follow_up": "one short question or null" }
```

The parser strips code fences and surrounding prose, fills safe defaults for optional fields, and rejects anything with an unknown `type` or an empty `message`.

## Guards (in code)

| Guard | Where | Behaviour |
|---|---|---|
| Explain-back minimum | `validate` | Fewer than 15 words: rejected, no model call |
| Copy detection | `validate` | More than 60% of the student's 4-word sequences appear in the last explanation: rejected, no model call |
| Answer-leak check | `tutor` | Looks at the message, the follow-up question and every feedback line. Ignores matches inside longer numbers (`x = 2` does not match `x = 20`). One retry, then a safe guiding question |
| Explanation length | `tutor` | More than 80 words: one retry for a shorter version |
| Student text as data | `validate`, `tutor` | Student text is clipped, fenced in `<student_answer>` tags and the grader is told to ignore instructions inside it |
| Request validation | both | Unknown intent or wrong types: HTTP 400 |
| Timeouts | `lib/ica.ts` | 25 seconds per upstream call |
| Secrets | `lib/ica.ts` | The key is read on the server only and never logged |

## Student level

`student_level` (1 to 3) is set once, after the first probe answer, together with a one-line reason shown to the student. After that the client adjusts it from performance (`lib/levels.ts`):

- explained correctly on the first try with no hints: **up one level**
- two failed tries: **down one level**, and the next explanation uses a different angle

The level is passed to every later tutor call, where it selects the style instruction in the prompt.

## Demo mode

When `ICA_API_KEY` or `ICA_MODEL` is missing, `lib/mock.ts` answers instead of the model: scripted probes, explanations for each level, hints, and a keyword grader per rubric idea. The rules (probe first, no answers, rubric check, step lock) are the same, and the header shows a **Demo mode** badge. This keeps the deployed site usable at all times and makes the whole flow testable without a key.

## Lesson file

`lessons/quadratics.json` is the only content the tutor uses: the homework problem, answer patterns that must never be shown, four steps with a rubric, a mini example and a similar problem each, and the list of class materials with a source reference per step. Material titles and page numbers are placeholders until real documents are uploaded.

## Live mode and sources

If `ICA_COLLECTION_ID` is set, each tutor call attaches the document collection, and any `sources` returned by ICA are shown under the message. The upload script (`scripts/ica-upload.ts`) is a stub.

## Known limits

- State lives in the browser. The server returns the unlock decision, but the client holds the progress.
- Demo mode grades the example lesson only.
- The leak guard knows the homework answer from the lesson file. A new lesson needs its own patterns.
