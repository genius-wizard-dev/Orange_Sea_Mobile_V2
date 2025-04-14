import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E94057',
        tabBarInactiveTintColor: '#B5B5B5',
        tabBarStyle: {
          height: 70,
          paddingBottom: 12,
          paddingTop: 12,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F3F3',
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
        },
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={30} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="setting"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={30} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
