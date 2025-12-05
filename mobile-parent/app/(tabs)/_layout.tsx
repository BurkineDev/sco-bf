// ============================================================================
// TABS LAYOUT - Navigation par onglets
// ============================================================================

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors, Typography, Shadows, BorderRadius } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Paiements',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'wallet' : 'wallet-outline'} color={color} focused={focused} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon 
              name={focused ? 'notifications' : 'notifications-outline'} 
              color={color} 
              focused={focused}
              badge={3} // TODO: Dynamic badge count
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

// Composant icône avec effet visuel
interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  badge?: number;
}

function TabIcon({ name, color, focused, badge }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      {focused && <View style={styles.tabIconBackground} />}
      <Ionicons name={name} size={24} color={color} />
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Ionicons 
            name="ellipse" 
            size={8} 
            color={Colors.error}
            style={styles.badgeDot}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background.card,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    ...Shadows.lg,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    marginTop: 4,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 32,
    position: 'relative',
  },
  tabIconBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 8,
  },
  badgeDot: {},
});
