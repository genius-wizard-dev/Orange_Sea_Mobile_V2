import { Stack } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import HeaderLeft from "../../components/header/HeaderLeft";

export default function StackLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerTitleAlign: 'left',
        headerLeft: () => (
          <HeaderLeft
            goBack="/me"
            title=""
          />
        ),
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: "#fff",
        },
        headerStyle: {
          backgroundColor: '#FF7A1E',
        },
      }}
    >





      <Stack.Screen
        name="profile/[id]"
        options={{
          title: 'Trang cá nhân',
        }}
      />
      <Stack.Screen
        name="setting/meSetting"
        options={{
          title: 'Cài đặt',
        }}
      />
      <Stack.Screen
        name="setting/accountAndSecurity"
        options={{
          title: 'Tài khoản và bảo mật',
        }}
      />


      <Stack.Screen
        name="setting/security/changePassword"
        options={{
          title: 'Đổi mật khẩu',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="setting/update/updateProfile"
        options={{
          title: 'Chỉnh sửa thông tin',
          headerShown: false,
        }}
      />



      <Stack.Screen
        name="setting/rolePrivate"
        options={{
          title: 'Quyền riêng tư',
        }}
      />





      <Stack.Screen
        name="contact/listRequestFriend"
        options={{
          title: 'Lời mời kết bạn',
          headerShown: false,
        }}
      />

    </Stack>
  );
}
