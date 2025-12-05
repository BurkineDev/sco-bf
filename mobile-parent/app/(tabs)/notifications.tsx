// ============================================================================
// NOTIFICATIONS SCREEN - Liste des notifications
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Card, EmptyState } from '@/components/ui';
import { formatRelativeDate } from '@/lib/utils';

// Données mockées
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'payment_success',
    title: 'Paiement reçu',
    message: 'Votre paiement de 25 000 FCFA pour Fatou a été confirmé.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min
    read: false,
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Rappel de paiement',
    message: 'Il reste 50 000 FCFA à payer pour la scolarité de Mamadou.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 jour
    read: true,
  },
  {
    id: '3',
    type: 'info',
    title: 'Nouvelle année scolaire',
    message: 'Les inscriptions pour 2025-2026 sont ouvertes.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 jours
    read: true,
  },
];

const NOTIFICATION_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  payment_success: { icon: 'checkmark-circle', color: Colors.success },
  payment_failed: { icon: 'close-circle', color: Colors.error },
  reminder: { icon: 'alarm', color: Colors.warning },
  info: { icon: 'information-circle', color: Colors.info },
};

interface NotificationItemProps {
  notification: typeof MOCK_NOTIFICATIONS[0];
  onPress: () => void;
}

function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.info;

  return (
    <TouchableOpacity onPress={onPress}>
      <Card
        variant={notification.read ? 'default' : 'elevated'}
        style={[styles.notificationCard, !notification.read && styles.notificationUnread]}
      >
        <View style={styles.notificationRow}>
          <View style={[styles.notificationIcon, { backgroundColor: config.color + '15' }]}>
            <Ionicons name={config.icon} size={24} color={config.color} />
          </View>
          
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatRelativeDate(notification.timestamp)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary[500], Colors.primary[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Liste */}
      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="Aucune notification"
            description="Vous n'avez pas encore de notifications"
          />
        }
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => console.log('Notification pressed:', item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing['2xl'],
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  headerContent: {
    paddingHorizontal: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
  },
  unreadBadge: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  unreadBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.inverse,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  notificationCard: {
    marginBottom: Spacing.sm,
  },
  notificationUnread: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[500],
  },
  notificationRow: {
    flexDirection: 'row',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  notificationTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary[500],
    marginLeft: Spacing.sm,
  },
  notificationMessage: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },
});
