const { ImageAnnotatorClient } = require('@google-cloud/vision');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Enhanced OCR service optimized for handwritten text
class EnhancedOCRService {
  constructor() {
    this.visionClient = null;
    this.initializeGoogleVision();
  }

  initializeGoogleVision() {
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.visionClient = new ImageAnnotatorClient();
        console.log('✅ Google Vision API initialized for enhanced OCR');
      } else {
        console.log('⚠️  Google Vision not configured, using Tesseract with enhancements');
      }
    } catch (error) {
      console.log('Google Vision initialization failed, using Tesseract with enhancements');
    }
  }

  // Enhanced preprocessing for handwritten text
  async preprocessForHandwriting(imageBuffer) {
    try {
      console.log('🔧 Preprocessing image for handwritten text recognition...');
      
      let processedImage = sharp(imageBuffer);
      
      // Step 1: Convert to grayscale
      processedImage = processedImage.grayscale();
      
      // Step 2: Enhance contrast for better text recognition
      processedImage = processedImage.linear(1.2, -0.1); // Increase contrast
      
      // Step 3: Reduce noise while preserving text
      processedImage = processedImage.median(1); // Light noise reduction
      
      // Step 4: Sharpen the image
      processedImage = processedImage.sharpen({
        sigma: 1,
        flat: 1,
        jagged: 2
      });
      
      // Step 5: Enhance edges for better character recognition
      processedImage = processedImage.convolve({
        width: 3,
        height: 3,
        kernel: [
          -1, -1, -1,
          -1,  9, -1,
          -1, -1, -1
        ]
      });
      
      // Step 6: Adjust brightness and contrast
      processedImage = processedImage.modulate({
        brightness: 1.1,
        contrast: 1.3
      });
      
      // Step 7: Apply adaptive thresholding
      processedImage = processedImage.threshold(128);
      
      // Step 8: Remove small artifacts
      processedImage = processedImage.morphology({
        operation: 'open',
        kernel: sharp.kernel.square(2)
      });
      
      const processedBuffer = await processedImage.toBuffer();
      console.log('✅ Image preprocessing completed');
      
      return processedBuffer;
      
    } catch (error) {
      console.error('Preprocessing error:', error);
      return imageBuffer; // Return original if preprocessing fails
    }
  }

  // Enhanced OCR with multiple approaches
  async extractTextEnhanced(imageBuffer, options = {}) {
    try {
      console.log('🔍 Starting enhanced OCR extraction...');
      
      // Preprocess image for handwritten text
      const processedImage = await this.preprocessForHandwriting(imageBuffer);
      
      const results = {
        google: null,
        tesseract: null,
        combined: null
      };
      
      // Try Google Vision first (if available)
      if (this.visionClient) {
        try {
          results.google = await this.extractWithGoogleVision(processedImage, options);
          console.log('✅ Google Vision OCR completed');
        } catch (error) {
          console.log('⚠️  Google Vision failed, trying Tesseract');
        }
      }
      
      // Always try Tesseract with enhanced settings
      try {
        results.tesseract = await this.extractWithTesseractEnhanced(processedImage, options);
        console.log('✅ Enhanced Tesseract OCR completed');
      } catch (error) {
        console.error('Tesseract OCR error:', error);
      }
      
      // Combine results for better accuracy
      results.combined = this.combineOCRResults(results);
      
      return results.combined;
      
    } catch (error) {
      console.error('Enhanced OCR error:', error);
      throw error;
    }
  }

  // Google Vision with handwriting optimization
  async extractWithGoogleVision(imageBuffer, options = {}) {
    try {
      const request = {
        image: {
          content: imageBuffer.toString('base64')
        },
        features: [
          {
            type: 'TEXT_DETECTION',
            maxResults: 1
          }
        ],
        imageContext: {
          languageHints: options.language || ['en'],
          textDetectionParams: {
            enableTextDetectionConfidenceScore: true
          }
        }
      };
      
      const [result] = await this.visionClient.annotateImage(request);
      const detections = result.textAnnotations;
      
      if (detections && detections.length > 0) {
        const fullText = detections[0].description;
        const confidence = this.calculateGoogleConfidence(detections);
        
        return {
          text: fullText,
          confidence: confidence,
          provider: 'google-vision'
        };
      }
      
      return { text: '', confidence: 0, provider: 'google-vision' };
      
    } catch (error) {
      console.error('Google Vision extraction error:', error);
      throw error;
    }
  }

  // Enhanced Tesseract with handwriting optimization
  async extractWithTesseractEnhanced(imageBuffer, options = {}) {
    try {
      const worker = await Tesseract.createWorker();
      
      // Configure for handwritten text
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      // Set parameters optimized for handwriting
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}"\'-_+=/\\|@#$%^&*~`<>',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        preserve_interword_spaces: '1',
        textord_heavy_nr: '1',
        textord_min_linesize: '2.5',
        textord_old_baselines: '0',
        textord_noise_debug: '0',
        textord_heavy_nr: '1',
        textord_min_linesize: '2.5',
        textord_old_baselines: '0',
        textord_noise_debug: '0',
        tessedit_do_invert: '0',
        tessedit_image_border: '0',
        tessedit_ocr_engine_mode: '3',
        tessedit_pageseg_mode: '3',
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}"\'-_+=/\\|@#$%^&*~`<>',
        preserve_interword_spaces: '1',
        textord_heavy_nr: '1',
        textord_min_linesize: '2.5',
        textord_old_baselines: '0',
        textord_noise_debug: '0'
      });
      
      const { data } = await worker.recognize(imageBuffer);
      
      await worker.terminate();
      
      return {
        text: data.text,
        confidence: data.confidence / 100,
        provider: 'tesseract-enhanced'
      };
      
    } catch (error) {
      console.error('Enhanced Tesseract error:', error);
      throw error;
    }
  }

  // Combine OCR results for better accuracy
  combineOCRResults(results) {
    const texts = [];
    const confidences = [];
    
    if (results.google && results.google.text) {
      texts.push(results.google.text);
      confidences.push(results.google.confidence);
    }
    
    if (results.tesseract && results.tesseract.text) {
      texts.push(results.tesseract.text);
      confidences.push(results.tesseract.confidence);
    }
    
    if (texts.length === 0) {
      return { text: '', confidence: 0, provider: 'combined' };
    }
    
    // If only one result, return it
    if (texts.length === 1) {
      return {
        text: texts[0],
        confidence: confidences[0],
        provider: 'single'
      };
    }
    
    // Combine multiple results intelligently
    const combinedText = this.mergeTexts(texts);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    return {
      text: combinedText,
      confidence: avgConfidence,
      provider: 'combined'
    };
  }

  // Intelligent text merging
  mergeTexts(texts) {
    if (texts.length === 1) return texts[0];
    
    // Split into lines for comparison
    const textLines = texts.map(text => text.split('\n').filter(line => line.trim()));
    
    // Find the longest text as base
    const longestTextIndex = texts.reduce((maxIndex, text, index) => 
      text.length > texts[maxIndex].length ? index : maxIndex, 0
    );
    
    const baseText = texts[longestTextIndex];
    const baseLines = textLines[longestTextIndex];
    
    // Merge with other texts
    let mergedText = baseText;
    
    for (let i = 0; i < texts.length; i++) {
      if (i === longestTextIndex) continue;
      
      const currentLines = textLines[i];
      const currentText = texts[i];
      
      // If current text is significantly different, append it
      const similarity = this.calculateTextSimilarity(baseText, currentText);
      if (similarity < 0.7) {
        mergedText += '\n\n--- Alternative OCR Result ---\n' + currentText;
      }
    }
    
    return mergedText;
  }

  // Calculate text similarity
  calculateTextSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Calculate Google Vision confidence
  calculateGoogleConfidence(detections) {
    if (!detections || detections.length === 0) return 0;
    
    let totalConfidence = 0;
    let count = 0;
    
    for (const detection of detections) {
      if (detection.confidence) {
        totalConfidence += detection.confidence;
        count++;
      }
    }
    
    return count > 0 ? totalConfidence / count : 0;
  }

  // Process batch OCR with enhanced settings
  async processBatchOCREnhanced(scriptId, options = {}) {
    try {
      console.log(`🔄 Starting enhanced batch OCR for script: ${scriptId}`);
      
      const Script = require('../models/Script');
      const script = await Script.findById(scriptId);
      
      if (!script) {
        throw new Error('Script not found');
      }
      
      // Update status
      script.status = 'processing';
      await script.save();
      
      const results = [];
      
      for (let i = 0; i < script.pages.length; i++) {
        const page = script.pages[i];
        
        try {
          console.log(`📄 Processing page ${i + 1}/${script.pages.length}`);
          
          // Read image file
          const imagePath = path.join(__dirname, '..', 'uploads', page.imagePath);
          const imageBuffer = fs.readFileSync(imagePath);
          
          // Extract text with enhanced OCR
          const ocrResult = await this.extractTextEnhanced(imageBuffer, {
            language: options.language || 'en',
            ...options
          });
          
          // Update page with OCR result
          page.ocrText = ocrResult.text;
          page.ocrConfidence = ocrResult.confidence;
          page.ocrProvider = ocrResult.provider;
          
          results.push({
            pageIndex: i,
            success: true,
            text: ocrResult.text,
            confidence: ocrResult.confidence,
            provider: ocrResult.provider
          });
          
        } catch (pageError) {
          console.error(`Error processing page ${i + 1}:`, pageError);
          results.push({
            pageIndex: i,
            success: false,
            error: pageError.message
          });
        }
      }
      
      // Update script
      script.status = 'uploaded';
      await script.save();
      
      // Emit completion event
      const io = require('../server').get('io');
      if (io) {
        io.emit('script-ocr-completed', {
          scriptId: script._id,
          results: results
        });
      }
      
      console.log(`✅ Enhanced batch OCR completed for script: ${scriptId}`);
      
      return {
        scriptId,
        results: results,
        totalPages: script.pages.length,
        successfulPages: results.filter(r => r.success).length
      };
      
    } catch (error) {
      console.error('Enhanced batch OCR error:', error);
      throw error;
    }
  }

  // Get enhanced OCR statistics
  async getEnhancedOCRStats() {
    try {
      const Script = require('../models/Script');
      
      const stats = await Script.aggregate([
        {
          $project: {
            totalScripts: 1,
            totalPages: { $size: '$pages' },
            avgConfidence: {
              $avg: {
                $map: {
                  input: '$pages',
                  as: 'page',
                  in: '$$page.ocrConfidence'
                }
              }
            },
            providers: {
              $addToSet: '$pages.ocrProvider'
            }
          }
        },
        {
          $group: {
            _id: null,
            totalScripts: { $sum: 1 },
            totalPages: { $sum: '$totalPages' },
            avgConfidence: { $avg: '$avgConfidence' },
            allProviders: { $addToSet: '$providers' }
          }
        }
      ]);
      
      return stats[0] || {
        totalScripts: 0,
        totalPages: 0,
        avgConfidence: 0,
        allProviders: []
      };
      
    } catch (error) {
      console.error('Error getting enhanced OCR stats:', error);
      return {
        totalScripts: 0,
        totalPages: 0,
        avgConfidence: 0,
        allProviders: []
      };
    }
  }
}

// Create singleton instance
const enhancedOCRService = new EnhancedOCRService();

module.exports = enhancedOCRService; 