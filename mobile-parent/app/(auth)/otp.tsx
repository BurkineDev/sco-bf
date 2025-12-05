// ============================================================================
// OTP SCREEN - Vérification du code OTP
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Button, OtpInput, ErrorBanner } from '@/components/ui';
import { useAuthStore } from '@/store';
import { maskPhone } from '@/lib/utils';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // secondes

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  
  const { verifyOtp, requestOtp } = useAuthStore();

  // Timer pour le cooldown de renvoi
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Vérification automatique quand 6 chiffres
  useEffect(() => {
    if (otp.length === OTP_LENGTH) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = useCallback(async () => {
    if (otp.length !== OTP_LENGTH || !phone) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyOtp(phone, otp);

      if (result.success) {
        // Rediriger vers les tabs principaux
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Code invalide');
        setOtp(''); // Reset le code
      }
    } catch (e) {
      setError('Erreur de connexion. Réessayez.');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  }, [otp, phone, verifyOtp]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || !phone) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await requestOtp(phone);

      if (result.success) {
        setResendCooldown(RESEND_COOLDOWN);
        setOtp('');
      } else {
        setError(result.error || 'Impossible de renvoyer le code');
      }
    } catch (e) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  }, [phone, resendCooldown, requestOtp]);

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          {/* Icône animée */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="chatbubble-ellipses" size={40} color={Colors.primary[500]} />
            </View>
            <View style={styles.iconBadge}>
              <Ionicons name="checkmark" size={16} color={Colors.text.inverse} />
            </View>
          </View>

          <Text style={styles.title}>Vérification</Text>
          <Text style={styles.subtitle}>
            Entrez le code à 6 chiffres envoyé au{'\n'}
            <Text style={styles.phoneNumber}>{maskPhone(phone || '')}</Text>
          </Text>

          {/* Erreur */}
          {error && (
            <ErrorBanner
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {/* Input OTP */}
          <View style={styles.otpContainer}>
            <OtpInput
              value={otp}
              onChangeText={setOtp}
              length={OTP_LENGTH}
              error={error ? ' ' : undefined}
              autoFocus
            />
          </View>

          {/* Bouton vérifier */}
          <Button
            title={isLoading ? 'Vérification...' : 'Vérifier'}
            onPress={handleVerify}
            loading={isLoading}
            disabled={otp.length !== OTP_LENGTH || isLoading}
            fullWidth
            size="lg"
          />

          {/* Renvoyer le code */}
          <View style={styles.resendContainer}>
            {resendCooldown > 0 ? (
              <Text style={styles.resendCooldownText}>
                Renvoyer dans {resendCooldown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isLoading}>
                <Text style={styles.resendText}>
                  Vous n'avez pas reçu le code ?{' '}
                  <Text style={styles.resendLink}>Renvoyer</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Aide */}
          <View style={styles.helpBox}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.text.tertiary} />
            <Text style={styles.helpText}>
              Le code peut prendre quelques secondes à arriver. Vérifiez vos SMS.
            </Text>
          </View>
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['2xl'],
    alignItems: 'center',
  },
  
  // Icon
  iconContainer: {
    marginBottom: Spacing['2xl'],
    position: 'relative',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  iconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },
  
  // Text
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing.xl,
  },
  phoneNumber: {
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  
  // OTP
  otpContainer: {
    marginBottom: Spacing['2xl'],
  },
  
  // Resend
  resendContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  resendCooldownText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },
  resendText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
  },
  resendLink: {
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary[500],
  },
  
  // Help
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.neutral[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing['3xl'],
    marginHorizontal: Spacing.lg,
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
