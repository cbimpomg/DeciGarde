const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const Script = require('../models/Script');
const { extractTextViaPaddle } = (() => {
  try {
    return require('./paddleOCRClient');
  } catch (e) {
    return { extractTextViaPaddle: null };
  }
})();

// Initialize Google Vision client (if credentials are available)
let visionClient = null;
try {
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    visionClient = new ImageAnnotatorClient();
  }
} catch (error) {
  console.log('Google Vision API not configured, using Tesseract.js as fallback');
}


const processOCR = async (scriptId, options = {}) => {
  try {
    console.log(`Starting OCR processing for script: ${scriptId}`);
    
    const script = await Script.findById(scriptId);
    if (!script) {
      throw new Error('Script not found');
    }
    
    // Update script status to processing
    script.status = 'processing';
    await script.save();
    
    const processedPages = [];
    const { useGoogleVision = true, useTesseract = true, language = 'en' } = options;
    
    // Process each page
    for (const page of script.pages) {
      try {
        console.log(`Processing page ${page.pageNumber} for script ${scriptId}`);
        
        const imagePath = path.join(__dirname, '..', page.imageUrl);
        
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
          console.error(`Image file not found: ${imagePath}`);
          continue;
        }
        
        // Preprocess image for better OCR
        const processedImageBuffer = await preprocessImage(imagePath);
        
        let ocrText = '';
        let confidence = 0;
        let ocrProvider = 'tesseract';
        
        // Try external provider overrides first
        const providerEnv = (process.env.OCR_PROVIDER || '').toLowerCase();
        if (providerEnv === 'paddle' && extractTextViaPaddle) {
          try {
            const paddle = await extractTextViaPaddle(processedImageBuffer);
            ocrText = paddle.text;
            confidence = paddle.confidence;
            ocrProvider = 'paddleocr';
            console.log(`PaddleOCR completed for page ${page.pageNumber}. Confidence: ${confidence}`);
          } catch (err) {
            console.log('PaddleOCR failed, falling back:', err.message);
          }
        }

        // Try Google Vision API if configured and no text yet
        if (!ocrText && useGoogleVision && visionClient) {
          try {
            const googleResult = await processWithGoogleVision(processedImageBuffer);
            if (googleResult.text && googleResult.confidence > 0.7) {
              ocrText = googleResult.text;
              confidence = googleResult.confidence;
              ocrProvider = 'google-vision';
              console.log(`Google Vision OCR completed for page ${page.pageNumber}. Confidence: ${confidence}%`);
            }
          } catch (googleError) {
            console.log(`Google Vision failed for page ${page.pageNumber}, falling back to Tesseract:`, googleError.message);
          }
        }
        
        // Fallback to Tesseract if others failed or not available
        if (!ocrText && useTesseract) {
          const tesseractResult = await processWithTesseract(processedImageBuffer, language);
          ocrText = tesseractResult.text;
          confidence = tesseractResult.confidence;
          ocrProvider = 'tesseract';
          console.log(`Tesseract OCR completed for page ${page.pageNumber}. Confidence: ${confidence}%`);
        }
        
        // Update page with OCR results
        page.ocrText = ocrText;
        page.processedAt = new Date();
        page.ocrProvider = ocrProvider;
        page.confidence = confidence;
        
        processedPages.push({
          pageNumber: page.pageNumber,
          ocrText,
          confidence,
          ocrProvider,
          processedAt: page.processedAt
        });
        
      } catch (pageError) {
        console.error(`Error processing page ${page.pageNumber}:`, pageError);
        page.ocrText = '';
        page.processedAt = new Date();
        page.ocrProvider = 'failed';
        page.confidence = 0;
      }
    }
    
    // Update script with processed pages
    script.pages = script.pages.map(page => {
      const processedPage = processedPages.find(p => p.pageNumber === page.pageNumber);
      if (processedPage) {
        page.ocrText = processedPage.ocrText;
        page.processedAt = processedPage.processedAt;
        page.ocrProvider = processedPage.ocrProvider;
        page.confidence = processedPage.confidence;
      }
      return page;
    });
    
    // Update script status
    script.status = 'uploaded'; // Ready for marking
    script.processedAt = new Date();
    
    await script.save();
    
    // Emit real-time update for OCR completion
    const scriptWithUser = await Script.findById(scriptId).populate('uploadedBy');
    if (scriptWithUser) {
      const io = require('../server').get('io');
      if (io) {
        io.emit('script-ocr-completed', {
          scriptId: script._id,
          studentId: script.studentId,
          subject: script.subject,
          examTitle: script.examTitle,
          status: script.status,
          processedPages: processedPages.length,
          totalPages: script.pages.length,
          uploadedBy: scriptWithUser.uploadedBy
        });
      }
    }
    
    console.log(`OCR processing completed for script: ${scriptId}`);
    return {
      scriptId: script._id,
      processedPages: processedPages.length,
      totalPages: script.pages.length,
      status: script.status
    };
    
  } catch (error) {
    console.error('OCR processing error:', error);
    throw error;
  }
};

