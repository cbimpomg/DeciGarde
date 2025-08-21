import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import UploadScreen from './src/screens/UploadScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryScreen from './src/screens/HistoryScreen';

// Import contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WebSocketProvider } from './src/contexts/WebSocketContext';

// Import theme
import { theme } from './src/theme/theme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // This will show the splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          // Auth screens
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
        ) : (
          // Main app screens
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'DeciGrade' }}
            />
            <Stack.Screen 
              name="Scan" 
              component={ScanScreen}
              options={{ title: 'Scan Script' }}
            />
            <Stack.Screen 
              name="Upload" 
              component={UploadScreen}
              options={{ title: 'Upload Script' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
            <Stack.Screen 
              name="History" 
              component={HistoryScreen}
              options={{ title: 'History' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <WebSocketProvider>
          <AppContent />
          <StatusBar style="light" />
          <Toast />
        </WebSocketProvider>
      </AuthProvider>
    </PaperProvider>
  );
} 