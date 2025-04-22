import { Ionicons } from '@expo/vector-icons';
import { router, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Image, Stack, Text, XStack, YStack } from 'tamagui';
import { RootState } from '~/redux/store';
import { getProfile } from '~/redux/thunks/profile';
import { removeAccessToken, removeRefreshToken } from '~/utils/token';

export default function Me() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state: RootState) => state.profile);

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
  const handleLogout = async () => {
    await removeAccessToken();
    await removeRefreshToken();
    router.replace('/');
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

                {/* <Ionicons name={option.icon as any} size={24} color="#E94057" /> */}
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
          onPress={handleLogout}>
          <Text fontSize={16} fontWeight="600" color="#E94057">
            Đăng xuất
          </Text>
        </Button>
      </Stack>
    </YStack>
  );
}
