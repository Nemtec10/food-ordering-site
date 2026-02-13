# food-ordering-site
Static HTML/CSS website for a food ordering app.

## Deploy Netfoodix AI with HTTPS (recommended)
Because AI chat/image now requires a Node.js backend, deploy on a full-stack host (Render/Railway), not GitHub Pages.

### Option 1: Render (easy HTTPS)
1. Push this repo to GitHub.
2. Go to Render Dashboard → **New +** → **Web Service**.
3. Connect your repo and choose this project.
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variable:
   - `OPENAI_API_KEY=your_key_here`
6. Deploy.
7. Your HTTPS URL will look like:
   - `https://<your-render-service-name>.onrender.com`

### Option 2: Railway
1. Push this repo to GitHub.
2. Create a new Railway project from GitHub repo.
3. Add env var `OPENAI_API_KEY`.
4. Deploy with start command `npm start`.
5. Railway gives an HTTPS URL in project settings.

## Local run (login + AI)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` in project root:
   ```bash
   OPENAI_API_KEY=your_key_here
   ```
3. Start server:
   ```bash
   npm start
   ```
4. Open:
   - http://localhost:3000
5. Use AI panel:
   - Sign up or sign in first (required)
   - Then chat/image features are enabled

## Security and persistence
- Login-required AI access is enforced on backend APIs via bearer session tokens.
- Users, sessions, conversations, and messages are stored in SQLite (`netfoodix-ai.db`).
- Chat responses stream token-by-token over SSE.
- Built-in helper tools: URL-aware webpage context, lightweight web-search snippets for factual/location questions, and math/bill calculations (totals, tip, tax, split).

## API endpoints
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/chat/stream`
- `POST /api/demo/chat/stream`
- `POST /api/image`
- `POST /api/conversations`
- `GET /api/conversations/:userId`
- `GET /api/messages/:conversationId`
## Network note
- Browsing/search helpers require outbound internet access from your deployment environment.
- If external search sources are blocked, Demo Mode falls back to local helpful guidance.
