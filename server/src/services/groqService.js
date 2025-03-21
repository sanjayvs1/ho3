const axios = require('axios');

/**
 * Call Groq API to parse prescription text
 * @param {String} text - The prescription text to parse
 * @returns {Promise<Object>} - Parsed prescription data
 */
const parseText = async (text) => {
    const prompt = `
You are a medical data parser. Analyze the following prescription text and extract structured JSON data.

1. Doctor Info:
- Name (string)
- Qualifications (array of strings)
- Address (string)
- Contact Info (string)
- Registration Number (string)
- Hospital Details (object with keys: name, address, contactInfo)

2. Patient Info:
- Name (string)
- Age (number)
- Gender (string, if available)
- Diagnosis (array of strings)
- Treatment Details (array of objects with keys: medication, dosage, timing)

Example Output:
\`\`\`json
{
  "doctor_info": {
    "name": "Dr. John Doe",
    "qualifications": ["M.B.B.S", "M.D"],
    "address": "123 Medical St, City, Country",
    "contact_info": "+1234567890",
    "registration_number": "REG123456",
    "hospital_details": {
      "name": "City General Hospital",
      "address": "456 Health Rd, City, Country",
      "contact_info": "+9876543210"
    }
  },
  "patient_info": {
    "name": "Jane Smith",
    "age": 30,
    "gender": "Female",
    "diagnosis": ["Hypertension", "Diabetes"],
    "treatment_details": [
      { "medication": "Lisinopril", "dosage": "10mg", "timing": "Once daily" },
      { "medication": "Metformin", "dosage": "500mg", "timing": "Twice daily" }
    ]
  }
}
\`\`\`

Prescription Text:
"""${text}"""

Return the structured JSON enclosed in triple backticks (\`\`\`json ... \`\`\`):
    `;

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                }
            }
        );

        // Extract the JSON content using regex
        const result = response.data.choices[0].message.content;
        const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
        
        if (!jsonMatch || !jsonMatch[1]) {
            throw new Error("No valid JSON found in the Groq API response.");
        }

        const jsonString = jsonMatch[1].trim();
        
        // Parse the JSON string
        const parsedData = JSON.parse(jsonString);

        // Validate the parsed data
        if (!parsedData.doctor_info || !parsedData.patient_info) {
            throw new Error("Parsed JSON is missing required fields.");
        }

        return parsedData;
    } catch (error) {
        console.error("Error from Groq API:", error.response?.data || error.message);
        throw error;
    }
};

module.exports = {
    parseText
};