var express = require("express");
var router = express.Router();
var textToSpeech = require("../helpers/tts");
require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const speechSdk = require("microsoft-cognitiveservices-speech-sdk");
const ffmpeg = require("fluent-ffmpeg");
const {AssemblyAI} = require("assemblyai");
const { HttpsProxyAgent } = require('https-proxy-agent');
const { Groq } = require("groq-sdk");


const chatHistory = [];

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


// Speech-to-Text function
async function transcribeAudio(filePath) {
 const transcript = await client.transcripts.transcribe({ audio: filePath, language_code : 'hi' });
 return transcript.text;
}

// Route to handle MP3 file upload and transcription
router.post("/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const transcript = await transcribeAudio(req.file.path);
    return res.json({ transcript });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    // Clean up uploaded file whether transcription succeeded or failed
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
});

// Function to get Groq response
async function getGroqResponse(prompt) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });

  chatHistory.push({ role: "user", content: prompt });
  if (chatHistory.length > 10) {
    chatHistory.shift(); // Remove the oldest message
  }
  try {
    const chatCompletion = await groq.chat.completions.create({
      // messages: [{ role: "user", content: prompt }],
      messages: chatHistory,
      model: "gemma2-9b-it",
      temperature: 0.7,
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || "No response generated";
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
router.post("/chat", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Step 1: Transcribe the audio
    const transcript = await transcribeAudio(req.file.path);
    
    // Step 2: Get Groq response
    const groqResponse = await getGroqResponse(transcript);
    
    // Step 3: Convert Groq response to speech
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
