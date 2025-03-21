const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

/**
 * Upload file to S3 bucket
 * @param {Object} file - The file object from multer
 * @param {String} bucketName - The S3 bucket name
 * @returns {Promise<Object>} - The S3 upload response
 */
const uploadToS3 = async (file, bucketName = process.env.S3_BUCKET_NAME) => {
    return new Promise((resolve, reject) => {
        // When using multer's memoryStorage, the file content is in buffer
        // No need to use fs.createReadStream
        
        // Generate unique file key
        const timestamp = Date.now();
        const fileKey = `prescriptions/${timestamp}-${file.originalname}`;
        
        const uploadParams = {
            Bucket: bucketName,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype
        };
        
        s3.upload(uploadParams, (err, data) => {
            if (err) {
                return reject(err);
            }
            
            // Return an object with both Bucket and Key for consistency
            return resolve({
                Bucket: bucketName,
                Key: fileKey,
                Location: data.Location
            });
        });
    });
};

/**
 * Get S3 object params for Textract
 * @param {String} bucket - The S3 bucket name
 * @param {String} key - The S3 file key
 * @returns {Object} - S3 object params for Textract
 */
const getS3Params = (bucket, key) => {
    return {
        Document: {
            S3Object: {
                Bucket: bucket,
                Name: key
            }
        }
    };
};

module.exports = {
    uploadToS3,
    getS3Params
};