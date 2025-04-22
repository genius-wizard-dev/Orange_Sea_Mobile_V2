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
import { getFriendshipStatus, sendFriendRequest, getFriendList, getReceivedRequests, getSentRequests } from '~/redux/thunks/friend';

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
  const friendState = useSelector((state) => state.friend);

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
    if (!isOwnProfile) {
      dispatch(getFriendList());
      dispatch(getReceivedRequests());
      dispatch(getSentRequests());
    }
  }, [id, dispatch]);

  // Thêm log chi tiết hơn để debug
  // console.log("Current profile:", profile);
  // console.log("Current profile ID:", profile?._id);
  // console.log("Param ID:", id);

  // Đợi cả profile và info load xong
  if (loading || !profile || friendState.loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" space="$4">
        <Spinner size="large" color="#E94057" />
      </YStack>
    );
  }

  const isOwnProfile = profile.id === id;

  const renderFriendshipButton = () => {
    const friendsList = friendState.friends || [];
    const sentRequests = friendState.sentRequests || [];
    const receivedRequests = friendState.receivedRequests || [];

    // console.log('Current Profile ID:', id);
    console.log('Friends List:', friendsList);

    // Sửa lại cách check friend status
    const isFriend = friendsList.some(friend => 
      friend.profileId === id
    );
    const hasSentRequest = sentRequests.some(req => 
      req.profileId === id
    );
    const hasReceivedRequest = receivedRequests.some(req => 
      req.profileId === id
    );

    if (isFriend) {
      return (
        <Button
          flex={1}
          backgroundColor="white"
          borderWidth={1}
          borderColor="#E94057"
          borderRadius={15}
          padding={7}
          onPress={() => {
            const friendship = friendsList.find(f => f.profileId === id);
            dispatch(deleteFriend(friendship.id));
          }}
        >
          <XStack alignItems="center" space={5}>
            <Ionicons name="person-outline" size={20} color="#E94057" />
            <Text color="#E94057">Bạn bè</Text>
          </XStack>
        </Button>
      );
    }

    if (hasSentRequest) {
      return (
        <Button
          flex={1}
          backgroundColor="white"
          borderWidth={1}
          borderColor="#666"
          borderRadius={15}
          padding={7}
          disabled={true}
        >
          <XStack alignItems="center" space={5}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text color="#666">Đã gửi lời mời</Text>
          </XStack>
        </Button>
      );
    }

    if (hasReceivedRequest) {
      const request = receivedRequests.find(req => req.senderId === id);
      return (
        <Button
          flex={1}
          backgroundColor="#E94057"
          borderRadius={15}
          padding={7}
          onPress={() => dispatch(handleFriendRequest({ requestId: request.id, action: 'accept' }))}
        >
          <Text color="white">Chấp nhận lời mời</Text>
        </Button>
      );
    }

    return (
      <Button
        flex={1}
        backgroundColor="white"
        borderWidth={1}
        borderColor="#E94057"
        borderRadius={15}
        padding={7}
        onPress={() => dispatch(sendFriendRequest(id))}
      >
        <XStack alignItems="center" space={5}>
          <Ionicons name="person-add-outline" size={20} color="#E94057" />
          <Text color="#E94057">Kết bạn</Text>
        </XStack>
      </Button>
    );
  };

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
              {renderFriendshipButton()}
              <Button
                flex={1}
                backgroundColor="#E94057"
                borderRadius={15}
                padding={10}
                pressStyle={{ opacity: 0.7 }}
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
