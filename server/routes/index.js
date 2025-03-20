var express = require("express");
var router = express.Router();
var textToSpeech = require("../helpers/tts");
require("dotenv").config();
const multer = require("multer");
const fs = require("fs");
const speechSdk = require("microsoft-cognitiveservices-speech-sdk");
const ffmpeg = require("fluent-ffmpeg");
const {AssemblyAI} = require("assemblyai");


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

module.exports = router;
