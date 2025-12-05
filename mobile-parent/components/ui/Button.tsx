// ============================================================================
// BUTTON COMPONENT - Bouton principal avec variantes
// ============================================================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    sm: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      fontSize: Typography.fontSize.sm,
    },
    md: {
      paddingVertical: Spacing.md + 2,
      paddingHorizontal: Spacing.xl,
      fontSize: Typography.fontSize.base,
    },
    lg: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing['2xl'],
      fontSize: Typography.fontSize.lg,
    },
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: isDisabled ? Colors.neutral[300] : Colors.primary[500],
          },
          text: {
            color: Colors.text.inverse,
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDisabled ? Colors.neutral[200] : Colors.accent[500],
          },
          text: {
            color: Colors.neutral[900],
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: isDisabled ? Colors.neutral[300] : Colors.primary[500],
          },
          text: {
            color: isDisabled ? Colors.neutral[400] : Colors.primary[500],
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: isDisabled ? Colors.neutral[400] : Colors.primary[500],
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: isDisabled ? Colors.neutral[300] : Colors.error,
          },
          text: {
            color: Colors.text.inverse,
          },
        };
      default:
        return {
          container: {},
          text: {},
        };
    }
  };

  const variantStyles = getVariantStyles();

  const content = (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator 
          color={variantStyles.text.color} 
          size={size === 'sm' ? 'small' : 'small'} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text
            style={[
              styles.text,
              { fontSize: sizeStyles[size].fontSize },
              variantStyles.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  // Pour le bouton primaire, utiliser un gradient
  if (variant === 'primary' && !isDisabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={[Colors.primary[400], Colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.container,
            {
              paddingVertical: sizeStyles[size].paddingVertical,
              paddingHorizontal: sizeStyles[size].paddingHorizontal,
            },
            Shadows.md,
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
        },
        variantStyles.container,
        variant !== 'ghost' && Shadows.sm,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: Typography.fontFamily.semibold,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
