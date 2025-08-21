import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Title,
  Paragraph,
  useTheme,
  FAB,
  Avatar,
  Chip,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { scriptsAPI } from '../services/api';
import Toast from 'react-native-toast-message';
import { theme, colors } from '../theme/theme';

const { width } = Dimensions.get('window');

interface Stats {
  totalScripts: number;
  pendingScripts: number;
  completedScripts: number;
  averageScore: number;
}

const HomeScreen: React.FC = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const paperTheme = useTheme();
  const [stats, setStats] = useState<Stats>({
    totalScripts: 0,
    pendingScripts: 0,
    completedScripts: 0,
    averageScore: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await scriptsAPI.getStats();
      console.log('📊 Stats loaded:', response.data);
      console.log('📊 Pending Scripts:', response.data.pendingScripts);
      console.log('📊 Completed Scripts:', response.data.completedScripts);
      console.log('📊 Total Scripts:', response.data.totalScripts);
      setStats(response.data);
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      // Set default values if stats fail to load
      setStats({
        totalScripts: 0,
        pendingScripts: 0,
        completedScripts: 0,
        averageScore: 0,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Logout failed',
      });
    }
  };

  const StatCard = ({ title, value, icon, color, gradient }: any) => {
    console.log(`📊 StatCard - ${title}: ${value} (type: ${typeof value})`);
    return (
      <View style={styles.statCard}>
        <LinearGradient
          colors={gradient || [color, color]}
          style={styles.statGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statContent}>
            <View style={styles.statIconContainer}>
              <Text style={styles.statIcon}>{icon}</Text>
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const QuickActionCard = ({ title, subtitle, icon, onPress, color, gradient }: any) => (
    <Card style={styles.actionCard} onPress={onPress}>
      <LinearGradient
        colors={gradient || [color, color]}
        style={styles.actionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Card.Content style={styles.actionContent}>
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>{icon}</Text>
          </View>
          <View style={styles.actionText}>
            <Title style={styles.actionTitle}>{title}</Title>
            <Paragraph style={styles.actionSubtitle}>{subtitle}</Paragraph>
          </View>
          <IconButton
            icon="chevron-right"
            iconColor="white"
            size={20}
            style={styles.actionArrow}
          />
        </Card.Content>
      </LinearGradient>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primary.main, colors.primary.light]}
          style={styles.headerGradient}
        >
          <Card style={styles.headerCard}>
            <Card.Content style={styles.headerContent}>
              <View style={styles.userInfo}>
                <Avatar.Text 
                  size={60} 
                  label={`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
                  style={styles.avatar}
                  color="white"
                  labelStyle={styles.avatarLabel}
                />
                <View style={styles.userDetails}>
                  <Title style={styles.welcomeText}>
                    Welcome back, {user?.firstName}!
                  </Title>
                  <Paragraph style={styles.roleText}>
                    {user?.role === 'admin' ? 'Administrator' : 'Teacher'}
                  </Paragraph>
                  {user?.subjects && user.subjects.length > 0 && (
                    <View style={styles.subjectsContainer}>
                      {user.subjects.slice(0, 2).map((subject, index) => (
                        <Chip 
                          key={index} 
                          style={styles.subjectChip} 
                          textStyle={styles.chipText}
                          mode="outlined"
                        >
                          {subject}
                        </Chip>
                      ))}
                      {user.subjects.length > 2 && (
                        <Chip 
                          style={styles.subjectChip} 
                          textStyle={styles.chipText}
                          mode="outlined"
                        >
                          +{user.subjects.length - 2} more
                        </Chip>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Scripts"
            value={stats.totalScripts}
            icon="📊"
            color={colors.primary.main}
            gradient={colors.gradient.primary}
          />
          
          <StatCard
            title="Pending Review"
            value={stats.pendingScripts}
            icon="⏳"
            color={colors.warning.main}
            gradient={colors.gradient.warning}
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            title="Completed"
            value={stats.completedScripts}
            icon="✅"
            color={colors.success.main}
            gradient={colors.gradient.success}
          />
          
          <StatCard
            title="Avg Score"
            value={`${stats.averageScore}%`}
            icon="📈"
            color={colors.info.main}
            gradient={colors.gradient.primary}
          />
        </View>

        {/* Quick Actions */}
        <Title style={styles.sectionTitle}>Quick Actions</Title>
        
        <QuickActionCard
          title="Scan Script"
          subtitle="Use camera to scan student scripts"
          icon="📷"
          color={colors.primary.main}
          gradient={colors.gradient.primary}
          onPress={() => navigation.navigate('Scan')}
        />

        <QuickActionCard
          title="Upload Script"
          subtitle="Select images from gallery"
          icon="📁"
          color={colors.success.main}
          gradient={colors.gradient.success}
          onPress={() => navigation.navigate('Upload')}
        />

        <QuickActionCard
          title="View History"
          subtitle="Check previous submissions"
          icon="📋"
          color={colors.warning.main}
          gradient={colors.gradient.warning}
          onPress={() => navigation.navigate('History')}
        />

        <QuickActionCard
          title="Profile"
          subtitle="Manage your account settings"
          icon="👤"
          color={colors.secondary.main}
          gradient={colors.gradient.secondary}
          onPress={() => navigation.navigate('Profile')}
        />

        {/* Logout Button */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
          textColor={colors.error.main}
          buttonColor="transparent"
        >
          Sign Out
        </Button>
      </ScrollView>

      {/* FAB for quick scan */}
      <FAB
        icon="camera"
        style={styles.fab}
        onPress={() => navigation.navigate('Scan')}
        label="Scan"
        color="white"
        theme={{
          colors: {
            primaryContainer: colors.primary.main,
          },
        }}
      />
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
    margin: 16,
    borderRadius: 16,
    ...theme.shadows.large,
  },
  headerCard: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
  headerContent: {
    padding: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    marginBottom: 4,
    color: 'white',
    fontWeight: 'bold',
  },
  roleText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    fontSize: 14,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subjectChip: {
    marginRight: 8,
    marginBottom: 4,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chipText: {
    fontSize: 11,
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    // Removed shadow to prevent white background appearance
  },
  statGradient: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 120,
  },
  statContent: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statTitle: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  actionCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  actionGradient: {
    flex: 1,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: 'white',
    fontWeight: 'bold',
  },
  actionSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  actionArrow: {
    margin: 0,
  },
  logoutButton: {
    margin: 16,
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 12,
    borderColor: colors.error.main,
    borderWidth: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    ...theme.shadows.large,
  },
});

export default HomeScreen; 