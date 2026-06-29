# StudySpark AI - Intelligent Study Notes Generator

StudySpark AI is an educational assistant that automatically generates structured study notes, active recall flashcards, and interactive practice quizzes from any topic using Google Gemini.

## ✨ Features

- **📖 Complete Study Notes**: Generates core definitions, detailed key concepts, checklist points, and real-world examples.
- **💡 Metaphors & Analogies**: Translates complex, abstract jargon into simple, everyday comparisons.
- **🎴 3D Flip Flashcards**: Interactive study cards that flip with 3D CSS animation styles for memory reviews.
- **📝 Practice Quiz**: 5 multiple-choice questions with a real-time scoring engine and AI explanations for every answer.
- **🎨 Glassmorphic Interface**: Premium dark/light themes with Outfit/Inter typography.
- **💾 Local Search History**: Cache past study notes directly in your browser's local storage.
- **📄 Export to PDF**: Optimised print layouts to save notes as clean, formatted documents.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, official `@google/genai` SDK
- **Frontend**: Vanilla HTML5, CSS3, ES6+ JavaScript
- **AI Model**: Google Gemini 2.5 Flash (`gemini-2.5-flash`)

## 🚀 Installation & Setup

1. **Clone or download the project files**
2. **Install node dependencies**:
   ```bash
   npm install
   ```
3. **Start the application**:
   ```bash
   npm run start
   ```
4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 API Key Configuration

To use the note generator, you need a free Gemini API Key from [Google AI Studio](https://aistudio.google.com/):
- **Option 1 (Recommended)**: Create a `.env` file in the root directory and add:
  ```env
  GEMINI_API_KEY=your_actual_api_key
  PORT=3000
  ```
- **Option 2 (Browser Storage)**: Paste your API Key directly inside the **Gemini Settings** panel in the web interface.
