// ============================================================================
// INDEX - Redirection initiale
// ============================================================================

import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store';
import { LoadingScreen } from '@/components/ui';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Afficher l'écran de chargement pendant la vérification
  if (isLoading) {
    return <LoadingScreen message="Vérification..." />;
  }

  // Rediriger selon l'état d'authentification
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
