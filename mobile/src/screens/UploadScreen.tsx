import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Platform } from 'react-native';
import { Text, Button, Card, Title, Paragraph, TextInput, Chip, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { scriptsAPI } from '../services/api';
import Toast from 'react-native-toast-message';
import { theme, colors } from '../theme/theme';

const { width } = Dimensions.get('window');

interface UploadScreenProps {
  navigation: any;
}

const UploadScreen: React.FC<UploadScreenProps> = ({ navigation }) => {
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const selectImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10, // Allow up to 10 images
      });

      if (!result.canceled && result.assets.length > 0) {
        // Add new images to existing ones instead of replacing
        setSelectedImages(prevImages => [...prevImages, ...result.assets]);
        Toast.show({
          type: 'success',
          text1: `${result.assets.length} images added`,
          text2: `Total: ${selectedImages.length + result.assets.length} images`,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to select images',
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    Toast.show({
      type: 'success',
      text1: 'Image removed',
      text2: `Page ${index + 1} deleted`,
    });
  };

  const clearAllImages = () => {
    setSelectedImages([]);
    Toast.show({
      type: 'success',
      text1: 'All images cleared',
    });
  };

  const handleUpload = async () => {
    if (!studentId.trim() || !subject.trim() || !examTitle.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all fields',
      });
      return;
    }

    if (selectedImages.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Please select images',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('studentId', studentId.trim());
      formData.append('subject', subject.trim());
      formData.append('examTitle', examTitle.trim());
      
      const sampleRubric = {
        questions: [
          { questionNumber: 1, questionText: "Question 1", maxScore: 10, keywords: ["keyword1", "keyword2"] },
          { questionNumber: 2, questionText: "Question 2", maxScore: 8, keywords: ["keyword3", "keyword4"] },
          { questionNumber: 3, questionText: "Question 3", maxScore: 8, keywords: ["keyword5", "keyword6"] },
          { questionNumber: 4, questionText: "Question 4", maxScore: 9, keywords: ["keyword7", "keyword8"] },
          { questionNumber: 5, questionText: "Question 5", maxScore: 10, keywords: ["keyword9", "keyword10"] },
        ]
      };
      formData.append('markingRubric', JSON.stringify(sampleRubric));

      // Handle file uploads for both web and native platforms
      if (Platform.OS === 'web') {
        // For web platform, convert blob URLs to actual files
        for (let index = 0; index < selectedImages.length; index++) {
          const image = selectedImages[index];
          try {
            const response = await fetch(image.uri);
            const blob = await response.blob();
            const file = new File([blob], `page_${index + 1}.jpg`, { type: 'image/jpeg' });
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
        // For native platforms
        selectedImages.forEach((image, index) => {
          const imageFile = {
            uri: image.uri,
            type: 'image/jpeg',
            name: `page_${index + 1}.jpg`,
          } as any;
          formData.append('pages', imageFile);
        });
      }

      console.log('=== UPLOAD DEBUG ===');
      console.log('Platform:', Platform.OS);
      console.log('Selected images count:', selectedImages.length);
      console.log('FormData entries count:', selectedImages.length + 3); // studentId, subject, examTitle, markingRubric + images

      await scriptsAPI.upload(formData);
      
      Toast.show({
        type: 'success',
        text1: 'Upload successful!',
      });
      
      setSelectedImages([]);
      setStudentId('');
      setSubject('');
      setExamTitle('');
      navigation.navigate('Home');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Upload failed',
        text2: error.response?.data?.error || 'Unknown error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[colors.primary.main, colors.primary.light]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              iconColor="white"
              size={30}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Title style={styles.headerTitle}>Upload Script</Title>
            <Paragraph style={styles.headerSubtitle}>
              Select images from your gallery
            </Paragraph>
          </View>
        </LinearGradient>

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

        {/* Images Section */}
        <Card style={styles.imagesCard}>
          <Card.Content style={styles.imagesContent}>
            <View style={styles.imagesHeader}>
              <Title style={styles.imagesTitle}>
                Script Images ({selectedImages.length})
              </Title>
              <View style={styles.buttonContainer}>
                {selectedImages.length > 0 && (
                  <Button
                    mode="outlined"
                    onPress={clearAllImages}
                    style={styles.clearButton}
                    icon="delete-sweep"
                    textColor={colors.error.main}
                    theme={{
                      colors: {
                        primary: colors.error.main,
                      },
                    }}
                  >
                    Clear All
                  </Button>
                )}
                <LinearGradient
                  colors={[colors.secondary.main, colors.secondary.light]}
                  style={styles.selectButtonGradient}
                >
                  <Button
                    mode="contained"
                    onPress={selectImages}
                    style={styles.selectButton}
                    icon="image-plus"
                    textColor="white"
                    theme={{
                      colors: {
                        primary: colors.secondary.main,
                      },
                    }}
                  >
                    Select Images
                  </Button>
                </LinearGradient>
              </View>
            </View>
            
            {selectedImages.length === 0 ? (
              <View style={styles.emptyState}>
                <Paragraph style={styles.emptyStateText}>
                  No images selected yet. Tap "Select Images" to choose script pages from your gallery.
                </Paragraph>
                <Paragraph style={styles.emptyStateSubtext}>
                  You can select multiple images to upload a complete script.
                </Paragraph>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imagesContainer}>
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                      <IconButton
                        icon="close-circle"
                        iconColor={colors.error.main}
                        size={24}
                        style={styles.removeButton}
                        onPress={() => removeImage(index)}
                      />
                      <LinearGradient
                        colors={[colors.primary.main, colors.primary.light]}
                        style={styles.pageChipGradient}
                      >
                        <Chip 
                          style={styles.pageChip}
                          textStyle={styles.pageChipText}
                          mode="outlined"
                        >
                          Page {index + 1}
                        </Chip>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </Card.Content>
        </Card>

        {/* Upload Button */}
        <LinearGradient
          colors={[colors.success.main, colors.success.light]}
          style={styles.uploadButtonGradient}
        >
          <Button
            mode="contained"
            onPress={handleUpload}
            loading={isUploading}
            disabled={isUploading || selectedImages.length === 0}
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
            Upload Script ({selectedImages.length} pages)
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
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formCard: {
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    ...theme.shadows.large,
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
  imagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  imagesTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 10,
    borderRadius: 12,
  },
  selectButtonGradient: {
    borderRadius: 12,
    ...theme.shadows.medium,
  },
  selectButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  imageItem: {
    marginRight: 16,
    alignItems: 'center',
  },
  thumbnail: {
    width: 100,
    height: 140,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.primary.light,
    ...theme.shadows.small,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
  },
  pageChipGradient: {
    borderRadius: 12,
  },
  pageChip: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  pageChipText: {
    fontSize: 10,
    fontWeight: '500',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.text.hint,
    textAlign: 'center',
  },
});

export default UploadScreen; 