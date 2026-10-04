# Leaderboard & Export API

### GET `/api/leaderboard`
Returns public competition rankings computed via MongoDB aggregation:
- Best accepted score per challenge.
- Penalty: +300 seconds (5 minutes) for each failed attempt prior to first accepted submission.
- Sorted by: `score` DESC, `totalTimeSeconds` ASC, `lastSubmissionTime` ASC.

### GET `/api/leaderboard/my-rank` (Requires Bearer Auth)
Returns authenticated participant's personal standing and score breakdown.

### GET `/api/admin/leaderboard/export?format=csv|xlsx` (Requires Admin Auth)
Exports official competition leaderboard results with CSV formula injection protection (cells prefixed with `=, +, -, @` are escaped with `'`).
Columns:
`Rank`, `Name`, `Participant ID`, `College`, `Department`, `Email`, `Challenges Solved`, `Score (marks)`, `Total Time`, `Last Submission Time`.

### GET `/api/admin/participants/export?format=csv|xlsx` (Requires Admin Auth)
Exports registered participant contact directory.
Columns:
`Name`, `Participant ID`, `College`, `Department`, `Email`, `Registered At`.
