const AWS = require('aws-sdk');

// Configure AWS if not already done in s3Service
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const textract = new AWS.Textract();

/**
 * Extract text from document using AWS Textract
 * @param {String} bucket - S3 bucket name
 * @param {String} key - S3 object key
 * @returns {Promise<String>} - Extracted text
 */
const extractText = async (bucket, key) => {
    const params = {
        Document: {
            S3Object: {
                Bucket: bucket,
                Name: key
            }
        }
    };

    return new Promise((resolve, reject) => {
        textract.detectDocumentText(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            
            const extractedText = data.Blocks
                .filter(block => block.BlockType === "LINE")
                .map(block => block.Text)
                .join('\n');
                
            resolve(extractedText);
        });
    });
};

module.exports = {
    extractText
};