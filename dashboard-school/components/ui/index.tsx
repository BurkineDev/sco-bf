// ============================================================================
// UI COMPONENTS - Composants réutilisables
// ============================================================================

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';
import { 
  Loader2, 
  ChevronDown, 
  Check,
  X,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

// ============================================================================
// BUTTON
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  outline: 'border-2 border-earth-200 bg-white text-earth-700 hover:bg-earth-50 hover:border-earth-300 font-semibold rounded-xl transition-all',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants[variant],
        buttonSizes[size],
        'inline-flex items-center justify-center gap-2',
        (disabled || loading) && 'opacity-60 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon && iconPosition === 'left' && icon
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}

// ============================================================================
// BADGE
// ============================================================================

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-earth-100 text-earth-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
  info: 'bg-info-50 text-info-600',
  primary: 'bg-primary-50 text-primary-600',
};

export function Badge({ variant = 'default', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full',
        badgeVariants[variant],
        className
      )}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-success-500',
          variant === 'warning' && 'bg-warning-500',
          variant === 'error' && 'bg-error-500',
          variant === 'info' && 'bg-info-500',
          variant === 'primary' && 'bg-primary-500',
          variant === 'default' && 'bg-earth-500',
        )} />
      )}
      {children}
    </span>
  );
}

// ============================================================================
// CARD
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const cardPadding = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-earth-100 shadow-sm',
        cardPadding[padding],
        hover && 'transition-all duration-300 hover:shadow-lg hover:shadow-earth-900/5 hover:-translate-y-1',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('pb-4 border-b border-earth-100', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-earth-900', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-earth-500 mt-1', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('pt-4', className)}>
      {children}
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'error';
  className?: string;
}

const statColors = {
  primary: 'from-primary-500/10 to-primary-500/5 text-primary-600',
  accent: 'from-accent-500/10 to-accent-500/5 text-accent-600',
  success: 'from-success-500/10 to-success-500/5 text-success-600',
  warning: 'from-warning-500/10 to-warning-500/5 text-warning-600',
  error: 'from-error-500/10 to-error-500/5 text-error-600',
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'primary',
  className 
}: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background gradient */}
      <div className={cn(
        'absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full -translate-y-1/2 translate-x-1/2 opacity-50',
        statColors[color]
      )} />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
            statColors[color]
          )}>
            {icon}
          </div>
          
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trend.isPositive ? 'text-success-600' : 'text-error-600'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-sm font-medium text-earth-500">{title}</p>
          <p className="text-2xl font-bold text-earth-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-earth-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// ALERT
// ============================================================================

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const alertConfig = {
  info: { icon: Info, bg: 'bg-info-50', border: 'border-info-200', text: 'text-info-800', iconColor: 'text-info-500' },
  success: { icon: CheckCircle, bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-800', iconColor: 'text-success-500' },
  warning: { icon: AlertTriangle, bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-800', iconColor: 'text-warning-500' },
  error: { icon: AlertCircle, bg: 'bg-error-50', border: 'border-error-200', text: 'text-error-800', iconColor: 'text-error-500' },
};

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  const config = alertConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex gap-3 p-4 rounded-xl border',
      config.bg,
      config.border,
      className
    )}>
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1">
        {title && (
          <p className={cn('font-semibold', config.text)}>{title}</p>
        )}
        <p className={cn('text-sm', config.text, title && 'mt-1')}>{children}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className={cn('p-1 rounded-lg hover:bg-black/5 transition-colors', config.iconColor)}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'accent' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

const progressSizes = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const progressColors = {
  primary: 'bg-primary-500',
  accent: 'bg-accent-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
};

export function ProgressBar({ 
  value, 
  max = 100, 
  size = 'md', 
  color = 'primary',
  showLabel = false,
  className 
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-earth-600">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-earth-100 rounded-full overflow-hidden', progressSizes[size])}>
        <motion.div
          className={cn('h-full rounded-full', progressColors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// AVATAR
// ============================================================================

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover border-2 border-white shadow-sm',
          avatarSizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold flex items-center justify-center border-2 border-white shadow-sm',
        avatarSizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'shimmer',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-xl',
        className
      )}
    />
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="w-16 h-16 rounded-2xl bg-earth-100 flex items-center justify-center text-earth-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-earth-900 text-center">{title}</h3>
      {description && (
        <p className="text-sm text-earth-500 text-center mt-2 max-w-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}
