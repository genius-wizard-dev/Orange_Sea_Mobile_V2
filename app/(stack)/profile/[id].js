import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { View, ImageBackground } from 'react-native';
import { Avatar, YStack, XStack, Text, Button, Spinner } from 'tamagui';
import { useEffect, useState } from 'react';
import { ENDPOINTS } from '../../../service/api.endpoint';
import apiService from '../../../service/api.service';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import { getProfile } from '~/redux/thunks/profile';
import HeaderLeft from '~/components/header/HeaderLeft';

export default function Info() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.profile);
  const params = useLocalSearchParams();
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const id = params.id;
  const { goBackTo } = useLocalSearchParams()

  const fetchInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.get(ENDPOINTS.PROFILE.INFO(id));
      if (result.status === 'success' && result.data) {
        setInfo(result.data);
      } else {
        setError('Could not load profile data');
      }
    } catch (error) {
      console.log(error);
      setError('An error occurred while loading the profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dispatch(getProfile());
    fetchInfo();
  }, [id, dispatch]);

  // Thêm log chi tiết hơn để debug
  // console.log("Current profile:", profile);
  // console.log("Current profile ID:", profile?._id);
  // console.log("Param ID:", id);

  // Đợi cả profile và info load xong
  if (loading || !profile) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" space="$4">
        <Spinner size="large" color="#E94057" />
      </YStack>
    );
  }

  const isOwnProfile = profile.id === id;

  if (error) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" space="$4">
        <Text style={{ color: 'red', marginBottom: 20 }}>{error}</Text>
        <Button onPress={fetchInfo} backgroundColor="#E94057" color="white">
          Try Again
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="white">
      <HeaderLeft goBack={goBackTo} title="Trang cá nhân" />
      {/* Cover Image */}
      <View
        style={{
          height: 150,
          justifyContent: 'flex-end',
          padding: 20,
          backgroundColor: '#E94057',
        }}
      >

      </View>

      {/* Profile Info Section */}
      <YStack marginTop={-50} paddingHorizontal={20}>
        {/* Avatar */}
        <Avatar
          circular
          size={100}
          borderWidth={4}
          borderColor="white"
        >
          <Avatar.Image source={{ uri: info?.avatar }} />
          <Avatar.Fallback>
            <Ionicons name="person" size={50} color="#666" />
          </Avatar.Fallback>
        </Avatar>

        {/* Name and Bio */}
        <YStack marginTop={10} space={4}>
          <Text fontSize={24} fontWeight="bold">
            {info?.name || 'Chưa có tên'}
          </Text>
          <Text fontSize={16} color="$gray10">
            {info?.bio || 'Chưa có tiểu sử'}
          </Text>
        </YStack>

        {/* Thông tin chi tiết */}
        <YStack marginTop={20} space={10}>
          {info?.email && (
            <XStack space={10} alignItems="center">
              <Ionicons name="mail-outline" size={20} color="#666" />
              <Text>{info.email}</Text>
            </XStack>
          )}
          {info?.phone && (
            <XStack space={10} alignItems="center">
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text>{info.phone}</Text>
            </XStack>
          )}
          {info?.location && (
            <XStack space={10} alignItems="center">
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text>{info.location}</Text>
            </XStack>
          )}
        </YStack>

        {/* Buttons Section */}
        <XStack marginTop={20} space={15}>
          {isOwnProfile ? (
            // Nút cho profile của chính mình
            <Button
              flex={1}
              backgroundColor="white"
              borderWidth={1}
              borderColor="#E8E8E8"
              borderRadius={15}
              padding={10}
              pressStyle={{ opacity: 0.7 }}
            >
              <XStack alignItems="center" space={15}>
                <Ionicons name="create-outline" size={24} color="#666" />
                <Text fontWeight="500">Chỉnh sửa thông tin</Text>
              </XStack>
            </Button>
          ) : (
            // Nút cho profile của người khác
            <XStack flex={1} space={10}>
              <Button
                flex={1}
                backgroundColor="white"
                borderWidth={1}
                borderColor="#E94057"
                borderRadius={15}
                padding={7}
                pressStyle={{ opacity: 0.7 }}
                onPress={() => {/* Xử lý logic kết bạn */ }}
              >
                <XStack alignItems="center" space={5}>
                  <Ionicons name="person-add-outline" size={20} color="#E94057" />
                  <Text color="#E94057" fontWeight="500">Kết bạn</Text>
                </XStack>
              </Button>
              <Button
                flex={1}
                backgroundColor="#E94057"
                borderRadius={15}
                padding={10}
                pressStyle={{ opacity: 0.7 }}
                onPress={() => {/* Xử lý logic nhắn tin */ }}
              >
                <XStack alignItems="center" space={5}>
                  <Ionicons name="chatbubble-outline" size={20} color="white" />
                  <Text color="white" fontWeight="500">Nhắn tin</Text>
                </XStack>
              </Button>
            </XStack>
          )}
        </XStack>
      </YStack>
    </YStack>
  );
}
