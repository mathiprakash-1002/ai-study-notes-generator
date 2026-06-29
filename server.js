const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Config status endpoint to let the frontend know if a server key exists
app.get('/api/config-status', (req, res) => {
  res.json({ hasEnvKey: !!process.env.GEMINI_API_KEY });
});


// Response schema for the generated study notes
const studyNotesSchema = {
  type: 'OBJECT',
  properties: {
    topic: { type: 'STRING' },
    definition: { type: 'STRING' },
    concepts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          explanation: { type: 'STRING' }
        },
        required: ['title', 'explanation']
      }
    },
    keyPoints: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    simpleExplanation: { type: 'STRING' },
    analogy: { type: 'STRING' },
    realWorldExamples: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    examTips: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    quiz: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          question: { type: 'STRING' },
          options: {
            type: 'ARRAY',
            items: { type: 'STRING' }
          },
          correctIndex: { type: 'INTEGER' },
          explanation: { type: 'STRING' }
        },
        required: ['question', 'options', 'correctIndex', 'explanation']
      }
    },
    flashcards: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          front: { type: 'STRING' },
          back: { type: 'STRING' }
        },
        required: ['front', 'back']
      }
    }
  },
  required: [
    'topic',
    'definition',
    'concepts',
    'keyPoints',
    'simpleExplanation',
    'analogy',
    'realWorldExamples',
    'examTips',
    'quiz',
    'flashcards'
  ]
};

// Notes generation endpoint
app.post('/api/generate-notes', async (req, res) => {
  try {
    const { topic, tone = 'detailed', level = 'intermediate' } = req.body;

    if (!topic || topic.trim() === '') {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    // Get API Key from header or environment variable
    const apiKey = req.headers['x-api-key'] || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: 'Gemini API Key is missing. Please set it in the Settings panel or the server environment.'
      });
    }

    // Initialize the Gemini SDK client with the provided API key
    const ai = new GoogleGenAI({ apiKey });

    // Design prompt based on selected options
    const systemPrompt = `You are an expert tutor who writes incredibly clear, premium, and structured study notes for students.
Create educational content for the topic: "${topic}".
Tone and style guidelines:
- Tone/Depth: "${tone}" (e.g., "simple" means concise, plain terms, and easy analogies; "detailed" means academic depth, standard terminology; "creative" means heavily using visual analogies, interesting comparisons).
- Academic Level: "${level}" (e.g., "beginner" for school students, "intermediate" for college entry/high school, "advanced" for university degree level).

Requirements:
- The notes must be accurate and easy to revise.
- Provide a robust definition.
- Break down at least 3-5 core concepts under "concepts".
- Provide bullet-point summary items under "keyPoints".
- Explain the concept simply in "simpleExplanation", and provide an intuitive "analogy".
- Provide at least 2 real-world examples under "realWorldExamples".
- Provide exam tips, mnemonics, or revision hacks under "examTips".
- Include a "quiz" containing exactly 5 multiple-choice questions (each with exactly 4 options, a correctIndex [0 to 3], and a helpful explanation of why the correct option is right and others are wrong).
- Include 5 "flashcards" with a front side (question/term) and a back side (answer/definition) that students can use to review key terms.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: studyNotesSchema,
        temperature: 0.2
      }
    });

    if (!response.text) {
      throw new Error('Empty response received from the Gemini API.');
    }

    // Return the parsed JSON object
    const resultJson = JSON.parse(response.text);
    res.json(resultJson);

  } catch (error) {
    console.error('Error generating notes:', error);
    res.status(500).json({
      error: 'An error occurred while generating study notes.',
      details: error.message
    });
  }
});

// Serve frontend for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
