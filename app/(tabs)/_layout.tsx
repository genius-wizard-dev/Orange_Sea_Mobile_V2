import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import HeaderSearchComponent from '~/components/HeaderSearchComponent';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF7A1E',
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
            <Ionicons name={focused ? 'share-social' : 'share-social-outline'} size={30} color={color} />
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
