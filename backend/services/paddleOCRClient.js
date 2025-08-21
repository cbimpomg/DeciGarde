const OCR_API_BASE = process.env.OCR_API_BASE || 'http://127.0.0.1:8001';
const FormData = require('form-data');
const axios = require('axios');

async function extractTextViaPaddle(buffer) {
  const form = new FormData();
  form.append('file', buffer, { filename: 'page.png', contentType: 'image/png' });

  const res = await axios.post(`${OCR_API_BASE}/ocr`, form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  const data = res.data || {};
  return {
    text: data.text || '',
    confidence: typeof data.confidence === 'number' ? data.confidence : 0,
    provider: 'paddleocr'
  };
}

module.exports = { extractTextViaPaddle };

