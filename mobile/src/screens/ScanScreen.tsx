import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  Paragraph,
  TextInput,
  Chip,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { Camera, CameraType } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scriptsAPI } from '../services/api';
import Toast from 'react-native-toast-message';
import { theme, colors } from '../theme/theme';

const { width: screenWidth } = Dimensions.get('window');

interface CapturedImage {
  uri: string;
  pageNumber: number;
  timestamp: Date;
}

const ScanScreen: React.FC = ({ navigation }: any) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const cameraRef = useRef<Camera>(null);
  const paperTheme = useTheme();

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        // For web browsers, check if getUserMedia is available
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // Try to access camera to check permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // If successful, we have permission
            setHasPermission(true);
            // Stop the stream immediately as we just needed to check permission
            stream.getTracks().forEach(track => track.stop());
          } else {
            setHasPermission(false);
          }
        } catch (error) {
          console.log('Camera permission denied or not available:', error);
          setHasPermission(false);
        }
      } else {
        // For native mobile apps, use Expo APIs
        const { status } = await Camera.requestCameraPermissionsAsync();
        const mediaStatus = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(status === 'granted' && mediaStatus.status === 'granted');
      }
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // Process image for better OCR
      const processedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { resize: { width: 1200 } },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      const newImage: CapturedImage = {
        uri: processedImage.uri,
        pageNumber: capturedImages.length + 1,
        timestamp: new Date(),
      };

      setCapturedImages([...capturedImages, newImage]);

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(processedImage.uri);

      Toast.show({
        type: 'success',
        text1: 'Page captured!',
        text2: `Page ${newImage.pageNumber} added`,
      });

    } catch (error) {
      console.error('Error taking picture:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to capture image',
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(newImages.map((img, i) => ({ ...img, pageNumber: i + 1 })));
  };

  const handleUpload = async () => {
    if (!studentId.trim() || !subject.trim() || !examTitle.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    if (capturedImages.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Images',
        text2: 'Please capture at least one script page',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      
      // Add script metadata
      formData.append('studentId', studentId.trim());
      formData.append('subject', subject.trim());
      formData.append('examTitle', examTitle.trim());
      
      // Add sample marking rubric (in production, this would come from a form)
      const sampleRubric = {
        questions: [
          {
            questionNumber: 1,
            questionText: "Explain the concept of photosynthesis",
            maxScore: 10,
            keywords: ["photosynthesis", "chlorophyll", "sunlight", "glucose", "oxygen"]
          },
          {
            questionNumber: 2,
            questionText: "Describe the water cycle",
            maxScore: 8,
            keywords: ["evaporation", "condensation", "precipitation", "runoff"]
          },
          {
            questionNumber: 3,
            questionText: "What are the main parts of a plant?",
            maxScore: 6,
            keywords: ["root", "stem", "leaf", "flower", "seed"]
          },
          {
            questionNumber: 4,
            questionText: "Explain the importance of plants",
            maxScore: 7,
            keywords: ["oxygen", "food", "habitat", "medicine", "materials"]
          },
          {
            questionNumber: 5,
            questionText: "How do plants adapt to their environment?",
            maxScore: 9,
            keywords: ["adaptation", "survival", "environment", "climate", "soil"]
          }
        ]
      };
      
      formData.append('markingRubric', JSON.stringify(sampleRubric));

      // Add images with platform-specific handling
      if (Platform.OS === 'web') {
        // Web platform: Convert blob URLs to File objects
        for (let index = 0; index < capturedImages.length; index++) {
          const image = capturedImages[index];
          try {
            const response = await fetch(image.uri);
            const blob = await response.blob();
            const file = new File([blob], `page_${image.pageNumber}.jpg`, { type: 'image/jpeg' });
            formData.append('pages', file);
          } catch (error) {
            console.error('Error converting image to file:', error);
            Toast.show({
              type: 'error',
              text1: 'File processing error',
              text2: `Failed to process image ${index + 1}`,
            });
            return;
          }
        }
      } else {
        // Native platform: Use direct file objects
        capturedImages.forEach((image, index) => {
          const imageFile = {
            uri: image.uri,
            type: 'image/jpeg',
            name: `page_${image.pageNumber}.jpg`,
          } as any;
          
          formData.append('pages', imageFile);
        });
      }

      console.log('=== SCAN UPLOAD DEBUG ===');
      console.log('Platform:', Platform.OS);
      console.log('Captured images count:', capturedImages.length);
      
      // Debug captured image URIs
      capturedImages.forEach((img, idx) => {
        console.log(`Image ${idx + 1} URI:`, img.uri);
        console.log(`Image ${idx + 1} URI type:`, typeof img.uri);
        console.log(`Image ${idx + 1} starts with blob:`, img.uri.startsWith('blob:'));
      });
      
      console.log('FormData contents:');
      console.log('- studentId:', studentId.trim());
      console.log('- subject:', subject.trim());
      console.log('- examTitle:', examTitle.trim());
      console.log('- markingRubric (parsed):', sampleRubric);
      
      // Count FormData entries (for debugging)
      let formDataEntries = 0;
      try {
        for (let pair of formData.entries()) {
          formDataEntries++;
        }
        console.log('FormData entries count:', formDataEntries);
      } catch (e) {
        console.log('Could not count FormData entries');
      }
      
      const response = await scriptsAPI.upload(formData);

      Toast.show({
        type: 'success',
        text1: 'Upload Successful!',
        text2: 'Script uploaded and processing started',
      });

      // Reset form and navigate back
      setCapturedImages([]);
      setStudentId('');
      setSubject('');
      setExamTitle('');
      navigation.navigate('Home');

    } catch (error: any) {
      console.error('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.response?.data?.error || 'Failed to upload script',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.primary.main, colors.primary.light]}
          style={styles.loadingContainer}
        >
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.error.main, colors.error.light]}
          style={styles.permissionGradient}
        >
          <Card style={styles.permissionCard}>
            <Card.Content style={styles.permissionContent}>
              <Title style={styles.permissionTitle}>Camera Permission Required</Title>
              <Paragraph style={styles.permissionText}>
                {Platform.OS === 'web' 
                  ? 'DeciGrade needs camera access to scan student scripts. Please allow camera access when prompted by your browser, or check your browser\'s site settings to enable camera permissions for this site.'
                  : 'DeciGrade needs camera access to scan student scripts. Please enable camera permissions in your device settings.'
                }
              </Paragraph>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {Platform.OS === 'web' && (
                  <Button
                    mode="outlined"
                    onPress={async () => {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        setHasPermission(true);
                        stream.getTracks().forEach(track => track.stop());
                      } catch (error) {
                        Alert.alert(
                          'Camera Access Denied',
                          'Please allow camera access in your browser settings and try again.'
                        );
                      }
                    }}
                    style={styles.permissionButton}
                    theme={{
                      colors: {
                        primary: colors.primary.main,
                      },
                    }}
                  >
                    Try Again
                  </Button>
                )}
                <Button
                  mode="contained"
                  onPress={() => navigation.goBack()}
                  style={styles.permissionButton}
                  textColor="white"
                  theme={{
                    colors: {
                      primary: colors.primary.main,
                    },
                  }}
                >
                  Go Back
                </Button>
              </View>
            </Card.Content>
          </Card>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            ratio="4:3"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.3)']}
              style={styles.cameraOverlay}
            >
              <View style={styles.cameraControls}>
                <IconButton
                  icon={cameraType === CameraType.back ? 'camera-switch' : 'camera-switch-outline'}
                  iconColor="white"
                  size={30}
                  onPress={() => setCameraType(
                    cameraType === CameraType.back ? CameraType.front : CameraType.back
                  )}
                  style={styles.controlButton}
                />
                <IconButton
                  icon="flash-off"
                  iconColor="white"
                  size={30}
                  onPress={() => {
                    // Flash functionality disabled for now
                  }}
                  style={styles.controlButton}
                />
              </View>
              
              <View style={styles.captureButtonContainer}>
                <LinearGradient
                  colors={[colors.primary.main, colors.primary.light]}
                  style={styles.captureButton}
                >
                  <IconButton
                    icon="camera"
                    iconColor="white"
                    size={40}
                    onPress={takePicture}
                    disabled={isCapturing}
                  />
                </LinearGradient>
              </View>
            </LinearGradient>
          </Camera>
        </View>

        {/* Form Section */}
        <Card style={styles.formCard}>
          <Card.Content style={styles.formContent}>
            <Title style={styles.formTitle}>Script Information</Title>
            
            <TextInput
              label="Student ID"
              value={studentId}
              onChangeText={setStudentId}
              mode="outlined"
              style={styles.input}
              placeholder="Enter student ID or name"
              theme={{
                colors: {
                  primary: colors.primary.main,
                },
              }}
            />

            <TextInput
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Biology, Mathematics"
              theme={{
                colors: {
                  primary: colors.primary.main,
                },
              }}
            />

            <TextInput
              label="Exam Title"
              value={examTitle}
              onChangeText={setExamTitle}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Midterm Exam, Final Test"
              theme={{
                colors: {
                  primary: colors.primary.main,
                },
              }}
            />
          </Card.Content>
        </Card>

        {/* Captured Images */}
        {capturedImages.length > 0 && (
          <Card style={styles.imagesCard}>
            <Card.Content style={styles.imagesContent}>
              <Title style={styles.imagesTitle}>
                Captured Pages ({capturedImages.length})
              </Title>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imagesContainer}>
                  {capturedImages.map((image, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                      <LinearGradient
                        colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.imageOverlay}
                      >
                        <Chip 
                          style={styles.pageChip} 
                          textStyle={styles.pageChipText}
                          mode="outlined"
                        >
                          Page {image.pageNumber}
                        </Chip>
                        <IconButton
                          icon="close"
                          size={20}
                          iconColor="white"
                          style={styles.removeButton}
                          onPress={() => removeImage(index)}
                        />
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </Card.Content>
          </Card>
        )}

        {/* Upload Button */}
        <LinearGradient
          colors={[colors.success.main, colors.success.light]}
          style={styles.uploadButtonGradient}
        >
          <Button
            mode="contained"
            onPress={handleUpload}
            loading={isUploading}
            disabled={isUploading || capturedImages.length === 0}
            style={styles.uploadButton}
            contentStyle={styles.uploadButtonContent}
            labelStyle={styles.uploadButtonLabel}
            icon="upload"
            textColor="white"
            theme={{
              colors: {
                primary: colors.success.main,
              },
            }}
          >
            Upload Script ({capturedImages.length} pages)
          </Button>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  permissionGradient: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  permissionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    ...theme.shadows.large,
  },
  permissionContent: {
    padding: 24,
    alignItems: 'center',
  },
  permissionTitle: {
    color: colors.error.main,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 24,
    color: colors.text.secondary,
  },
  permissionButton: {
    borderRadius: 12,
    ...theme.shadows.medium,
  },
  cameraContainer: {
    height: 350,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    borderRadius: 40,
    ...theme.shadows.large,
  },
  formCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    ...theme.shadows.medium,
  },
  formContent: {
    padding: 24,
  },
  formTitle: {
    marginBottom: 20,
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
    backgroundColor: colors.background.paper,
  },
  imagesCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    ...theme.shadows.medium,
  },
  imagesContent: {
    padding: 24,
  },
  imagesTitle: {
    marginBottom: 20,
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  imagesContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  imageItem: {
    marginRight: 16,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  thumbnail: {
    width: 100,
    height: 140,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 8,
  },
  pageChip: {
    alignSelf: 'flex-start',
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  pageChipText: {
    fontSize: 10,
    fontWeight: '500',
  },
  removeButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.error.main,
    borderRadius: 12,
  },
  uploadButtonGradient: {
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    ...theme.shadows.large,
  },
  uploadButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  uploadButtonContent: {
    paddingVertical: 12,
  },
  uploadButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScanScreen; 