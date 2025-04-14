import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSelector } from 'react-redux';
import { Button, Stack, Text, XStack, YStack } from 'tamagui';
import { RootState } from '~/redux/store';
import { removeAccessToken, removeRefreshToken } from '~/utils/token';

export default function Setting() {
  const { profile } = useSelector((state: RootState) => state.profile);
  const handleProfile = (profileId: string) => {
    router.push({
      pathname: '/profile/[id]',
      params: {
        id: profileId,
        goBack: '/setting',
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
      icon: 'person-outline',
      title: 'Xem trang cá nhân',
      description: 'Xem chi tiết trang cá nhân',
      action: () => (profile ? handleProfile(profile.id) : console.log('Lỗi lấy thông tin user')),
    },
  ];

  return (
    <YStack width="100%" flex={1} backgroundColor="white" paddingTop={70}>
      <XStack
        paddingHorizontal={20}
        justifyContent="space-between"
        alignItems="center"
        marginBottom={20}>
        <Text fontSize={34} fontWeight="bold" color="#1A1A1A">
          Cài đặt
        </Text>
      </XStack>
      <Stack flex={1} marginTop={20} paddingHorizontal={20}>
        <Stack gap={15}>
          {settingOptions.map((option, index) => (
            <Button
              key={index}
              unstyled
              flexDirection="row"
              alignItems="center"
              paddingVertical={15}
              paddingHorizontal={15}
              backgroundColor="#fff"
              borderRadius={15}
              borderWidth={1}
              borderColor="#E8E8E8"
              gap={15}
              pressStyle={{
                backgroundColor: '#FFE8EC',
                borderColor: '#E94057',
              }}
              onPress={option.action}>
              <Stack
                width={45}
                height={45}
                backgroundColor="#FFE8EC"
                borderRadius={25}
                justifyContent="center"
                alignItems="center">
                <Ionicons name={option.icon as any} size={24} color="#E94057" />
              </Stack>
              <Stack flex={1}>
                <Text fontSize={16} fontWeight="600" color="black">
                  {option.title}
                </Text>
                <Text fontSize={14} color="#666" marginTop={2}>
                  {option.description}
                </Text>
              </Stack>
              <Ionicons name="chevron-forward" size={22} color="#E94057" />
            </Button>
          ))}
        </Stack>

        <Button
          backgroundColor="#E94057"
          borderRadius={15}
          height={55}
          marginTop={30}
          pressStyle={{
            backgroundColor: '#E94057',
            borderWidth: 0,
            scale: 0.98,
          }}
          onPress={handleLogout}>
          <Text color="white" fontSize={16} fontWeight="600">
            Đăng xuất
          </Text>
        </Button>
      </Stack>
    </YStack>
  );
}
