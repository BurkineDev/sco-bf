// ============================================================================
// PAYMENT STATUS SCREEN - Statut après paiement
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Button, Card } from '@/components/ui';
import { usePaymentsStore, useStudentsStore } from '@/store';
import { formatCurrency, formatDateTime } from '@/lib/utils';

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

const STATUS_CONFIG = {
  pending: {
    title: 'Paiement en attente',
    description: 'Votre paiement est en cours de traitement...',
    icon: 'time-outline' as const,
    color: Colors.warning,
    bgColor: Colors.warning + '15',
  },
  processing: {
    title: 'Traitement en cours',
    description: 'Veuillez patienter pendant que nous confirmons votre paiement...',
    icon: 'sync-outline' as const,
    color: Colors.info,
    bgColor: Colors.info + '15',
  },
  completed: {
    title: 'Paiement réussi !',
    description: 'Votre paiement a été effectué avec succès.',
    icon: 'checkmark-circle' as const,
    color: Colors.success,
    bgColor: Colors.success + '15',
  },
  failed: {
    title: 'Paiement échoué',
    description: 'Une erreur est survenue lors du paiement. Veuillez réessayer.',
    icon: 'close-circle' as const,
    color: Colors.error,
    bgColor: Colors.error + '15',
  },
};

export default function PaymentStatusScreen() {
  const { intentId } = useLocalSearchParams<{ intentId: string }>();
  const { checkPaymentStatus, currentIntent, clearCurrentIntent } = usePaymentsStore();
  const { fetchStudents } = useStudentsStore();
  
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [isPolling, setIsPolling] = useState(true);
  
  // Animation
  const scaleAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Polling pour vérifier le statut
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;
    const maxPolls = 30; // 30 * 2s = 1 minute max

    const pollStatus = async () => {
      if (!intentId || pollCount >= maxPolls) {
        setIsPolling(false);
        return;
      }

      pollCount++;
      
      const intent = await checkPaymentStatus(intentId);
      
      if (intent) {
        if (intent.status === 'completed') {
          setStatus('completed');
          setIsPolling(false);
          // Rafraîchir les données élèves
          fetchStudents();
        } else if (intent.status === 'failed' || intent.status === 'cancelled') {
          setStatus('failed');
          setIsPolling(false);
        } else if (intent.status === 'processing') {
          setStatus('processing');
        }
      }
    };

    // Premier appel immédiat
    pollStatus();

    // Polling toutes les 2 secondes
    if (isPolling) {
      pollInterval = setInterval(pollStatus, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [intentId, isPolling]);

  // Animation d'entrée
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [status]);

  const handleDone = useCallback(() => {
    clearCurrentIntent();
    router.replace('/(tabs)');
  }, [clearCurrentIntent]);

  const handleRetry = useCallback(() => {
    clearCurrentIntent();
    router.back();
  }, [clearCurrentIntent]);

  const config = STATUS_CONFIG[status];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icône animée */}
        <Animated.View
          style={[
            styles.iconContainer,
            { backgroundColor: config.bgColor },
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {status === 'pending' || status === 'processing' ? (
            <View style={styles.spinnerContainer}>
              <Animated.View
                style={[
                  styles.spinner,
                  {
                    borderColor: config.color + '30',
                    borderTopColor: config.color,
                  },
                ]}
              />
              <Ionicons name={config.icon} size={40} color={config.color} />
            </View>
          ) : (
            <Ionicons name={config.icon} size={64} color={config.color} />
          )}
        </Animated.View>

        {/* Titre et description */}
        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.description}>{config.description}</Text>
        </Animated.View>

        {/* Détails du paiement */}
        {currentIntent && (
          <Animated.View style={[styles.detailsContainer, { opacity: fadeAnim }]}>
            <Card variant="outlined" style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Référence</Text>
                <Text style={styles.detailValue}>{currentIntent.reference}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Montant</Text>
                <Text style={styles.detailValueBold}>
                  {formatCurrency(currentIntent.amount)}
                </Text>
              </View>
              {status === 'completed' && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {formatDateTime(new Date().toISOString())}
                  </Text>
                </View>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Message de polling */}
        {isPolling && (
          <View style={styles.pollingContainer}>
            <Text style={styles.pollingText}>
              Vérification en cours...
            </Text>
          </View>
        )}

        {/* Actions */}
        {!isPolling && (
          <Animated.View style={[styles.actionsContainer, { opacity: fadeAnim }]}>
            {status === 'completed' && (
              <>
                <Button
                  title="Terminé"
                  onPress={handleDone}
                  fullWidth
                  size="lg"
                />
                <Button
                  title="Télécharger le reçu"
                  onPress={() => {}}
                  variant="outline"
                  fullWidth
                  size="lg"
                  icon={<Ionicons name="download-outline" size={20} color={Colors.primary[500]} />}
                  style={styles.secondaryButton}
                />
              </>
            )}
            
            {status === 'failed' && (
              <>
                <Button
                  title="Réessayer"
                  onPress={handleRetry}
                  fullWidth
                  size="lg"
                />
                <Button
                  title="Retour à l'accueil"
                  onPress={handleDone}
                  variant="ghost"
                  fullWidth
                  style={styles.secondaryButton}
                />
              </>
            )}
          </Animated.View>
        )}

        {/* Aide */}
        {status === 'failed' && (
          <View style={styles.helpContainer}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.text.tertiary} />
            <Text style={styles.helpText}>
              Si le problème persiste, contactez le support ou essayez via USSD
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  // Icon
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  spinnerContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
  },

  // Text
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    paddingHorizontal: Spacing.lg,
  },

  // Details
  detailsContainer: {
    width: '100%',
    marginBottom: Spacing['2xl'],
  },
  detailsCard: {
    padding: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  detailValueBold: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },

  // Polling
  pollingContainer: {
    marginBottom: Spacing.xl,
  },
  pollingText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },

  // Actions
  actionsContainer: {
    width: '100%',
  },
  secondaryButton: {
    marginTop: Spacing.md,
  },

  // Help
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  helpText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
});