// Google Vision API processing
const processWithGoogleVision = async (imageBuffer) => {
  try {
    const [result] = await visionClient.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return { text: '', confidence: 0 };
    }
    
    // Extract text from all detected text blocks
    const textBlocks = detections.slice(1).map(annotation => annotation.description);
    const fullText = textBlocks.join('\n');
    
    // Calculate confidence based on number of detected text blocks
    const confidence = Math.min(detections.length / 10, 1.0); // Normalize confidence
    
    return {
      text: fullText.trim(),
      confidence: confidence
    };
  } catch (error) {
    console.error('Google Vision API error:', error);
    throw error;
  }
};

// Tesseract.js processing
const processWithTesseract = async (imageBuffer, language = 'eng') => {
  try {
    const result = await Tesseract.recognize(
      imageBuffer,
      language,
      {
        logger: m => console.log(`Tesseract Progress: ${m.progress * 100}%`),
        errorHandler: err => console.error('Tesseract Error:', err)
      }
    );
    
    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence / 100 // Normalize to 0-1
    };
  } catch (error) {
    console.error('Tesseract error:', error);
    throw error;
  }
};

// Enhanced image preprocessing
const preprocessImage = async (imagePath) => {
  try {
    const image = sharp(imagePath);
    
    // Get image metadata
    const metadata = await image.metadata();
    
    // Apply preprocessing based on image characteristics
    let processedImage = image;
    
    // Convert to grayscale for better OCR
    processedImage = processedImage.grayscale();
    
    // Enhance contrast
    processedImage = processedImage.linear(1.2, -0.1);
    
    // Reduce noise
    processedImage = processedImage.median(1);
    
    // Sharpen the image
    processedImage = processedImage.sharpen();
    
    // Resize if image is too large (max 2000px width)
    if (metadata.width > 2000) {
      processedImage = processedImage.resize(2000, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // Convert to PNG buffer for better OCR
    const buffer = await processedImage.png().toBuffer();
    
    return buffer;
  } catch (error) {
    console.error('Image preprocessing error:', error);
    // Return original image if preprocessing fails
    return fs.readFileSync(imagePath);
  }
};

// Extract text from a single page
const extractTextFromPage = async (imagePath, options = {}) => {
  try {
    const processedImageBuffer = await preprocessImage(imagePath);
    
    let ocrText = '';
    let confidence = 0;
    let ocrProvider = 'tesseract';
    
    // Try Google Vision first
    if (visionClient && options.useGoogleVision !== false) {
      try {
        const googleResult = await processWithGoogleVision(processedImageBuffer);
        if (googleResult.text && googleResult.confidence > 0.7) {
          ocrText = googleResult.text;
          confidence = googleResult.confidence;
          ocrProvider = 'google-vision';
        }
      } catch (error) {
        console.log('Google Vision failed, using Tesseract:', error.message);
      }
    }
    
    // Fallback to Tesseract
    if (!ocrText) {
      const tesseractResult = await processWithTesseract(processedImageBuffer, options.language || 'eng');
      ocrText = tesseractResult.text;
      confidence = tesseractResult.confidence;
      ocrProvider = 'tesseract';
    }
    
    return {
      text: ocrText,
      confidence: confidence,
      provider: ocrProvider
    };
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

// Batch OCR processing
const processBatchOCR = async (scriptIds, options = {}) => {
  const results = [];
  
  for (const scriptId of scriptIds) {
    try {
      const result = await processOCR(scriptId, options);
      results.push({ scriptId, success: true, ...result });
    } catch (error) {
      results.push({ scriptId, success: false, error: error.message });
    }
  }
  
  return results;
};

// Get OCR statistics
const getOCRStats = async () => {
  try {
    const stats = await Script.aggregate([
      {
        $match: {
          'pages.ocrText': { $exists: true, $ne: '' }
        }
      },
      {
        $project: {
          totalScripts: 1,
          totalPages: { $size: '$pages' },
          processedPages: {
            $size: {
              $filter: {
                input: '$pages',
                cond: { $ne: ['$$this.ocrText', ''] }
              }
            }
          },
          avgConfidence: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: '$pages',
                    cond: { $ne: ['$$this.ocrText', ''] }
                  }
                },
                as: 'page',
                in: '$$page.confidence'
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalScripts: { $sum: 1 },
          totalPages: { $sum: '$totalPages' },
          processedPages: { $sum: '$processedPages' },
          avgConfidence: { $avg: '$avgConfidence' }
        }
      }
    ]);
    
    return stats[0] || {
      totalScripts: 0,
      totalPages: 0,
      processedPages: 0,
      avgConfidence: 0
    };
  } catch (error) {
    console.error('Error getting OCR stats:', error);
    return {
      totalScripts: 0,
      totalPages: 0,
      processedPages: 0,
      avgConfidence: 0
    };
  }
};

module.exports = {
  processOCR,
  extractTextFromPage,
  processBatchOCR,
  getOCRStats,
  preprocessImage
}; 