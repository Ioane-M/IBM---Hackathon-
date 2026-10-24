# Change log

## Version 2 (this repository)

The first version (Phases 0 to 5 of the original build) had the right structure and the right idea. A review found problems that would have shown up in front of judges, and we fixed them.

### Fixed

1. **The build failed.** The test scripts imported from `../src/lib`, which does not exist, so `next build` stopped on a type error and the app could not have been deployed.
2. **"Next step" asked about the wrong step.** The button read the previous step number from stale state, so step 2 began with step 1's probe question.
3. **Two students at once could mix up results.** Token usage and sources were stored in module-level variables shared by all requests. They are now local to each request, and usage is summed across retries.
4. **The tutor could not see its own earlier replies.** Only the student's messages were sent back to the model. Both roles are now sent, and retries are sent as user messages instead of fake assistant messages.
5. **The answer guard blocked correct examples.** The lesson example `x² = 9` contains `x = 3`, one of the homework answers, so in live mode the tutor's own examples would have been replaced by a generic fallback. Examples now use values that do not collide, and the guard ignores matches inside longer numbers.
6. **The guard only looked at the message.** It now checks the message, the follow-up question and every feedback line.
7. **The grader could be talked into passing.** Student text is now fenced as data and the grader is told to ignore instructions inside it. A test covers it.
8. **A failed attempt cost two model calls.** The follow-up question now comes from the grading call.
9. **The health endpoint listed the available models to anyone.** It now reports only demo or live, and reads the environment at request time.
10. **No timeouts on upstream calls.** Added a 25-second timeout and clearer errors (including 429).

### Added

- **Student levels** (personalisation): judged from the first answer, shown with a reason, adjusted by performance, and used to change the explanation style.
- **Mastery map**, **class materials shelf** with a source tag on each explanation, **interactive graph** for a practice example, **docked explain-back panel** so feedback stays visible.
- **Demo mode** (scripted tutor and grader) so the site works without an API key, with a visible badge.
- **ProfLM** brand: name, logo, light theme.
- **The presentation** at `/pitch` and as a single file in `presentation/`, with the photo and logo.
- **Tests:** 20 offline checks (`npm run check`) and 17 end-to-end checks (`npm run check:api`).
- Documentation: README, architecture, talk track.

### Removed

- Two live-API scripts that tested a stale copy of the prompt instead of the app. `check:api` replaces them and tests the real routes.
