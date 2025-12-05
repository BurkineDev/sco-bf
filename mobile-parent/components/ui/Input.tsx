// ============================================================================
// INPUT COMPONENT - Champ de saisie avec variantes
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  disabled = false,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onFocus?.(null as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onBlur?.(null as any);
  };

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? Colors.error : Colors.neutral[300],
      error ? Colors.error : Colors.primary[500],
    ],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
        </Text>
      )}
      
      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? Colors.error : isFocused ? Colors.primary[500] : Colors.neutral[400]}
            style={styles.leftIcon}
          />
        )}
        
        <TextInput
          {...props}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            disabled && styles.inputDisabled,
            props.style,
          ]}
          placeholderTextColor={Colors.neutral[400]}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIconButton}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={error ? Colors.error : Colors.neutral[400]}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {(error || hint) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// PHONE INPUT - Input spécifique pour téléphone burkinabè
// ============================================================================

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export function PhoneInput({
  value,
  onChangeText,
  error,
  disabled,
  containerStyle,
}: PhoneInputProps) {
  const handleChange = (text: string) => {
    // Nettoyer et formater
    const cleaned = text.replace(/\D/g, '');
    
    // Format: XX XX XX XX
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + ' ' + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      formatted = cleaned.slice(0, 2) + ' ' + cleaned.slice(2, 4) + ' ' + cleaned.slice(4);
    }
    if (cleaned.length > 6) {
      formatted = cleaned.slice(0, 2) + ' ' + cleaned.slice(2, 4) + ' ' + cleaned.slice(4, 6) + ' ' + cleaned.slice(6, 8);
    }
    
    onChangeText(formatted);
  };

  return (
    <View style={[styles.phoneContainer, containerStyle]}>
      <View style={styles.prefixContainer}>
        <Text style={styles.flagEmoji}>🇧🇫</Text>
        <Text style={styles.prefixText}>+226</Text>
      </View>
      
      <View style={styles.phoneInputWrapper}>
        <Input
          value={value}
          onChangeText={handleChange}
          placeholder="70 12 34 56"
          keyboardType="phone-pad"
          maxLength={11} // XX XX XX XX
          error={error}
          disabled={disabled}
          leftIcon="call-outline"
        />
      </View>
    </View>
  );
}

// ============================================================================
// OTP INPUT - Input pour code OTP
// ============================================================================

interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  error?: string;
  autoFocus?: boolean;
}

export function OtpInput({
  value,
  onChangeText,
  length = 6,
  error,
  autoFocus = true,
}: OtpInputProps) {
  const inputRef = React.useRef<TextInput>(null);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, length);
    onChangeText(cleaned);
  };

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.otpContainer}>
      <TouchableOpacity
        style={styles.otpBoxesContainer}
        onPress={handlePress}
        activeOpacity={1}
      >
        {Array(length)
          .fill(0)
          .map((_, index) => (
            <View
              key={index}
              style={[
                styles.otpBox,
                value.length === index && styles.otpBoxFocused,
                value[index] && styles.otpBoxFilled,
                error && styles.otpBoxError,
              ]}
            >
              <Text style={styles.otpDigit}>
                {value[index] || ''}
              </Text>
            </View>
          ))}
      </TouchableOpacity>
      
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        style={styles.hiddenInput}
        caretHidden
      />
      
      {error && <Text style={styles.otpError}>{error}</Text>}
    </View>
  );
}

// ============================================================================
// AMOUNT INPUT - Input pour montants
// ============================================================================

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  maxAmount?: number;
  error?: string;
  label?: string;
}

export function AmountInput({
  value,
  onChangeText,
  maxAmount,
  error,
  label = 'Montant',
}: AmountInputProps) {
  const handleChange = (text: string) => {
    // Supprimer tout sauf les chiffres
    const cleaned = text.replace(/\D/g, '');
    const amount = parseInt(cleaned, 10) || 0;
    
    // Vérifier le max si défini
    if (maxAmount && amount > maxAmount) {
      return;
    }
    
    onChangeText(cleaned);
  };

  // Formater pour l'affichage
  const displayValue = value 
    ? parseInt(value, 10).toLocaleString('fr-FR')
    : '';

  return (
    <View style={styles.amountContainer}>
      <Input
        label={label}
        value={displayValue}
        onChangeText={handleChange}
        placeholder="0"
        keyboardType="number-pad"
        error={error}
        rightIcon="cash-outline"
      />
      <Text style={styles.currencyLabel}>FCFA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  labelError: {
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  inputContainerFocused: {
    ...Shadows.md,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.neutral[100],
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.sm,
  },
  inputDisabled: {
    color: Colors.text.tertiary,
  },
  leftIcon: {
    marginLeft: Spacing.lg,
  },
  rightIconButton: {
    padding: Spacing.md,
    marginRight: Spacing.sm,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
  },
  
  // Phone Input
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    marginTop: 24, // Alignement avec le label
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  prefixText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  
  // OTP Input
  otpContainer: {
    alignItems: 'center',
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  otpBoxFocused: {
    borderColor: Colors.primary[500],
    ...Shadows.md,
  },
  otpBoxFilled: {
    borderColor: Colors.primary[400],
    backgroundColor: Colors.primary[50],
  },
  otpBoxError: {
    borderColor: Colors.error,
  },
  otpDigit: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  otpError: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontFamily: Typography.fontFamily.medium,
  },
  
  // Amount Input
  amountContainer: {
    position: 'relative',
  },
  currencyLabel: {
    position: 'absolute',
    right: 52,
    top: 38,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.tertiary,
  },
});
