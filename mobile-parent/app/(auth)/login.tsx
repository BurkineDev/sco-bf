// ============================================================================
// LOGIN SCREEN - Connexion par téléphone
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Button, PhoneInput, ErrorBanner } from '@/components/ui';
import { useAuthStore } from '@/store';
import { isValidBurkinaPhone, normalizePhone } from '@/lib/utils';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestOtp } = useAuthStore();

  const isPhoneValid = isValidBurkinaPhone(normalizePhone(phone.replace(/\s/g, '')));

  const handleContinue = useCallback(async () => {
    if (!isPhoneValid) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedPhone = normalizePhone(phone.replace(/\s/g, ''));
      const result = await requestOtp(normalizedPhone);

      if (result.success) {
        // Naviguer vers l'écran OTP avec le numéro
        router.push({
          pathname: '/(auth)/otp',
          params: { phone: normalizedPhone },
        });
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (e) {
      setError('Erreur de connexion. Vérifiez votre connexion Internet.');
    } finally {
      setIsLoading(false);
    }
  }, [phone, isPhoneValid, requestOtp]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header avec illustration */}
          <LinearGradient
            colors={[Colors.primary[500], Colors.primary[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              {/* Logo ou illustration */}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="school" size={48} color={Colors.primary[500]} />
                </View>
              </View>
              
              <Text style={styles.appName}>Scolarité BF</Text>
              <Text style={styles.tagline}>
                Payez la scolarité de vos enfants en toute simplicité
              </Text>
            </View>
            
            {/* Motif décoratif */}
            <View style={styles.decorativePattern}>
              <View style={[styles.patternDot, styles.patternDot1]} />
              <View style={[styles.patternDot, styles.patternDot2]} />
              <View style={[styles.patternDot, styles.patternDot3]} />
            </View>
          </LinearGradient>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Connexion</Text>
              <Text style={styles.formSubtitle}>
                Entrez votre numéro de téléphone pour recevoir un code de vérification
              </Text>
            </View>

            {error && (
              <ErrorBanner
                message={error}
                onDismiss={() => setError(null)}
              />
            )}

            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              error={phone.length > 0 && !isPhoneValid ? 'Numéro invalide' : undefined}
            />

            <Button
              title={isLoading ? 'Envoi en cours...' : 'Recevoir le code'}
              onPress={handleContinue}
              loading={isLoading}
              disabled={!isPhoneValid || isLoading}
              fullWidth
              size="lg"
              icon={<Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} />}
              iconPosition="right"
            />

            {/* Info SMS */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.text.tertiary} />
              <Text style={styles.infoText}>
                Un SMS gratuit contenant votre code sera envoyé à ce numéro
              </Text>
            </View>

            {/* Séparateur */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Option USSD */}
            <View style={styles.ussdBox}>
              <View style={styles.ussdIconContainer}>
                <Ionicons name="keypad-outline" size={24} color={Colors.accent[600]} />
              </View>
              <View style={styles.ussdContent}>
                <Text style={styles.ussdTitle}>Paiement sans Internet ?</Text>
                <Text style={styles.ussdDescription}>
                  Composez{' '}
                  <Text style={styles.ussdCode}>*123*CODE*MATRICULE*MONTANT#</Text>
                  {' '}depuis votre téléphone
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              En continuant, vous acceptez nos{' '}
              <Text style={styles.footerLink}>Conditions d'utilisation</Text>
              {' '}et notre{' '}
              <Text style={styles.footerLink}>Politique de confidentialité</Text>
            </Text>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  
  // Header
  headerGradient: {
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  decorativePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternDot: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  patternDot1: {
    width: 120,
    height: 120,
    top: -40,
    right: -30,
  },
  patternDot2: {
    width: 80,
    height: 80,
    bottom: 20,
    left: -20,
  },
  patternDot3: {
    width: 50,
    height: 50,
    top: 60,
    left: 30,
  },

  // Form
  formContainer: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  formHeader: {
    marginBottom: Spacing['2xl'],
  },
  formTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  formSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  
  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.neutral[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[200],
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
  },
  
  // USSD Box
  ussdBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.accent[50],
    borderWidth: 1,
    borderColor: Colors.accent[200],
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  ussdIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  ussdContent: {
    flex: 1,
  },
  ussdTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  ussdDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  ussdCode: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.accent[700],
  },
  
  // Footer
  footer: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.relaxed,
  },
  footerLink: {
    color: Colors.primary[500],
    fontFamily: Typography.fontFamily.medium,
  },
});
