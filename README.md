# MasterPlan AI - Marketing Campaign Planner

This is an AI-powered marketing campaign planning application that helps create comprehensive marketing strategies.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Get your Google AI API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Set `VITE_GOOGLE_AI_API_KEY` in your `.env` file

3. Run the app:
   ```bash
   npm run dev
   ```

## Environment Variables

- `VITE_GOOGLE_AI_API_KEY`: Your Google AI (Gemini) API key for AI-powered features
