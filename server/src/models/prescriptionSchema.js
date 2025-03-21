/**
 * Prescription Schema Definition
 * This is not a MongoDB schema but rather a structure definition for Firestore
 * It serves as documentation for the expected document structure
 */
const prescriptionSchema = {
    doctorInfo: {
      name: String,
      qualifications: Array, // Array of strings
      address: String,
      contactInfo: String,
      registrationNumber: String,
      hospitalDetails: {
        name: String,
        address: String,
        contactInfo: String
      }
    },
    patientInfo: {
      name: String,
      age: Number,
      gender: String,
      diagnosis: Array, // Array of strings
      treatmentDetails: Array // Array of objects with medication, dosage, timing
    },
    metadata: {
      createdAt: Date,
      updatedAt: Date,
      originalImagePath: String
    }
  };
  
  module.exports = prescriptionSchema;