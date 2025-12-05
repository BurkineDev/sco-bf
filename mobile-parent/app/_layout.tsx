// ============================================================================
// ROOT LAYOUT - Configuration globale de l'application
// ============================================================================

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store';

// Empêcher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading, setLoading } = useAuthStore();

  // Charger les polices personnalisées
  const [fontsLoaded, fontError] = useFonts({
    'Outfit-Regular': require('../assets/fonts/Outfit-Regular.ttf'),
    'Outfit-Medium': require('../assets/fonts/Outfit-Medium.ttf'),
    'Outfit-SemiBold': require('../assets/fonts/Outfit-SemiBold.ttf'),
    'Outfit-Bold': require('../assets/fonts/Outfit-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Attendre que les polices soient chargées
        if (fontsLoaded || fontError) {
          // Simuler une vérification de session
          await new Promise(resolve => setTimeout(resolve, 500));
          setLoading(false);
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn(e);
        setLoading(false);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [fontsLoaded, fontError]);

  // Afficher un écran vide pendant le chargement des polices
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background.primary },
          animation: 'slide_from_right',
        }}
      >
        {/* Groupes de routes */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Écrans modaux */}
        <Stack.Screen
          name="payment/[studentId]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="payment/status/[intentId]"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: false,
          }}
        />
      </Stack>
      
      {/* Toast global pour les notifications */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
});
