// ============================================================================
// PAYMENT SCREEN - Paiement pour un élève
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Button, AmountInput, Card, ErrorBanner } from '@/components/ui';
import { useStudentsStore, usePaymentsStore } from '@/store';
import { 
  formatCurrency, 
  calculatePaymentProgress, 
  getSuggestedAmounts,
  isValidAmount 
} from '@/lib/utils';

type Provider = 'orange_money' | 'moov_money';

const PROVIDERS: { id: Provider; name: string; color: string; icon: string }[] = [
  { id: 'orange_money', name: 'Orange Money', color: '#FF6600', icon: '🟠' },
  { id: 'moov_money', name: 'Moov Money', color: '#00A0E9', icon: '🔵' },
];

export default function PaymentScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const { students } = useStudentsStore();
  const { createPaymentIntent, isLoading } = usePaymentsStore();

  const student = students.find(s => s.id === studentId);

  const [amount, setAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseInt(amount, 10) || 0;
  const balance = student?.tuition?.balance || 0;
  const suggestedAmounts = useMemo(() => getSuggestedAmounts(balance), [balance]);

  const canPay = useMemo(() => {
    return (
      amountNum >= 1000 &&
      amountNum <= balance &&
      selectedProvider !== null
    );
  }, [amountNum, balance, selectedProvider]);

  const handleSelectSuggestion = (value: number) => {
    setAmount(String(value));
    setError(null);
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError(null);
  };

  const handleSelectProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setError(null);
  };

  const handlePay = useCallback(async () => {
    if (!canPay || !student || !selectedProvider) return;

    setError(null);

    try {
      const result = await createPaymentIntent({
        studentId: student.id,
        amount: amountNum,
        provider: selectedProvider,
      });

      if (result.success && result.intent?.payment_url) {
        // Ouvrir l'URL de paiement
        const canOpen = await Linking.canOpenURL(result.intent.payment_url);
        
        if (canOpen) {
          await Linking.openURL(result.intent.payment_url);
          
          // Naviguer vers l'écran de statut
          router.push({
            pathname: '/payment/status/[intentId]',
            params: { intentId: result.intent.id },
          });
        } else {
          setError('Impossible d\'ouvrir la page de paiement');
        }
      } else {
        setError(result.error || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (e) {
      setError('Erreur de connexion. Réessayez.');
    }
  }, [canPay, student, selectedProvider, amountNum, createPaymentIntent]);

  const handleClose = () => {
    if (amount || selectedProvider) {
      Alert.alert(
        'Annuler le paiement ?',
        'Vous n\'avez pas terminé votre paiement.',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Élève non trouvé</Text>
          <Button title="Retour" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const progress = calculatePaymentProgress(
    student.tuition?.paid_amount || 0,
    student.tuition?.total_amount || 0
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info élève */}
          <Card variant="gradient" gradientColors={[Colors.primary[500], Colors.primary[700]]}>
            <View style={styles.studentInfo}>
              <View style={styles.studentAvatar}>
                <Text style={styles.studentInitials}>
                  {student.first_name[0]}{student.last_name[0]}
                </Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName}>
                  {student.first_name} {student.last_name}
                </Text>
                <Text style={styles.studentMeta}>
                  {student.class.name} • {student.school.name}
                </Text>
              </View>
            </View>

            {/* Solde */}
            <View style={styles.balanceSection}>
              <View style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceLabel}>Reste à payer</Text>
                  <Text style={styles.balanceAmount}>
                    {formatCurrency(balance)}
                  </Text>
                </View>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
            </View>
          </Card>

          {/* Montant */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Montant à payer</Text>

            {error && (
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
            )}

            <AmountInput
              value={amount}
              onChangeText={handleAmountChange}
              maxAmount={balance}
              label=""
              error={
                amountNum > 0 && amountNum < 1000
                  ? 'Minimum 1 000 FCFA'
                  : amountNum > balance
                  ? `Maximum ${formatCurrency(balance)}`
                  : undefined
              }
            />

            {/* Suggestions */}
            <View style={styles.suggestions}>
              {suggestedAmounts.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.suggestionChip,
                    amountNum === value && styles.suggestionChipActive,
                  ]}
                  onPress={() => handleSelectSuggestion(value)}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      amountNum === value && styles.suggestionTextActive,
                    ]}
                  >
                    {formatCurrency(value)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Méthode de paiement */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Méthode de paiement</Text>

            <View style={styles.providers}>
              {PROVIDERS.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  style={[
                    styles.providerCard,
                    selectedProvider === provider.id && styles.providerCardActive,
                    selectedProvider === provider.id && { borderColor: provider.color },
                  ]}
                  onPress={() => handleSelectProvider(provider.id)}
                >
                  <Text style={styles.providerIcon}>{provider.icon}</Text>
                  <Text
                    style={[
                      styles.providerName,
                      selectedProvider === provider.id && { color: provider.color },
                    ]}
                  >
                    {provider.name}
                  </Text>
                  {selectedProvider === provider.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={provider.color}
                      style={styles.providerCheck}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Récapitulatif */}
          {amountNum > 0 && selectedProvider && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Récapitulatif</Text>
              
              <Card variant="outlined" style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Montant</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(amountNum)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Frais</Text>
                  <Text style={styles.summaryValue}>0 FCFA</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>{formatCurrency(amountNum)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryRowLast]}>
                  <Text style={styles.summaryLabel}>Nouveau solde après paiement</Text>
                  <Text style={styles.summaryNewBalance}>
                    {formatCurrency(balance - amountNum)}
                  </Text>
                </View>
              </Card>
            </View>
          )}

          {/* Sécurité */}
          <View style={styles.securityBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
            <Text style={styles.securityText}>
              Paiement sécurisé • Vos données sont protégées
            </Text>
          </View>
        </ScrollView>

        {/* Bouton Payer */}
        <View style={styles.footer}>
          <Button
            title={isLoading ? 'Traitement...' : `Payer ${amountNum > 0 ? formatCurrency(amountNum) : ''}`}
            onPress={handlePay}
            disabled={!canPay || isLoading}
            loading={isLoading}
            fullWidth
            size="lg"
            icon={<Ionicons name="lock-closed" size={18} color={Colors.text.inverse} />}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },

  // Student info
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  studentInitials: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.inverse,
  },
  studentMeta: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  // Balance
  balanceSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceAmount: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
    marginTop: 2,
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accent[400],
    borderRadius: 2,
  },

  // Sections
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },

  // Suggestions
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  suggestionChipActive: {
    backgroundColor: Colors.primary[500],
  },
  suggestionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  suggestionTextActive: {
    color: Colors.text.inverse,
  },

  // Providers
  providers: {
    gap: Spacing.sm,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  providerCardActive: {
    backgroundColor: Colors.background.elevated,
    ...Shadows.md,
  },
  providerIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  providerName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  providerCheck: {
    marginLeft: Spacing.sm,
  },

  // Summary
  summaryCard: {
    padding: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryRowLast: {
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.neutral[200],
    marginVertical: Spacing.md,
  },
  summaryTotalLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  summaryTotalValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[500],
  },
  summaryNewBalance: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.success,
  },

  // Security
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  securityText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginLeft: Spacing.xs,
  },

  // Footer
  footer: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing['2xl'] : Spacing.lg,
    backgroundColor: Colors.background.card,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    ...Shadows.lg,
  },
});
