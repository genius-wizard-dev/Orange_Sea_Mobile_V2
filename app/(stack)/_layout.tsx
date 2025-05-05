import { Stack } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import HeaderLeft from "../../components/header/HeaderLeft";
// import { TransitionPresets } from '@react-navigation/stack';

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
            onGoBack=""
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
      {/* chat */}
      <Stack.Screen
        name="chat/chatDetail"
        options={{
          title: 'Chi tiết tin nhắn',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      {/* <Stack.Screen
        name="chat/chatSetting"
        options={{
          title: 'Tin nhắn',
          headerShown: false,
        }}
      /> */}


      {/* Me */}

      <Stack.Screen
        name="profile/[id]"
        options={{
          title: 'Trang cá nhân',
          headerShown: false,
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
        name="setting/meSetting"
        options={{
          title: 'Cài đặt',
        }}
      />


      {/* contact */}

      <Stack.Screen
        name="contact/listRequestFriend"
        options={{
          title: 'Lời mời kết bạn',
          headerShown: false,
        }}
      />

      {/* friend */}

      <Stack.Screen
        name="friend/addFriend"
        options={{
          title: 'Thêm bạn bè',
          headerShown: false,
        }}
      />

      {/* group */}

      <Stack.Screen
        name="group/createGroup"
        options={{
          title: 'Tạo nhóm',
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="group/groupDetail"

        options={{
          title: 'Chi tiết nhóm',
          headerShown: false,
          presentation: 'modal',

        }}
      />
      <Stack.Screen
        name="group/addParticipant"
        options={{
          title: 'Thêm thành viên',
          headerShown: false,
        }}
      />




    </Stack>
  );
}
