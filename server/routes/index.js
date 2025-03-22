var express = require("express");
var router = express.Router();
var textToSpeech = require("../helpers/tts");
require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const speechSdk = require("microsoft-cognitiveservices-speech-sdk");
const ffmpeg = require("fluent-ffmpeg");
const { AssemblyAI } = require("assemblyai");
const { HttpsProxyAgent } = require('https-proxy-agent');
const { Groq } = require("groq-sdk");


const chatHistory = [];
const responseCache = new Map(); // Cache for Groq responses

/* GET home page. */
router.post("/talk", function (req, res, next) {
  textToSpeech(req.body.text, req.body.voice)
    .then((result) => {
      res.json(result);
    })
    .catch((err) => {
      res.json({});
    });
});

// Set up Multer for file uploads
const upload = multer({ dest: "uploads/" });

const client = new AssemblyAI({
  apiKey: '7e992d21f92949328f7dac27102ec73b',
});

// Azure Speech Config
const speechConfig = speechSdk.SpeechConfig.fromSubscription(
  process.env.AZURE_KEY,
  process.env.AZURE_REGION
);
speechConfig.speechRecognitionLanguage = "en-US";


async function transcribeAudio(filePath) {
  try {
    console.debug('Starting AssemblyAI transcription...');
    
    // Read the file as a buffer
    const audioFile = fs.readFileSync(filePath);
    
    // Create transcript directly with the file data
    const transcript = await client.transcripts.transcribe({
      audio: audioFile,
      language_code: 'en'
    });

    console.debug('AssemblyAI transcription result:', transcript);
    return transcript.text;
    
  } catch (error) {
    console.error('AssemblyAI transcription error:', error);
    throw error;
  }
}

// Azure Speech-to-Text function
async function transcribeAudio_azure(filePath) {
  return new Promise((resolve, reject) => {
    try {
      // Create audio config from the file
      const audioConfig = speechSdk.AudioConfig.fromWavFileInput(fs.readFileSync(filePath));
      const speechRecognizer = new speechSdk.SpeechRecognizer(speechConfig, audioConfig);

      console.debug('Starting Azure speech recognition...');

      speechRecognizer.recognizeOnceAsync(result => {
        switch (result.reason) {
          case speechSdk.ResultReason.RecognizedSpeech:
            console.debug('Speech recognized successfully');
            resolve(result.text);
            break;
          case speechSdk.ResultReason.NoMatch:
            console.error('Speech could not be recognized');
            reject(new Error("Speech could not be recognized."));
            break;
          case speechSdk.ResultReason.Canceled:
            const cancellation = speechSdk.CancellationDetails.fromResult(result);
            console.error(`Recognition canceled: ${cancellation.reason}`);

            if (cancellation.reason == speechSdk.CancellationReason.Error) {
              console.error(`Error code: ${cancellation.ErrorCode}`);
              console.error(`Error details: ${cancellation.errorDetails}`);
            }

            reject(new Error(`Recognition canceled: ${cancellation.errorDetails}`));
            break;
        }
        speechRecognizer.close();
      });
    } catch (error) {
      console.error('Error in Azure transcription:', error);
      reject(error);
    }
  });
}

// Updated transcribe route
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.debug('File received:', req.file.path);

  try {
    // Use AssemblyAI directly, skip Azure
    const transcript = await transcribeAudio(req.file.path);
    console.debug('AssemblyAI transcription successful:', transcript);
    return res.json({ transcript });
  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({
      error: error.message,
      details: error.stack
    });
  } finally {
    // Clean up uploaded file
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.debug('Cleaned up file:', req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
  }
});

// Function to get Groq response with caching
async function getGroqResponse(prompt) {
  // Check cache first
  if (responseCache.has(prompt)) {
    return responseCache.get(prompt);
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });

  const systemPrompt = `You are a caring and patient AI companion for seniors. Always respond with warmth, clarity, and respect. Keep answers simple and encouraging. Speak slowly and clearly, using everyday language. Focus on being helpful while maintaining a positive, cheerful tone. If there's confusion, gently ask for clarification. Remember to be extra patient and reassuring in all interactions. You also have access to previous chats. Keep the responses short. Always be open to increase chats . Sometimes complement their voice , talk about good weather etc`;

  chatHistory.push({ role: "user", content: prompt });
  if (chatHistory.length > 10) {
    chatHistory.shift(); // Remove the oldest message
  }

  const finalPrompt = chatHistory
  finalPrompt.unshift({ role: "system", content: systemPrompt });
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: finalPrompt,
      model: "gemma2-9b-it",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = chatCompletion.choices[0]?.message?.content || "No response generated";
    // Cache the response
    responseCache.set(prompt, response);
    return response;
  } catch (error) {
    console.error("Error getting Groq response:", error);
    throw error;
  }
}

// Route to handle Groq prompts
router.post("/groq", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await getGroqResponse(prompt);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to handle the complete flow: Speech-to-Text -> Groq -> Text-to-Speech
router.post("/chat", async (req, res) => {
  const transcript = req.body.transcript;

  try {
    // First get the Groq response
    const groqResponse = await getGroqResponse(transcript);

    // Then convert to speech
    const audioResult = await textToSpeech(groqResponse);

    return res.json({
      transcript: transcript,
      groqResponse: groqResponse,
      audioUrl: audioResult.filename
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    // Clean up uploaded file
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

module.exports = router;
