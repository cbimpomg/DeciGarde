import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, Title, Paragraph, Chip, Button, IconButton, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { scriptsAPI } from '../services/api';
import { theme, colors } from '../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Script {
  _id: string;
  studentId: string;
  subject: string;
  examTitle: string;
  status: string;
  pages?: any[];
  uploadedAt: string;
}

const HistoryScreen: React.FC = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    try {
      setLoading(true);
      
      // Check if we have authentication
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        console.warn('No auth token found, cannot load scripts');
        setScripts([]);
        return;
      }
      
      const response = await scriptsAPI.getAll();
      console.log('Scripts API response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data:', response.data);
      
      // Ensure we have an array of scripts
      if (response.data && Array.isArray(response.data)) {
        console.log('Setting scripts from response.data (array)');
        setScripts(response.data);
      } else if (response.data && Array.isArray(response.data.scripts)) {
        console.log('Setting scripts from response.data.scripts');
        setScripts(response.data.scripts);
      } else if (response.data && Array.isArray(response.data.data)) {
        console.log('Setting scripts from response.data.data');
        setScripts(response.data.data);
      } else {
        console.warn('Unexpected API response format:', response.data);
        console.warn('Response data keys:', response.data ? Object.keys(response.data) : 'No data');
        setScripts([]);
      }
    } catch (error: unknown) {
      console.error('Error loading scripts:', error);
      console.error('Error details:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { status: number; data: any } };
        console.error('Error response status:', apiError.response.status);
        console.error('Error response data:', apiError.response.data);
      }
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return colors.success.main;
      case 'pending':
        return colors.warning.main;
      case 'processing':
        return colors.info.main;
      case 'error':
        return colors.error.main;
      default:
        return colors.grey[500];
    }
  };

  const getStatusGradient = (status: string): [string, string] => {
    switch (status.toLowerCase()) {
      case 'completed':
        return colors.gradient.success as [string, string];
      case 'pending':
        return colors.gradient.warning as [string, string];
      case 'processing':
        return colors.gradient.primary as [string, string];
      case 'error':
        return colors.gradient.error as [string, string];
      default:
        return [colors.grey[500], colors.grey[400]];
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.primary.main, colors.primary.light]}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading your scripts...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary.main, colors.primary.light]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Title style={styles.headerTitle}>Script History</Title>
          <Paragraph style={styles.headerSubtitle}>
            View all your uploaded scripts
          </Paragraph>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!Array.isArray(scripts) || scripts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <IconButton
                icon="file-document-outline"
                size={60}
                iconColor={colors.grey[400]}
                style={styles.emptyIcon}
              />
              <Title style={styles.emptyTitle}>No Scripts Found</Title>
              <Paragraph style={styles.emptyText}>
                {!Array.isArray(scripts) 
                  ? 'Unable to load scripts. Please try again later.'
                  : 'You haven\'t uploaded any scripts yet. Start by scanning or uploading your first script.'
                }
              </Paragraph>
              {!Array.isArray(scripts) && (
                <Button 
                  mode="contained" 
                  onPress={loadScripts}
                  style={{ marginTop: 16 }}
                >
                  Retry
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          scripts.map((script: Script, index: number) => (
            <Card key={script._id} style={styles.scriptCard}>
              <LinearGradient
                colors={getStatusGradient(script.status)}
                style={styles.scriptGradient}
              >
                <Card.Content style={styles.scriptContent}>
                  <View style={styles.scriptHeader}>
                    <View style={styles.scriptInfo}>
                      <Title style={styles.scriptTitle}>{script.studentId}</Title>
                      <Paragraph style={styles.scriptSubtitle}>
                        {script.subject} • {script.examTitle}
                      </Paragraph>
                    </View>
                    <IconButton
                      icon="chevron-right"
                      iconColor="white"
                      size={24}
                      style={styles.scriptArrow}
                    />
                  </View>
                  
                  <View style={styles.scriptDetails}>
                    <View style={styles.detailItem}>
                      <IconButton
                        icon="file-image"
                        iconColor="white"
                        size={20}
                        style={styles.detailIcon}
                      />
                      <Text style={styles.detailText}>
                        {script.pages?.length || 0} pages
                      </Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <IconButton
                        icon="calendar"
                        iconColor="white"
                        size={20}
                        style={styles.detailIcon}
                      />
                      <Text style={styles.detailText}>
                        {new Date(script.uploadedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.statusContainer}
                  >
                    <Chip 
                      style={styles.statusChip}
                      textStyle={styles.statusChipText}
                      mode="outlined"
                    >
                      {script.status}
                    </Chip>
                  </LinearGradient>
                </Card.Content>
              </LinearGradient>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
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
    marginTop: 16,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyCard: {
    marginTop: 32,
    borderRadius: 16,
    ...theme.shadows.medium,
  },
  emptyContent: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scriptCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  scriptGradient: {
    flex: 1,
  },
  scriptContent: {
    padding: 20,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  scriptInfo: {
    flex: 1,
  },
  scriptTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scriptSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  scriptArrow: {
    margin: 0,
  },
  scriptDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  detailIcon: {
    margin: 0,
    marginRight: 4,
  },
  detailText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  statusContainer: {
    borderRadius: 12,
    padding: 8,
    alignSelf: 'flex-start',
  },
  statusChip: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default HistoryScreen; 