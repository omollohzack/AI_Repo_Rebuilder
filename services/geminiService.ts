
import { GoogleGenAI } from "@google/genai";

// This check is for robustness, assuming process.env.API_KEY is populated externally.
if (!process.env.API_KEY) {
  // In a real scenario, this would ideally be handled more gracefully.
  // For this context, we assume the key is always present.
  console.warn("API_KEY environment variable not set. The application will not work without it.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export async function analyzeRepository(repoUrl: string): Promise<string> {
  if (!repoUrl) {
    throw new Error("Repository URL cannot be empty.");
  }

  const prompt = `
    You are a world-class senior frontend React engineer with deep expertise in UI/UX and modern web architecture. A user has provided the following GitHub repository URL: "${repoUrl}".

    Although you cannot access the live content of the repository, please analyze the URL and infer the type of project it might be (e.g., e-commerce, portfolio, SaaS dashboard, blog).

    Based on your inference, generate a comprehensive, professional, and actionable plan to rebuild this website from scratch using a modern, best-practice frontend stack. Your response should be well-structured, detailed, and formatted in Markdown.

    Your plan must include the following sections:

    ### 1. Project Inference
    - **Repository:** \`${repoUrl}\`
    - **Inferred Project Type:** (e.g., "SaaS Analytics Dashboard")
    - **Core Purpose & Audience:** (Briefly describe the likely goal and target user of the application)

    ### 2. Recommended Technology Stack
    - **Framework:** React 18+ with TypeScript
    - **Styling:** Tailwind CSS
    - **State Management:** (Recommend a library like Zustand or Redux Toolkit, and justify your choice)
    - **Data Fetching:** (Recommend a library like React Query or SWR)
    - **Testing:** (Recommend Jest and React Testing Library)
    - **Deployment:** (Suggest a platform like Vercel or Netlify)

    ### 3. Proposed File Structure
    Provide a clear, tree-like representation of a scalable file structure. For example:
    \`\`\`
    /src
    ├── /components
    │   ├── /common         (Buttons, Inputs, Modals)
    │   └── /layout         (Navbar, Sidebar, Footer)
    ├── /hooks              (useDebounce, useAuth)
    ├── /pages              (Home, Dashboard, Settings)
    ├── /services           (apiClient, geminiService)
    ├── /store              (Zustand stores)
    ├── /types              (global type definitions)
    ├── /utils              (formatters, validators)
    └── App.tsx
    \`\`\`

    ### 4. Core Component Breakdown
    List at least 5-7 key React components, detailing their props and responsibilities. Use this format:
    - **\`<ComponentName />\`**: A brief description of the component's purpose.
      - **Props:** \`{ prop1: type, prop2: type }\`
      - **Responsibilities:** (List 2-3 key tasks this component handles)

    ### 5. Key UI/UX Improvements
    Suggest three specific and impactful UI/UX enhancements for the rebuild. For each, explain the problem it solves and the value it adds.
    1.  **Improvement 1:** (e.g., "Implement Command Palette for Power Users")
        - **Problem:** ...
        - **Solution & Value:** ...
    2.  **Improvement 2:** ...
    3.  **Improvement 3:** ...

    Please ensure your response is professional, clear, and ready to be presented to a development team as a project kickoff document.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing repository:", error);
    if (error instanceof Error) {
      return `An error occurred while contacting the AI service: ${error.message}`;
    }
    return "An unknown error occurred while contacting the AI service.";
  }
}
