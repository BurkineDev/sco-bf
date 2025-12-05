// ============================================================================
// UI COMPONENTS - Export centralisé
// ============================================================================

export { Button } from './Button';
export { Input, PhoneInput, OtpInput, AmountInput } from './Input';
export { Card, StudentCard, PaymentCard } from './Card';

// ============================================================================
// ADDITIONAL COMPONENTS
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl as RNRefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

// ============================================================================
// LOADING SCREEN
// ============================================================================

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Chargement...' }: LoadingScreenProps) {
  return (
    <View style={loadingStyles.container}>
      <ActivityIndicator size="large" color={Colors.primary[500]} />
      <Text style={loadingStyles.message}>{message}</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  message: {
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
});

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.iconContainer}>
        <Ionicons name={icon} size={48} color={Colors.neutral[400]} />
      </View>
      <Text style={emptyStyles.title}>{title}</Text>
      {description && (
        <Text style={emptyStyles.description}>{description}</Text>
      )}
      {action && (
        <Button
          title={action.label}
          onPress={action.onPress}
          variant="outline"
          size="sm"
          style={emptyStyles.button}
        />
      )}
    </View>
  );
}

import { Button } from './Button';

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  button: {
    marginTop: Spacing.xl,
  },
});

// ============================================================================
// ERROR BANNER
// ============================================================================

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <View style={errorStyles.container}>
      <Ionicons name="alert-circle" size={20} color={Colors.error} />
      <Text style={errorStyles.message}>{message}</Text>
      {onRetry && (
        <Button
          title="Réessayer"
          onPress={onRetry}
          variant="ghost"
          size="sm"
        />
      )}
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  message: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
  },
});

// ============================================================================
// HEADER GRADIENT
// ============================================================================

interface HeaderGradientProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function HeaderGradient({
  title,
  subtitle,
  showBack,
  onBack,
  rightAction,
}: HeaderGradientProps) {
  return (
    <LinearGradient
      colors={[Colors.primary[500], Colors.primary[700]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={headerStyles.container}
    >
      <View style={headerStyles.content}>
        {showBack && (
          <Button
            title=""
            onPress={onBack!}
            variant="ghost"
            icon={<Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />}
            style={headerStyles.backButton}
          />
        )}
        
        <View style={headerStyles.titleContainer}>
          <Text style={headerStyles.title}>{title}</Text>
          {subtitle && <Text style={headerStyles.subtitle}>{subtitle}</Text>}
        </View>
        
        {rightAction && <View style={headerStyles.rightAction}>{rightAction}</View>}
      </View>
    </LinearGradient>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
  },
  rightAction: {
    marginLeft: Spacing.md,
  },
});

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
  return (
    <View style={statStyles.container}>
      <View style={statStyles.iconContainer}>
        <Ionicons name={icon} size={24} color={Colors.primary[500]} />
      </View>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.value}>{value}</Text>
      {trend && (
        <View style={statStyles.trendContainer}>
          <Ionicons
            name={trend.isPositive ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend.isPositive ? Colors.success : Colors.error}
          />
          <Text
            style={[
              statStyles.trendValue,
              { color: trend.isPositive ? Colors.success : Colors.error },
            ]}
          >
            {trend.value}%
          </Text>
        </View>
      )}
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  trendValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: Spacing.xs,
  },
});

// ============================================================================
// DIVIDER
// ============================================================================

interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  if (!label) {
    return <View style={dividerStyles.line} />;
  }

  return (
    <View style={dividerStyles.container}>
      <View style={dividerStyles.line} />
      <Text style={dividerStyles.label}>{label}</Text>
      <View style={dividerStyles.line} />
    </View>
  );
}

const dividerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[200],
  },
  label: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },
});

// ============================================================================
// PROVIDER BUTTON
// ============================================================================

interface ProviderButtonProps {
  provider: 'orange_money' | 'moov_money' | 'cinetpay';
  selected?: boolean;
  onPress: () => void;
}

const providerConfig = {
  orange_money: {
    label: 'Orange Money',
    color: '#FF6600',
    icon: '📱',
  },
  moov_money: {
    label: 'Moov Money',
    color: '#00A0E9',
    icon: '📱',
  },
  cinetpay: {
    label: 'CinetPay',
    color: '#0066CC',
    icon: '💳',
  },
};

export function ProviderButton({ provider, selected, onPress }: ProviderButtonProps) {
  const config = providerConfig[provider];
  
  return (
    <Button
      title={config.label}
      onPress={onPress}
      variant={selected ? 'primary' : 'outline'}
      icon={<Text style={{ fontSize: 18 }}>{config.icon}</Text>}
      style={[
        providerStyles.button,
        selected && { backgroundColor: config.color, borderColor: config.color },
      ]}
    />
  );
}

const providerStyles = StyleSheet.create({
  button: {
    marginBottom: Spacing.sm,
  },
});
