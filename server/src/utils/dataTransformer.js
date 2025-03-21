/**
 * Transform the Groq API response to match Firebase schema
 * @param {Object} parsedData - Data parsed from Groq API
 * @returns {Object} - Transformed data matching Firebase schema
 */
const transformForFirebase = (parsedData) => {
    return {
        doctorInfo: {
            name: parsedData.doctor_info.name || "Unknown",
            qualifications: parsedData.doctor_info.qualifications || [],
            address: parsedData.doctor_info.address || "Unknown",
            contactInfo: parsedData.doctor_info.contact_info || "Unknown",
            registrationNumber: parsedData.doctor_info.registration_number || "Unknown",
            hospitalDetails: {
                name: parsedData.doctor_info.hospital_details?.name || "Unknown",
                address: parsedData.doctor_info.hospital_details?.address || "Unknown",
                contactInfo: parsedData.doctor_info.hospital_details?.contact_info || "Unknown"
            }
        },
        patientInfo: {
            name: parsedData.patient_info.name || "Unknown",
            age: parsedData.patient_info.age || 0,
            gender: parsedData.patient_info.gender || null,
            diagnosis: parsedData.patient_info.diagnosis || [],
            treatmentDetails: parsedData.patient_info.treatment_details?.map(detail => ({
                medication: detail.medication || "Unknown",
                dosage: detail.dosage || "Unknown",
                timing: detail.timing || "Unknown"
            })) || []
        },
        createdAt: new Date().toISOString()
    };
};

// For backward compatibility
const transformPrescriptionData = transformForFirebase;

module.exports = {
    transformForFirebase,
    transformPrescriptionData
};