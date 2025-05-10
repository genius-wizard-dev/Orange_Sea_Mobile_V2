import { Ionicons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Image, Stack, Text, XStack, YStack } from 'tamagui';
import { Sheet } from '@tamagui/sheet';
import { RootState } from '~/redux/store';
import { getProfile } from '~/redux/thunks/profile';
import { removeAccessToken, removeRefreshToken } from '~/utils/token';
import { logout } from '~/service/auth.service';
import SheetComponent from '~/components/SheetComponent';

export default function Me() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state: RootState) => state.profile);
  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);
  const [shouldLogout, setShouldLogout] = useState(false);


  useEffect(() => {
    if (!logoutSheetOpen && shouldLogout) {
      performLogout();
      setShouldLogout(false);  // reset flag
    }
  }, [logoutSheetOpen, shouldLogout]);

  useEffect(() => {
    dispatch(getProfile() as any);
  }, [dispatch]);

  const router = useRouter();
  const handleProfile = (profileId: string) => {
    router.push({
      pathname: '/profile/[id]',
      params: {
        id: profileId,
        goBack: '/me',
      },
    });
  };

  const performLogout = async () => {
    try {
      // Gọi API logout
      await logout();
      // Xóa token sau khi logout thành công
      await removeAccessToken();
      await removeRefreshToken();
      // Chuyển hướng về trang chủ
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Vẫn xóa token và chuyển hướng ngay cả khi API fail
      await removeAccessToken();
      await removeRefreshToken();
      router.replace('/');
    }
  };

  const settingOptions = [
    {
      type: "profile",
      icon: 'person-outline',
      image: profile ? profile?.avatar : "",
      title: profile ? profile.name : 'Tài khoản',
      description: 'Xem trang cá nhân',
      action: () => (profile ? handleProfile(profile.id) : console.log('Lỗi lấy thông tin user')),
    },
    {
      icon: 'key-outline',
      title: 'Tài khoản và bảo mật',
      description: 'null',
      action: () => router.push('/setting/accountAndSecurity'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Quyền riêng tư',
      description: 'null',
      action: () => router.push('/setting/rolePrivate'),
    },
  ];

  return (
    <YStack width="100%" flex={1} backgroundColor="white" paddingBottom={10}>
      <Stack flex={1} marginTop={20} paddingHorizontal={10}>
        <Stack gap={10}>
          {settingOptions.map((option, index) => (
            <Button
              key={index}
              unstyled
              flexDirection="row"
              alignItems="center"
              paddingVertical={15}
              paddingHorizontal={15}
              backgroundColor={option.type == "profile" ? "#eaeaea" : "#ffffff"}
              marginBottom={option.type == "profile" ? 20 : 0}
              borderRadius={15}
              borderWidth={1}
              borderColor="#E8E8E8"
              gap={10}
              pressStyle={{
                backgroundColor: '#FFE8EC',
                borderColor: '#E94057',
              }}
              onPress={option.action}>

              <Stack
                width={45}
                height={45}
                backgroundColor="#fcd6bd"
                borderRadius={25}
                justifyContent="center"
                alignItems="center">

                {
                  option.image ? (
                    <Image
                      src={option.image}
                      width={50}
                      height={50}
                      borderRadius={50}
                    />
                  ) : (
                    <Ionicons name={option.icon as any} size={24} color="#FF7A1E" />
                  )
                }

              </Stack>

              <Stack flex={1}>
                <Text fontSize={16} fontWeight="600" color="black">
                  {option.title}
                </Text>
                {option.description != "null" && (
                  <Text fontSize={14} color="#666" marginTop={2}>
                    {option.description}
                  </Text>
                )}

              </Stack>

              <Ionicons name="chevron-forward" size={22} color="#E94057" />


            </Button>
          ))}
        </Stack>

        <Button
          backgroundColor="#f9e6d9"
          borderRadius={15}
          height={55}
          marginTop={30}
          pressStyle={{
            backgroundColor: '#f7caad',
            borderWidth: 0,
            scale: 0.98,
          }}
          onPress={() => setLogoutSheetOpen(true)}
        >
          <Ionicons name="log-out-outline" size={20} color="#E94057" />
          <Text fontSize={15} fontWeight="600" color="#E94057">
            ĐĂNG XUẤT
          </Text>
        </Button>

        <SheetComponent
          open={logoutSheetOpen}
          onOpenChange={setLogoutSheetOpen}
          zIndex={100_003}
          snapPoints={[25,10]}
        >
          <YStack space="$4" width="100%" alignItems="center">
            {/* <Text 
                fontSize={20} 
                fontWeight="600" 
                color="#E94057"
              >
                Xác nhận đăng xuất
              </Text> */}

            <Text
              color="#666"
              textAlign="center"
              fontSize={16}
            >
              Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?
            </Text>

            <XStack width="100%" gap={12} marginTop={10}>
              <Button
                flex={1}
                backgroundColor="#f2f2f2"
                size="$5"
                onPress={() => setLogoutSheetOpen(false)}
                icon={<Ionicons name="close" size={20} color="#333" />}
              >
                <Text color="#333">Hủy</Text>
              </Button>

              <Button
                flex={1}
                backgroundColor="#FF7A1E"
                size="$5"
                onPress={() => {
                  setLogoutSheetOpen(false);
                  setShouldLogout(true);
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="white" />
                <Text color="white">Đăng xuất</Text>
              </Button>
            </XStack>
          </YStack>
        </SheetComponent>
      </Stack>
    </YStack >
  );
}
