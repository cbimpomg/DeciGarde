# Mobile App Assets

This directory should contain the following image assets for the DeciGrade mobile app:

## Required Assets:

### 1. `icon.png` (1024x1024)
- Main app icon
- PNG format
- Square aspect ratio
- Clear and recognizable at small sizes

### 2. `adaptive-icon.png` (1024x1024)
- Android adaptive icon
- PNG format
- Square aspect ratio
- Designed for Android's adaptive icon system

### 3. `splash.png` (1242x2436 recommended)
- App splash screen
- PNG format
- Should contain app logo and name
- Simple and clean design

### 4. `favicon.png` (32x32)
- Web favicon
- PNG format
- Square aspect ratio
- Matches app branding

## Quick Solutions:

### Option A: Create Simple Icons
1. Use any image editor (Paint, GIMP, Photoshop, etc.)
2. Create simple colored squares with text
3. Save as PNG with exact dimensions

### Option B: Download Free Icons
1. Visit Flaticon, Icons8, or similar sites
2. Download free PNG icons
3. Resize to required dimensions

### Option C: Use Placeholder Services
1. Use online placeholder image generators
2. Generate images with required dimensions
3. Download and rename appropriately

## Temporary Workaround:
If you need to test the app immediately, you can temporarily comment out the icon references in `app.json`:

```json
// Comment out these lines temporarily:
// "icon": "./assets/icon.png",
// "splash": { "image": "./assets/splash.png" },
// "android": { "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png" } },
// "web": { "favicon": "./assets/favicon.png" }
```

**Note:** This will use default Expo icons but allows you to test the app functionality.
