// ============================================================================
// PAYMENTS SCREEN - Historique des paiements
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Platform,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { PaymentCard, EmptyState, LoadingScreen } from '@/components/ui';
import { useStudentsStore, usePaymentsStore } from '@/store';
import { formatCurrency, formatDate } from '@/lib/utils';

type TimeFilter = 'all' | 'month' | 'year';

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'month', label: 'Ce mois' },
  { id: 'year', label: 'Cette année' },
];

export default function PaymentsScreen() {
  const { students } = useStudentsStore();
  const { payments, fetchPayments, isLoading } = usePaymentsStore();
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  useEffect(() => {
    students.forEach(student => {
      fetchPayments(student.id);
    });
  }, [students]);

  const allPayments = Object.values(payments).flat();

  const filteredPayments = allPayments.filter(payment => {
    const paymentDate = new Date(payment.created_at);
    const now = new Date();

    if (timeFilter === 'month') {
      if (paymentDate.getMonth() !== now.getMonth() || 
          paymentDate.getFullYear() !== now.getFullYear()) {
        return false;
      }
    } else if (timeFilter === 'year') {
      if (paymentDate.getFullYear() !== now.getFullYear()) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalPaid = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const transactionCount = filteredPayments.filter(p => p.status === 'completed').length;

  const handleRefresh = useCallback(() => {
    students.forEach(student => {
      fetchPayments(student.id);
    });
  }, [students, fetchPayments]);

  if (isLoading && allPayments.length === 0) {
    return <LoadingScreen message="Chargement..." />;
  }

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
          <Text style={styles.headerTitle}>Mes paiements</Text>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(totalPaid)}</Text>
              <Text style={styles.statLabel}>Total payé</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{transactionCount}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        {TIME_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              timeFilter === filter.id && styles.filterChipActive,
            ]}
            onPress={() => setTimeFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                timeFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des paiements */}
      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Aucun paiement"
            description="Vos paiements apparaîtront ici"
          />
        }
        renderItem={({ item }) => (
          <PaymentCard payment={item} />
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
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: Spacing.lg,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing.xs,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: Colors.text.inverse,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
});
