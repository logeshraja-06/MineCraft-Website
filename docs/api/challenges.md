# Challenges & Sessions API

### GET `/api/challenges`
Returns all active challenges stored in MongoDB with stripped decoys and hidden fields.

### GET `/api/challenges/:id`
Returns single challenge metadata, problem description, time limit, points, and available starter blocks.
*Security: Hidden test cases are never returned. Decoy indicators (`isDecoy`, `correctOrder`) are removed.*

### POST `/api/sessions/start` (Requires Bearer Auth)
Initializes or resumes a server-authoritative challenge session.
**Request Body:**
```json
{
  "challengeId": "65fc...",
  "language": "python"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "session": {
    "_id": "...",
    "challengeId": "...",
    "startTime": "2026-10-03T12:00:00.000Z",
    "durationSeconds": 1200,
    "status": "ACTIVE",
    "scannedBlocks": [],
    "assemblyOrder": []
  },
  "remainingSeconds": 1200
}
```

### PUT `/api/sessions/assembly` (Requires Bearer Auth)
Saves contestant code block ordering and assembled code to the server so page reloads do not lose progress.
**Request Body:**
```json
{
  "challengeId": "65fc...",
  "assemblyOrder": ["B-01", "B-03"],
  "assembledCode": "print('hello')"
}
```
