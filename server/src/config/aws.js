const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Initialize AWS services
const s3 = new AWS.S3();
const textract = new AWS.Textract();

module.exports = {
  s3,
  textract
};