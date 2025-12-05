// ============================================================================
// CARD COMPONENT - Carte avec variantes
// ============================================================================

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'gradient';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  gradientColors?: string[];
}

export function Card({
  children,
  variant = 'default',
  style,
  onPress,
  disabled = false,
  gradientColors,
}: CardProps) {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: Colors.background.elevated,
          ...Shadows.lg,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: Colors.neutral[200],
        };
      case 'gradient':
        return {}; // Géré par LinearGradient
      default:
        return {
          backgroundColor: Colors.background.card,
          ...Shadows.sm,
        };
    }
  };

  const content = (
    <View style={[styles.container, getVariantStyles(), style]}>
      {children}
    </View>
  );

  if (variant === 'gradient') {
    const colors = gradientColors || [Colors.primary[500], Colors.primary[700]];
    
    if (onPress) {
      return (
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.container, styles.gradientContainer, Shadows.md, style]}
          >
            {children}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, styles.gradientContainer, Shadows.md, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[styles.container, getVariantStyles(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return content;
}

// ============================================================================
// STUDENT CARD - Carte d'élève avec infos paiement
// ============================================================================

import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/theme';
import { formatCurrency, calculatePaymentProgress } from '@/lib/utils';

interface StudentCardProps {
  student: {
    first_name: string;
    last_name: string;
    matricule: string;
    school: { name: string };
    class: { name: string };
    tuition: {
      total_amount: number;
      paid_amount: number;
      balance: number;
      is_fully_paid: boolean;
    } | null;
  };
  onPress?: () => void;
}

export function StudentCard({ student, onPress }: StudentCardProps) {
  const progress = student.tuition
    ? calculatePaymentProgress(student.tuition.paid_amount, student.tuition.total_amount)
    : 0;

  const isPaid = student.tuition?.is_fully_paid || false;

  return (
    <Card variant="elevated" onPress={onPress} style={styles.studentCard}>
      {/* Avatar et infos */}
      <View style={styles.studentHeader}>
        <View style={[styles.avatar, isPaid && styles.avatarPaid]}>
          <Text style={styles.avatarText}>
            {student.first_name[0]}{student.last_name[0]}
          </Text>
          {isPaid && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color={Colors.text.inverse} />
            </View>
          )}
        </View>
        
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {student.first_name} {student.last_name}
          </Text>
          <Text style={styles.studentMeta}>
            {student.class.name} • {student.school.name}
          </Text>
          <Text style={styles.matricule}>
            {student.matricule}
          </Text>
        </View>
        
        <Ionicons
          name="chevron-forward"
          size={24}
          color={Colors.neutral[400]}
        />
      </View>

      {/* Barre de progression */}
      {student.tuition && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progression paiement</Text>
            <Text style={[styles.progressPercent, isPaid && styles.progressPercentPaid]}>
              {progress}%
            </Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress}%` },
                isPaid && styles.progressBarPaid,
              ]}
            />
          </View>

          <View style={styles.amountsRow}>
            <View>
              <Text style={styles.amountLabel}>Payé</Text>
              <Text style={styles.amountValue}>
                {formatCurrency(student.tuition.paid_amount)}
              </Text>
            </View>
            <View style={styles.amountRight}>
              <Text style={styles.amountLabel}>Reste</Text>
              <Text style={[styles.amountValue, !isPaid && styles.amountRest]}>
                {formatCurrency(student.tuition.balance)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}

// ============================================================================
// PAYMENT CARD - Carte de paiement historique
// ============================================================================

import { formatDate, translatePaymentStatus, getPaymentStatusColor, translateProvider } from '@/lib/utils';

interface PaymentCardProps {
  payment: {
    reference: string;
    amount: number;
    status: string;
    provider: string;
    created_at: string;
  };
  onPress?: () => void;
}

export function PaymentCard({ payment, onPress }: PaymentCardProps) {
  const statusColor = getPaymentStatusColor(payment.status);

  return (
    <Card variant="default" onPress={onPress} style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentRef}>{payment.reference}</Text>
          <Text style={styles.paymentDate}>
            {formatDate(payment.created_at, "dd MMM yyyy 'à' HH:mm")}
          </Text>
        </View>
        <View style={styles.paymentAmountContainer}>
          <Text style={styles.paymentAmount}>
            {formatCurrency(payment.amount)}
          </Text>
          <Text style={[styles.paymentStatus, { color: statusColor }]}>
            {translatePaymentStatus(payment.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.paymentFooter}>
        <Text style={styles.providerLabel}>
          Via {translateProvider(payment.provider)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  gradientContainer: {
    overflow: 'hidden',
  },
  
  // Student Card
  studentCard: {
    marginBottom: Spacing.md,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarPaid: {
    backgroundColor: Colors.success,
  },
  avatarText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[600],
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background.card,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  studentMeta: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  matricule: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.tertiary,
  },
  progressSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  progressPercent: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.accent[600],
  },
  progressPercentPaid: {
    color: Colors.success,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accent[500],
    borderRadius: BorderRadius.full,
  },
  progressBarPaid: {
    backgroundColor: Colors.success,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  amountRight: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  amountRest: {
    color: Colors.accent[600],
  },

  // Payment Card
  paymentCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.md,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentRef: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  paymentDate: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  paymentAmountContainer: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  paymentStatus: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 2,
  },
  paymentFooter: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  providerLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },
});
