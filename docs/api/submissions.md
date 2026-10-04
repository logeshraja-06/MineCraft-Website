# Submissions API

### POST `/api/submissions/run` (Requires Bearer Auth)
Executes code with custom/sample input using Judge0.
Rate limited via `submissionLimiter`. Checks if participant session is expired.
**Request Body:**
```json
{
  "sourceCode": "print(int(input()) + 1)",
  "language": "python",
  "stdin": "5"
}
```

### POST `/api/submissions/submit` (Requires Bearer Auth)
Submits solution for official scoring against hidden test cases.
Enforces:
1. Session expiration guard (`checkIfSessionExpired`).
2. Server-side assembly check: submitted code must match the session's assembled blocks.
3. Judge0 execution or secure sandboxed evaluation.
4. Auto-persistence to `submissions` collection with `attemptNumber`, `timeTakenSeconds` from session start, and score.
