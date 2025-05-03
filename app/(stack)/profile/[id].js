import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { View, ImageBackground, Alert } from 'react-native';
import { Avatar, YStack, XStack, Text, Button, Spinner } from 'tamagui';
import { useEffect, useState } from 'react';
import { ENDPOINTS } from '../../../service/api.endpoint';
import apiService from '../../../service/api.service';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import { getProfile } from '~/redux/thunks/profile';
import HeaderLeft from '~/components/header/HeaderLeft';
import { checkFriendshipStatus, sendFriendRequest, deleteFriend, getSentRequests, getReceivedRequests, handleFriendRequest } from '~/redux/thunks/friend';

const LoadingButton = () => (
  <Button
    flex={1}
    backgroundColor="#f5f5f5"
    borderWidth={1}
    borderColor="#E8E8E8"
    borderRadius={15}
    padding={7}
    disabled
    animation="lazy"
    opacity={0.7}
  >
    <XStack alignItems="center" space={5}>
      <Spinner size="small" color="#666" />
      <Text color="#666">Đang tải...</Text>
    </XStack>
  </Button>
);

export default function Info() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.profile);
  const { loading: friendLoading, sentRequests, sentRequestsLoading, receivedRequests, friendshipStatus: reduxFriendshipStatus } = useSelector((state) => state.friend);
  const params = useLocalSearchParams();
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const id = params.id;
  const { goBack } = useLocalSearchParams();
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isHandlingRequest, setIsHandlingRequest] = useState(false);
  
  
  // console.log(id, 'ID from params');

  const fetchInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.get(ENDPOINTS.PROFILE.INFO(id));

      console.log(result);

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
    const fetchData = async () => {
      try {
        setIsDataLoaded(false);
        const profileResult = await dispatch(getProfile()).unwrap();
        await fetchInfo();
        
        const isOwnProfile = profileResult?.id === id;
        if (!isOwnProfile) {
          const statusResult = await dispatch(checkFriendshipStatus(id)).unwrap();
          console.log('Full status result:', statusResult); // Thêm log chi tiết hơn
          
          await Promise.all([
            dispatch(getSentRequests()),
            dispatch(getReceivedRequests())
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsDataLoaded(true);
      }
    };
    fetchData();
  }, [id, dispatch]);

  useEffect(() => {
    console.log('friendshipStatus from redux:', friendshipStatus);
  }, [friendshipStatus]);

  // Sync local state with redux state
  useEffect(() => {
    if (reduxFriendshipStatus) {
      setFriendshipStatus(reduxFriendshipStatus);
    }
  }, [reduxFriendshipStatus]);

  // Chuyển khai báo isOwnProfile xuống đây
  const isOwnProfile = profile?.id === id;

  const handleSendFriendRequest = async () => {
    try {
      setIsSending(true);
      const result = await dispatch(sendFriendRequest(info.id)).unwrap();
      if (result.status === 'success') {
        Alert.alert('Thông báo', 'Gửi lời mời kết bạn thành công');
        // Nên check lại danh sách sent requests để cập nhật UI
        await dispatch(getSentRequests());
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể gửi lời mời kết bạn');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi gửi lời mời kết bạn');
    } finally {
      setIsSending(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setIsHandlingRequest(true);
      const result = await dispatch(handleFriendRequest({ 
        requestId, 
        action: 'ACCEPT' 
      })).unwrap();

      if (result.status === 'success') {
        Alert.alert('Thông báo', 'Đã chấp nhận lời mời kết bạn');
        // Cập nhật lại friendshipStatus
        setFriendshipStatus({
            isFriend: true,
            friendshipId: result.id
        });
        // Refresh lại data
        await Promise.all([
            dispatch(checkFriendshipStatus(id)),
            dispatch(getReceivedRequests())
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể chấp nhận lời mời');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi xử lý yêu cầu');
    } finally {
      setIsHandlingRequest(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setIsHandlingRequest(true);
      const result = await dispatch(handleFriendRequest({ 
        requestId, 
        action: 'REJECT' 
      })).unwrap();

      if (result.status === 'success') {
        Alert.alert('Thông báo', 'Đã từ chối lời mời kết bạn');
        // Refresh lại trạng thái
        await Promise.all([
          dispatch(checkFriendshipStatus(id)),
          dispatch(getReceivedRequests())
        ]);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể từ chối lời mời');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi xử lý yêu cầu');
    } finally {
      setIsHandlingRequest(false);
    }
  };

  const renderFriendshipButton = () => {
    if (isOwnProfile) return null;

    // Show loading khi đang gửi request
    if (isSending) {
      return <LoadingButton />;
    }

    // Chỉ check loading cho lúc load data ban đầu
    if (!isDataLoaded || sentRequestsLoading) {
      return <LoadingButton />;
    }

    // Check xem có trong danh sách nhận request không
    const pendingRequest = receivedRequests?.find(request => request.profileId === id);
    if (pendingRequest) {
      return (
        <YStack space={10} flex={1}>
          <XStack space={10}>
            {isHandlingRequest ? (
              <LoadingButton />
            ) : (
              <>
                <Button
                  flex={1}
                  backgroundColor="#E94057"
                  borderRadius={15}
                  padding={7}
                  onPress={() => handleAcceptRequest(pendingRequest.id)}
                >
                  <Text color="white">Chấp nhận</Text>
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$gray5"
                  borderRadius={15}
                  padding={7}
                  marginLeft={10}
                  onPress={() => handleRejectRequest(pendingRequest.id)}
                >
                  <Text>Từ chối</Text>
                </Button>
              </>
            )}
          </XStack>
          {/* <Button
            backgroundColor="#E94057"
            borderRadius={15}
            padding={10}
            alignSelf="center"
            width="50%"
          >
            <XStack alignItems="center" space={5} justifyContent="center">
              <Ionicons name="chatbubble-outline" size={20} color="white" />
              <Text color="white" fontWeight="500">Nhắn tin</Text>
            </XStack>
          </Button> */}
        </YStack>
      );
    }

    console.log('Current friendshipStatus:', friendshipStatus); // Debug log

    // Use reduxFriendshipStatus instead of local state
    if (reduxFriendshipStatus?.isFriend) {
      return (
        <XStack space={10} flex={1}>
          <Button
            flex={1}
            backgroundColor="white"
            borderWidth={1}
            borderColor="#E94057"
            borderRadius={15}
            padding={7}
          >
            <XStack alignItems="center" space={5}>
              <Ionicons name="person-outline" size={20} color="#E94057" />
              <Text color="#E94057">Bạn bè</Text>
            </XStack>
          </Button>
          <Button
            flex={1}
            backgroundColor="#E94057"
            borderRadius={15}
            padding={7}
          >
            <XStack alignItems="center" space={5}>
              <Ionicons name="chatbubble-outline" size={20} color="white" />
              <Text color="white">Nhắn tin</Text>
            </XStack>
          </Button>
        </XStack>
      );
    }

    // Sửa lại check dùng profileId thay vì id
    const hasSentRequest = sentRequests?.some(request => request.profileId === id);

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

    return (
      <Button
        flex={1}
        backgroundColor="white"
        borderWidth={1}
        borderColor="#E94057"
        borderRadius={15}
        padding={7}
        onPress={handleSendFriendRequest}
      >
        <XStack alignItems="center" space={5}>
          <Ionicons name="person-add-outline" size={20} color="#E94057" />
          <Text color="#E94057">Kết bạn</Text>
        </XStack>
      </Button>
    );
  };

  const renderLoadingState = () => (
    <YStack flex={1} backgroundColor="white">
      <HeaderLeft goBack={goBack} title="Trang cá nhân" />
      <View style={{ height: 150, backgroundColor: '#E94057' }} />
      <YStack paddingHorizontal={20}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#f5f5f5',
          marginTop: -50,
        }} />
        <View style={{
          width: 200,
          height: 24,
          borderRadius: 4,
          backgroundColor: '#f5f5f5',
          marginTop: 10,
        }} />
        {/* ...other loading elements... */}
      </YStack>
    </YStack>
  );

  console.log(sentRequests, 'Sent Requests');

  // Sửa lại điều kiện loading
  if (loading || !profile || !isDataLoaded) {
    return renderLoadingState();
  }

  return (
    <YStack flex={1} backgroundColor="white">
      <HeaderLeft goBack={goBack} title="Trang cá nhân" />
      {/* Cover Image */}
      <View
        style={{
          height: 150,
          justifyContent: 'flex-end',
          padding: 20,
          backgroundColor: '#E94057',
        }}
      ></View>

      {/* Profile Info Section */}
      <YStack marginTop={-50} paddingHorizontal={20}>
        {/* Avatar */}
        <Avatar circular size={100} borderWidth={4} borderColor="white">
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
            <XStack flex={1}>
              {renderFriendshipButton()}
            </XStack>
          )}
        </XStack>
      </YStack>
    </YStack>
  );
}
