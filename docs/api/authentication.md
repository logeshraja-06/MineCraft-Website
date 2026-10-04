# Authentication & Participant API

### POST `/api/participants/register`
Registers a participant into MongoDB with validated uniqueness on `participantId` and `email`.
**Request Body:**
```json
{
  "name": "Jane Doe",
  "participantId": "MC-JD01",
  "email": "jane@college.edu",
  "college": "MIT",
  "department": "Computer Science"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "...",
    "name": "Jane Doe",
    "participantId": "MC-JD01",
    "email": "jane@college.edu",
    "college": "MIT",
    "department": "Computer Science",
    "role": "participant"
  }
}
```
*Note: Passwords and sensitive hashes are never returned.*

### POST `/api/auth/admin/login`
Authenticates competition administrators.
**Request Body:**
```json
{
  "email": "admin@mindcraft.io",
  "password": "AdminSecurePassword2026!"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "name": "Competition Admin",
    "email": "admin@mindcraft.io",
    "role": "admin"
  }
}
```

### GET `/api/auth/me`
Returns the currently authenticated user's profile based on the Bearer JWT token.
