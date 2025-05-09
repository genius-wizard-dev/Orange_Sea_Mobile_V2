import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import HeaderSearchComponent from '~/components/HeaderSearchComponent';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF7A1E',
        tabBarInactiveTintColor: '#a8a3a3',
        tabBarStyle: {
          height: 70,
          paddingBottom: 12,
          paddingTop: 12,
          backgroundColor: '#f9f4f4',
          borderTopWidth: 1,
          borderTopColor: '#F3F3F3',
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Nhắn tin',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={30} color={color} />
          ),
          headerShown: true,
          header: () => <HeaderSearchComponent />

        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: 'Liên hệ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'call' : 'call-outline'} size={30} color={color} />
          ),
          headerShown: true,
          header: () => <HeaderSearchComponent />
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Kết nối',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'planet' : 'planet-outline'} size={30} color={color} />
          ),
          headerShown: true,
          header: () => <HeaderSearchComponent />
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={30} color={color} />
          ),
          headerShown: true,
          header: () => <HeaderSearchComponent />
        }}
      />
    </Tabs>
  );
}
