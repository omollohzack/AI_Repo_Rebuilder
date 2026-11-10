# AI Repo Rebuilder

A developer tool that analyses any GitHub repository with AI and helps you rebuild it to modern standards and structure.

## What it does

- Point it at a GitHub repository
- Get an AI-assisted analysis of the codebase (structure, stack, state)
- Receive guidance for rebuilding/modernising the project to current standards

## Tech stack

- React 19 + TypeScript
- Vite 6
- Google Gemini API (`@google/genai`)

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set your `GEMINI_API_KEY` in `.env.local`
3. Run the app:
   `npm run dev`

Other scripts: `npm run build` (production build), `npm run preview` (preview the build).

## Status

Working prototype, under active development. Feedback and ideas welcome via Issues.

---
Built by [Zacharia Omollo](https://github.com/omollohzack) — Full-Stack & Platform Engineer.
