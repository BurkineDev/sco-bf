// ============================================================================
// PROFILE SCREEN - Profil et paramètres
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Button, Card } from '@/components/ui';
import { useAuthStore, useStudentsStore } from '@/store';
import { formatPhone, getInitials } from '@/lib/utils';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
}

function MenuItem({ icon, label, value, onPress, danger, showChevron = true }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.menuIconContainer, danger && styles.menuIconDanger]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? Colors.error : Colors.primary[500]}
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
          {label}
        </Text>
        {value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { students } = useStudentsStore();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('À venir', 'Cette fonctionnalité sera bientôt disponible.');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec profil */}
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user?.first_name || 'U', user?.last_name || 'N')}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={Colors.text.inverse} />
            </TouchableOpacity>
          </View>

          {/* Nom et téléphone */}
          <Text style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Text>
          <Text style={styles.userPhone}>
            {formatPhone(user?.phone || '')}
          </Text>

          {/* Badge compte vérifié */}
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
            <Text style={styles.verifiedText}>Compte vérifié</Text>
          </View>
        </LinearGradient>

        {/* Stats rapides */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{students.length}</Text>
            <Text style={styles.statLabel}>Enfant{students.length > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {students.filter(s => s.tuition?.is_fully_paid).length}
            </Text>
            <Text style={styles.statLabel}>Soldé{students.filter(s => s.tuition?.is_fully_paid).length > 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Paiements</Text>
          </View>
        </View>

        {/* Section Mon compte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon compte</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              label="Modifier le profil"
              onPress={handleEditProfile}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="call-outline"
              label="Téléphone"
              value={formatPhone(user?.phone || '')}
              showChevron={false}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="mail-outline"
              label="Email"
              value={user?.email || 'Non renseigné'}
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Section Paramètres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="language-outline"
              label="Langue"
              value="Français"
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="lock-closed-outline"
              label="Sécurité"
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Section Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              label="Aide et FAQ"
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="chatbubble-outline"
              label="Nous contacter"
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="document-text-outline"
              label="Conditions d'utilisation"
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="shield-outline"
              label="Politique de confidentialité"
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Déconnexion */}
        <View style={styles.section}>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              label="Déconnexion"
              onPress={handleLogout}
              danger
              showChevron={false}
            />
          </Card>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Scolarité BF v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 Tous droits réservés</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing['3xl'],
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary[600],
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  userPhone: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.inverse,
    marginLeft: Spacing.xs,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing['2xl'],
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  statNumber: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[500],
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },

  // Sections
  section: {
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },

  // Menu items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuIconDanger: {
    backgroundColor: Colors.error + '15',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  menuLabelDanger: {
    color: Colors.error,
  },
  menuValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginLeft: 68,
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  versionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.tertiary,
  },
  copyrightText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
});
