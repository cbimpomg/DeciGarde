import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  HelperText,
  ActivityIndicator,
  useTheme,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme, colors } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [subjects, setSubjects] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    firstName?: string; 
    lastName?: string; 
    subjects?: string;
    department?: string;
  }>({});

  const { login, signup } = useAuth();
  const navigation = useNavigation();
  const paperTheme = useTheme();

  const validateForm = () => {
    const newErrors: { 
      email?: string; 
      password?: string; 
      firstName?: string; 
      lastName?: string; 
      subjects?: string;
      department?: string;
    } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!firstName) {
        newErrors.firstName = 'First name is required';
      }
      if (!lastName) {
        newErrors.lastName = 'Last name is required';
      }
      if (!subjects) {
        newErrors.subjects = 'Subjects are required';
      }
      if (!department) {
        newErrors.department = 'Department is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        // Navigation will be handled by the auth context or app navigation
      } else {
        // Implement signup functionality
        await signup({
          email,
          password,
          firstName,
          lastName,
          role: 'teacher', // Default role for new users
          subjects: subjects ? subjects.split(',').map(s => s.trim()) : [],
          department: department || undefined,
        });
        // Navigate to main screen after successful signup
        Alert.alert(
          'Account Created!',
          'Welcome to DeciGrade! Your account has been created successfully.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // The auth context will handle navigation automatically
                // since the user is now authenticated
              }
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        isLogin ? 'Login Failed' : 'Signup Failed',
        error.message || 'Please check your credentials and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setSubjects('');
    setDepartment('');
    setErrors({});
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary.main, colors.primary.light]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoBackground}>
                    <Text style={styles.logo}>📝</Text>
                  </View>
                </View>
                <Title style={styles.title}>DeciGrade</Title>
                <Paragraph style={styles.subtitle}>
                  Intelligent Script Marking Platform
                </Paragraph>
              </View>

              {/* Login/Signup Form */}
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <Title style={styles.formTitle}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </Title>
                  <Paragraph style={styles.formSubtitle}>
                    {isLogin ? 'Sign in to your teacher account' : 'Join DeciGrade today'}
                  </Paragraph>

                  {!isLogin && (
                    <>
                      <View style={styles.nameRow}>
                        <TextInput
                          label="First Name"
                          value={firstName}
                          onChangeText={setFirstName}
                          mode="outlined"
                          disabled={loading}
                          style={[styles.input, styles.halfInput]}
                          error={!!errors.firstName}
                          left={<TextInput.Icon icon="account" color={colors.primary.main} />}
                          theme={{
                            colors: {
                              primary: colors.primary.main,
                              error: colors.error.main,
                            },
                          }}
                        />
                        <TextInput
                          label="Last Name"
                          value={lastName}
                          onChangeText={setLastName}
                          mode="outlined"
                          disabled={loading}
                          style={[styles.input, styles.halfInput]}
                          error={!!errors.lastName}
                          left={<TextInput.Icon icon="account" color={colors.primary.main} />}
                          theme={{
                            colors: {
                              primary: colors.primary.main,
                              error: colors.error.main,
                            },
                          }}
                        />
                      </View>
                      {errors.firstName && (
                        <HelperText type="error" visible={!!errors.firstName}>
                          {errors.firstName}
                        </HelperText>
                      )}
                      {errors.lastName && (
                        <HelperText type="error" visible={!!errors.lastName}>
                          {errors.lastName}
                        </HelperText>
                      )}

                      <TextInput
                        label="Subjects (comma-separated)"
                        value={subjects}
                        onChangeText={setSubjects}
                        mode="outlined"
                        disabled={loading}
                        style={styles.input}
                        error={!!errors.subjects}
                        placeholder="e.g., mathematics, physics, chemistry"
                        left={<TextInput.Icon icon="school" color={colors.primary.main} />}
                        theme={{
                          colors: {
                            primary: colors.primary.main,
                            error: colors.error.main,
                          },
                        }}
                      />
                      {errors.subjects && (
                        <HelperText type="error" visible={!!errors.subjects}>
                          {errors.subjects}
                        </HelperText>
                      )}

                      <TextInput
                        label="Department"
                        value={department}
                        onChangeText={setDepartment}
                        mode="outlined"
                        disabled={loading}
                        style={styles.input}
                        error={!!errors.department}
                        placeholder="e.g., Science, Humanities, Mathematics"
                        left={<TextInput.Icon icon="office-building" color={colors.primary.main} />}
                        theme={{
                          colors: {
                            primary: colors.primary.main,
                            error: colors.error.main,
                          },
                        }}
                      />
                      {errors.department && (
                        <HelperText type="error" visible={!!errors.department}>
                          {errors.department}
                        </HelperText>
                      )}
                    </>
                  )}

                  <TextInput
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    disabled={loading}
                    style={styles.input}
                    error={!!errors.email}
                    left={<TextInput.Icon icon="email" color={colors.primary.main} />}
                    theme={{
                      colors: {
                        primary: colors.primary.main,
                        error: colors.error.main,
                      },
                    }}
                  />
                  {errors.email && (
                    <HelperText type="error" visible={!!errors.email}>
                      {errors.email}
                    </HelperText>
                  )}

                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    disabled={loading}
                    style={styles.input}
                    error={!!errors.password}
                    left={<TextInput.Icon icon="lock" color={colors.primary.main} />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                        color={colors.grey[600]}
                      />
                    }
                    theme={{
                      colors: {
                        primary: colors.primary.main,
                        error: colors.error.main,
                      },
                    }}
                  />
                  {errors.password && (
                    <HelperText type="error" visible={!!errors.password}>
                      {errors.password}
                    </HelperText>
                  )}

                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    disabled={loading}
                    style={styles.submitButton}
                    contentStyle={styles.submitButtonContent}
                    labelStyle={styles.submitButtonLabel}
                    theme={{
                      colors: {
                        primary: colors.primary.main,
                      },
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </Button>

                  {/* Toggle Mode */}
                  <View style={styles.toggleContainer}>
                    <Divider style={styles.divider} />
                    <Button
                      mode="text"
                      onPress={toggleMode}
                      style={styles.toggleButton}
                      labelStyle={styles.toggleButtonLabel}
                    >
                      {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </Button>
                  </View>
                </Card.Content>
              </Card>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © 2024 DeciGrade. All rights reserved.
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: height,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.large,
  },
  logo: {
    fontSize: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  card: {
    ...theme.shadows.large,
    borderRadius: 20,
    backgroundColor: 'white',
  },
  cardContent: {
    padding: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: colors.background.paper,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 12,
    ...theme.shadows.medium,
    backgroundColor: colors.primary.main,
  },
  submitButtonContent: {
    paddingVertical: 12,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    marginVertical: 16,
  },
  divider: {
    marginVertical: 16,
  },
  toggleButton: {
    marginVertical: 8,
  },
  toggleButtonLabel: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});

export default LoginScreen; 