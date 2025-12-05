// ============================================================================
// HOME SCREEN - Accueil avec liste des enfants
// ============================================================================

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { StudentCard, EmptyState, LoadingScreen } from '@/components/ui';
import { useAuthStore, useStudentsStore } from '@/store';
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { students, isLoading, error, fetchStudents } = useStudentsStore();

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleStudentPress = (studentId: string) => {
    router.push({
      pathname: '/payment/[studentId]',
      params: { studentId },
    });
  };

  // Calculer les stats globales
  const stats = useMemo(() => {
    const totalDue = students.reduce((sum, s) => sum + (s.tuition?.total_amount || 0), 0);
    const totalPaid = students.reduce((sum, s) => sum + (s.tuition?.paid_amount || 0), 0);
    const totalBalance = students.reduce((sum, s) => sum + (s.tuition?.balance || 0), 0);
    const fullyPaidCount = students.filter(s => s.tuition?.is_fully_paid).length;
    
    return { totalDue, totalPaid, totalBalance, fullyPaidCount };
  }, [students]);

  // Salutation dynamique
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (isLoading && students.length === 0) {
    return <LoadingScreen message="Chargement..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
      >
        {/* Header avec gradient */}
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Motifs décoratifs */}
          <View style={styles.headerPattern}>
            <View style={[styles.patternCircle, styles.patternCircle1]} />
            <View style={[styles.patternCircle, styles.patternCircle2]} />
          </View>

          {/* Contenu header */}
          <View style={styles.headerContent}>
            <View style={styles.greetingRow}>
              <View>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.userName}>
                  {user?.first_name || 'Parent'} 👋
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => router.push('/(tabs)/notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color={Colors.text.inverse} />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
            </View>

            {/* Stats résumé */}
            {students.length > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total à payer</Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrencyCompact(stats.totalBalance)}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Déjà payé</Text>
                    <Text style={[styles.summaryValue, styles.summaryValuePaid]}>
                      {formatCurrencyCompact(stats.totalPaid)}
                    </Text>
                  </View>
                </View>
                
                {/* Barre de progression globale */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${stats.totalDue > 0 ? (stats.totalPaid / stats.totalDue) * 100 : 0}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {stats.fullyPaidCount}/{students.length} élève{students.length > 1 ? 's' : ''} soldé{stats.fullyPaidCount > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Contenu principal */}
        <View style={styles.mainContent}>
          {/* Section Enfants */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes enfants</Text>
            <Text style={styles.sectionCount}>
              {students.length} élève{students.length > 1 ? 's' : ''}
            </Text>
          </View>

          {students.length === 0 ? (
            <EmptyState
              icon="school-outline"
              title="Aucun élève"
              description="Vos enfants apparaîtront ici une fois qu'ils seront inscrits par leur école."
            />
          ) : (
            students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onPress={() => handleStudentPress(student.id)}
              />
            ))
          )}

          {/* Actions rapides */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: Colors.primary[50] }]}>
                  <Ionicons name="receipt-outline" size={24} color={Colors.primary[500]} />
                </View>
                <Text style={styles.actionLabel}>Historique</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: Colors.accent[50] }]}>
                  <Ionicons name="help-circle-outline" size={24} color={Colors.accent[600]} />
                </View>
                <Text style={styles.actionLabel}>Aide</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: Colors.success + '15' }]}>
                  <Ionicons name="call-outline" size={24} color={Colors.success} />
                </View>
                <Text style={styles.actionLabel}>Contacter</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: Colors.info + '15' }]}>
                  <Ionicons name="document-text-outline" size={24} color={Colors.info} />
                </View>
                <Text style={styles.actionLabel}>Reçus</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info USSD */}
          <View style={styles.ussdBanner}>
            <View style={styles.ussdIconContainer}>
              <Ionicons name="keypad" size={20} color={Colors.accent[600]} />
            </View>
            <View style={styles.ussdTextContainer}>
              <Text style={styles.ussdTitle}>Pas d'Internet ?</Text>
              <Text style={styles.ussdText}>
                Composez *123*CODE*MATRICULE*MONTANT# pour payer
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.neutral[400]} />
          </View>
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
    paddingBottom: 100, // Pour le tab bar
  },

  // Header
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing['3xl'],
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
    overflow: 'hidden',
  },
  headerPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  patternCircle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  patternCircle2: {
    width: 150,
    height: 150,
    bottom: -30,
    left: -30,
  },
  headerContent: {
    paddingHorizontal: Spacing.xl,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent[500],
    borderWidth: 2,
    borderColor: Colors.primary[500],
  },

  // Summary card
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    backdropFilter: 'blur(10px)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: Spacing.lg,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
  },
  summaryValuePaid: {
    color: Colors.accent[300],
  },
  progressContainer: {
    marginTop: Spacing.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent[400],
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  // Main content
  mainContent: {
    padding: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  sectionCount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },

  // Quick actions
  quickActions: {
    marginTop: Spacing['2xl'],
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.xs,
  },
  actionCard: {
    width: '25%',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  // USSD banner
  ussdBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent[50],
    borderWidth: 1,
    borderColor: Colors.accent[200],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing['2xl'],
  },
  ussdIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  ussdTextContainer: {
    flex: 1,
  },
  ussdTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  ussdText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
});
