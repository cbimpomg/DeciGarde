# 🔍 Google Vision API Setup Guide

This guide will help you set up Google Cloud Vision API for enhanced OCR processing in DeciGrade.

## 📋 Prerequisites

- Google Cloud account (free tier available)
- Credit card for billing verification (Google provides $300 free credit)
- Basic understanding of Google Cloud Console

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. **Visit Google Cloud Console**: https://console.cloud.google.com/
2. **Click "Select a project"** → **"New Project"**
3. **Enter project details**:
   - **Project name**: `decigrade-ocr`
   - **Project ID**: `decigrade-ocr-xxxxx` (auto-generated)
4. **Click "Create"**

### Step 2: Enable Billing

1. **Go to Billing** in the left sidebar
2. **Click "Link a billing account"**
3. **Add your payment method** (required for API usage)
4. **Note**: Google provides $300 free credit for new accounts

### Step 3: Enable Vision API

1. **Navigate to APIs & Services** → **Library**
2. **Search for "Cloud Vision API"**
3. **Click on "Cloud Vision API"**
4. **Click "Enable"**

### Step 4: Create Service Account

1. **Go to APIs & Services** → **Credentials**
2. **Click "Create Credentials"** → **Service Account**
3. **Fill in service account details**:
   ```
   Service account name: decigrade-vision-api
   Service account ID: decigrade-vision-api
   Description: Service account for DeciGrade OCR processing
   ```
4. **Click "Create and Continue"**
5. **Skip role assignment** (we'll add roles manually)
6. **Click "Done"**

### Step 5: Add Permissions

1. **Click on your service account** in the list
2. **Go to "Permissions" tab**
3. **Click "Grant Access"**
4. **Add these roles**:
   - `Cloud Vision API User`
   - `Storage Object Viewer` (if using Cloud Storage)
5. **Click "Save"**

### Step 6: Create JSON Key

1. **Go to "Keys" tab**
2. **Click "Add Key"** → **Create new key**
3. **Choose JSON format**
4. **Click "Create"**
5. **Download the JSON file** (keep it secure!)

### Step 7: Configure Environment

1. **Place the JSON file** in your backend directory:
   ```
   backend/google-credentials.json
   ```

2. **Update your `.env` file**:
   ```bash
   # Google Cloud Vision API
   GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   ```

3. **Replace `your-project-id`** with your actual project ID

### Step 8: Test the Setup

Run the test script to verify everything is working:

```bash
cd backend
node test-google-vision.js
```

## 🔧 Troubleshooting

### Common Issues:

1. **"Credentials file not found"**
   - Make sure the JSON file is in the correct location
   - Check the path in your `.env` file

2. **"UNAUTHENTICATED" error**
   - Verify your service account has the correct roles
   - Check that the project ID is correct

3. **"PERMISSION_DENIED" error**
   - Ensure the service account has "Cloud Vision API User" role
   - Make sure the Vision API is enabled

4. **"ENOTFOUND" error**
   - Check your internet connection
   - Verify the API is enabled in your project

## 💰 Cost Information

- **Free tier**: 1,000 requests per month
- **Paid tier**: $1.50 per 1,000 requests
- **Text detection**: $1.50 per 1,000 images
- **Document text detection**: $1.50 per 1,000 images

## 🔒 Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for sensitive data
3. **Rotate keys regularly**
4. **Limit service account permissions**
5. **Monitor API usage** in Google Cloud Console

## 📊 Monitoring Usage

1. **Go to Google Cloud Console**
2. **Navigate to APIs & Services** → **Dashboard**
3. **Click on "Cloud Vision API"**
4. **View usage metrics and quotas**

## 🎯 Next Steps

Once Google Vision API is configured:

1. **Test with sample images**
2. **Monitor OCR accuracy**
3. **Adjust confidence thresholds**
4. **Set up usage alerts**
5. **Configure fallback to Tesseract.js**

## 📞 Support

- **Google Cloud Documentation**: https://cloud.google.com/vision/docs
- **API Reference**: https://cloud.google.com/vision/docs/reference/rest
- **Pricing**: https://cloud.google.com/vision/pricing

---

**Note**: The system will automatically fall back to Tesseract.js if Google Vision API is not configured or fails. 