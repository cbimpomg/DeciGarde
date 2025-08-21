import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, Title, Paragraph, Chip, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { theme, colors } from '../theme/theme';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
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
            <View style={styles.avatarContainer}>
              <Avatar.Text 
                size={100} 
                label={`${user?.firstName?.[0]}${user?.lastName?.[0]}`}
                style={styles.avatar}
                color="white"
                labelStyle={styles.avatarLabel}
              />
            </View>
            <Title style={styles.userName}>{user?.firstName} {user?.lastName}</Title>
            <Paragraph style={styles.userEmail}>{user?.email}</Paragraph>
            <Chip 
              style={styles.roleChip}
              textStyle={styles.roleChipText}
              mode="outlined"
            >
              {user?.role === 'admin' ? 'Administrator' : 'Teacher'}
            </Chip>
          </View>
        </LinearGradient>

        {/* Profile Information */}
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <Title style={styles.infoTitle}>Account Information</Title>
            
            <View style={styles.infoItem}>
              <IconButton
                icon="school"
                iconColor={colors.primary.main}
                size={24}
                style={styles.infoIcon}
              />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue}>
                  {user?.department || 'Not specified'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <IconButton
                icon="book-open-variant"
                iconColor={colors.secondary.main}
                size={24}
                style={styles.infoIcon}
              />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Subjects</Text>
                <Text style={styles.infoValue}>
                  {user?.subjects?.join(', ') || 'None assigned'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <IconButton
                icon="calendar"
                iconColor={colors.success.main}
                size={24}
                style={styles.infoIcon}
              />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Stats */}
        <Card style={styles.statsCard}>
          <Card.Content style={styles.statsContent}>
            <Title style={styles.statsTitle}>Quick Stats</Title>
            
            <View style={styles.statsGrid}>
              <LinearGradient
                colors={colors.gradient.primary}
                style={styles.statItem}
              >
                <IconButton
                  icon="file-document"
                  iconColor="white"
                  size={24}
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>24</Text>
                <Text style={styles.statLabel}>Scripts</Text>
              </LinearGradient>

              <LinearGradient
                colors={colors.gradient.success}
                style={styles.statItem}
              >
                <IconButton
                  icon="check-circle"
                  iconColor="white"
                  size={24}
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>18</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </LinearGradient>

              <LinearGradient
                colors={colors.gradient.warning}
                style={styles.statItem}
              >
                <IconButton
                  icon="clock"
                  iconColor="white"
                  size={24}
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>6</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </LinearGradient>

              <LinearGradient
                colors={colors.gradient.secondary}
                style={styles.statItem}
              >
                <IconButton
                  icon="star"
                  iconColor="white"
                  size={24}
                  style={styles.statIcon}
                />
                <Text style={styles.statValue}>4.8</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </LinearGradient>
            </View>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content style={styles.settingsContent}>
            <Title style={styles.settingsTitle}>Settings</Title>
            
            <View style={styles.settingItem}>
              <IconButton
                icon="account-edit"
                iconColor={colors.primary.main}
                size={24}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Edit Profile</Text>
              <IconButton
                icon="chevron-right"
                iconColor={colors.grey[500]}
                size={20}
                style={styles.settingArrow}
              />
            </View>

            <View style={styles.settingItem}>
              <IconButton
                icon="bell"
                iconColor={colors.warning.main}
                size={24}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Notifications</Text>
              <IconButton
                icon="chevron-right"
                iconColor={colors.grey[500]}
                size={20}
                style={styles.settingArrow}
              />
            </View>

            <View style={styles.settingItem}>
              <IconButton
                icon="shield"
                iconColor={colors.info.main}
                size={24}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Privacy & Security</Text>
              <IconButton
                icon="chevron-right"
                iconColor={colors.grey[500]}
                size={20}
                style={styles.settingArrow}
              />
            </View>

            <View style={styles.settingItem}>
              <IconButton
                icon="help-circle"
                iconColor={colors.secondary.main}
                size={24}
                style={styles.settingIcon}
              />
              <Text style={styles.settingText}>Help & Support</Text>
              <IconButton
                icon="chevron-right"
                iconColor={colors.grey[500]}
                size={20}
                style={styles.settingArrow}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <LinearGradient
          colors={[colors.error.main, colors.error.light]}
          style={styles.logoutButtonGradient}
        >
          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            contentStyle={styles.logoutButtonContent}
            labelStyle={styles.logoutButtonLabel}
            icon="logout"
            textColor="white"
            theme={{
              colors: {
                primary: colors.error.main,
              },
            }}
          >
            Sign Out
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
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
    ...theme.shadows.large,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarLabel: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  roleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleChipText: {
    color: 'white',
    fontWeight: '500',
  },
  infoCard: {
    margin: 16,
    marginTop: -20,
    borderRadius: 16,
    ...theme.shadows.large,
  },
  infoContent: {
    padding: 24,
  },
  infoTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    margin: 0,
    marginRight: 16,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  statsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    ...theme.shadows.medium,
  },
  statsContent: {
    padding: 24,
  },
  statsTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    ...theme.shadows.small,
  },
  statIcon: {
    margin: 0,
    marginBottom: 8,
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    ...theme.shadows.medium,
  },
  settingsContent: {
    padding: 24,
  },
  settingsTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[200],
  },
  settingIcon: {
    margin: 0,
    marginRight: 16,
  },
  settingText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  settingArrow: {
    margin: 0,
  },
  logoutButtonGradient: {
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    ...theme.shadows.large,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
  },
  logoutButtonContent: {
    paddingVertical: 12,
  },
  logoutButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 