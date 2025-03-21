const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PrescriptionModel = require('../src/models/prescriptionSchema');
const s3Service = require('../src/services/s3Service');
const textractService = require('../src/services/textractService');
const groqService = require('../src/services/groqService');
const { transformPrescriptionData } = require('../src/utils/dataTransformer');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
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

// Upload prescription and process it
router.post('/upload', upload.single('prescription'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 1. Upload file to S3
        const fileKey = await s3Service.uploadToS3(req.file);
        
        // 2. Extract text using AWS Textract
        const params = s3Service.getS3Params(fileKey);
        const extractedText = await textractService.extractText(params);
        
        // 3. Parse prescription using Groq API
        const parsedData = await groqService.parsePrescription(extractedText);
        
        // 4. Transform data to match Mongoose schema
        const transformedData = transformPrescriptionData(parsedData);
        
        // 5. Store data in MongoDB
        const prescription = new PrescriptionModel({
            ...transformedData,
            s3FileKey: fileKey,
            extractedText
        });
        
        await prescription.save();
        
        // 6. Clean up temporary file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Failed to delete temp file:", err);
        });
        
        // 7. Return success response with parsed data
        res.status(200).json({
            message: 'Prescription uploaded and processed successfully',
            prescriptionId: prescription._id,
            data: transformedData
        });
        
    } catch (error) {
        console.error("Error processing prescription:", error);
        res.status(500).json({ error: error.message || 'Failed to process prescription' });
    }
});

// Upload prescription image
router.post('/api/upload', upload.single('prescription'), async (req, res) => {
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