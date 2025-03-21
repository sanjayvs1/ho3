const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PrescriptionModel = require('../src/models/prescriptionSchema');
const s3Service = require('../src/services/s3Service');
const textractService = require('../src/services/textractService');
const groqService = require('../src/services/groqService');
const firebaseService = require('../src/services/firebaseService');
const dataTransformer = require('../src/utils/dataTransformer');

// Configure multer for file uploads with memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and PDF are allowed.'));
        }
    }
});

// Upload prescription image
router.post('/upload', upload.single('prescription'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      console.log('File received:', req.file.originalname, req.file.mimetype, req.file.size);
  
      // 1. Upload file to S3
      const s3Response = await s3Service.uploadToS3(req.file);
      console.log('File uploaded to S3:', s3Response.Key);
  
      // 2. Process with Textract
      const textractResponse = await textractService.extractText(s3Response.Bucket, s3Response.Key);
      console.log('Text extracted successfully');
  
      // 3. Call Groq API to parse the text
      const parsedData = await groqService.parseText(textractResponse);
      console.log('Text parsed with Groq API');
  
      // 4. Transform data for Firebase
      const transformedData = dataTransformer.transformForFirebase(parsedData);
  
      // 5. Save to Firebase
      const docRef = await firebaseService.savePrescription(transformedData);
      console.log('Data saved to Firebase with ID:', docRef.id);
  
      res.status(200).json({ 
        message: 'Prescription processed successfully', 
        prescriptionId: docRef.id,
        data: transformedData,
        extractedText: textractResponse
      });
    } catch (error) {
      console.error('Error processing prescription:', error);
      res.status(500).json({ error: error.message });
    }
  });

// Get all prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const prescriptions = await firebaseService.getAllPrescriptions();
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get prescription by ID
router.get('/prescriptions/:id', async (req, res) => {
  try {
    const prescription = await firebaseService.getPrescriptionById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    res.status(200).json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;