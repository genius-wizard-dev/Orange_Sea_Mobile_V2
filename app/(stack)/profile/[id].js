import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { View, ImageBackground, Alert, ToastAndroid } from 'react-native';
import { Avatar, YStack, XStack, Text, Button, Spinner } from 'tamagui';
import { useEffect, useState } from 'react';
import { ENDPOINTS } from '../../../service/api.endpoint';
import apiService from '../../../service/api.service';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSelector, useDispatch } from 'react-redux';
import { getProfile } from '~/redux/thunks/profile';
import HeaderLeft from '~/components/header/HeaderLeft';
import {
  checkFriendshipStatus, sendFriendRequest, deleteFriend,
  getSentRequests, getReceivedRequests, handleFriendRequest, getFriendList
} from '~/redux/thunks/friend';
import DefaultAvatar from '~/components/chat/DefaultAvatar';

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
      <Text color="#666">Đang tải thông tin...</Text>
    </XStack>
  </Button>
);

export default function Info() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.profile);
  const { loading: friendLoading, friends,
    sentRequests, sentRequestsLoading, receivedRequests,
    friendshipStatus: reduxFriendshipStatus } = useSelector((state) => state.friend);
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

      // console.log(result);

      if (result.statusCode === 200 && result.data) {
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

          await Promise.all([
            dispatch(getSentRequests()),
            dispatch(getReceivedRequests()),
            dispatch(getFriendList()) // Thêm vào đây để lấy danh sách bạn bè
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
    // console.log('friendshipStatus from redux:', friendshipStatus);
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

      // console.log(result, 'Send Friend Request Result'); // Debug log

      if (result) {
        ToastAndroid.show("Đã gửi lời mời kết bạn", ToastAndroid.SHORT);
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

      if (result.statusCode === 200) {
        ToastAndroid.show("Đã chấp nhận lời mời kết bạn", ToastAndroid.SHORT);
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

      if (result.statusCode === 200) {
        ToastAndroid.show("Đã từ chối lời mời kết bạn", ToastAndroid.SHORT);
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


  const handleCancelRequest = async () => {
    try {
      // Tìm request id từ danh sách đã gửi
      const sentRequest = sentRequests?.data?.find(request => request.profileId === id);

      if (!sentRequest) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin lời mời kết bạn');
        return;
      }

      // Hiển thị loading
      setIsSending(true);

      // Gọi thunk để hủy lời mời
      const result = await dispatch(deleteFriend(sentRequest.id)).unwrap();

      console.log('Cancel request result:', result);

      if (result && result.success) {
        // Hiển thị thông báo thành công
        ToastAndroid.show("Đã huỷ lời mời kết bạn", ToastAndroid.SHORT);

        // Cập nhật lại danh sách lời mời đã gửi
        await dispatch(getSentRequests());

        // Cập nhật lại trạng thái kết bạn
        await dispatch(checkFriendshipStatus(id));
      } else {
        Alert.alert('Lỗi', 'Không thể huỷ lời mời kết bạn');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      Alert.alert(
        'Lỗi',
        error?.message || 'Có lỗi xảy ra khi huỷ lời mời kết bạn'
      );
    } finally {
      // Tắt loading
      setIsSending(false);
    }
  };


  const handleCancelFriendship = async () => {
    try {
      // Tìm thông tin bạn bè và friendshipId từ danh sách bạn bè
      const friendList = friends?.data || [];
      const friendship = friendList.find(friend => friend.profileId === id);

      if (!friendship) {
        console.log('Không tìm thấy thông tin bạn bè trong danh sách');
        Alert.alert('Lỗi', 'Không tìm thấy thông tin bạn bè để huỷ kết bạn');
        return;
      }

      // Lấy friendshipId từ field id của đối tượng tìm được
      const friendshipId = friendship.id;
      console.log('Đã tìm thấy friendshipId:', friendshipId);

      // Hiển thị confirmation dialog trước khi huỷ kết bạn
      Alert.alert(
        "Xác nhận huỷ kết bạn",
        `Bạn có chắc chắn muốn huỷ kết bạn với ${info?.name || "người dùng này"}?`,
        [
          {
            text: "Huỷ",
            style: "cancel"
          },
          {
            text: "Xác nhận",
            style: "destructive",
            onPress: async () => {
              // Hiển thị loading
              setIsSending(true);

              try {
                // Gọi thunk để huỷ kết bạn, dùng chung với huỷ lời mời
                const result = await dispatch(deleteFriend(friendshipId)).unwrap();

                console.log('Cancel friendship result:', result);

                if (result && result.success) {
                  // Hiển thị thông báo thành công
                  ToastAndroid.show("Đã huỷ kết bạn thành công", ToastAndroid.SHORT);

                  // Cập nhật lại trạng thái kết bạn và danh sách bạn bè
                  await Promise.all([
                    dispatch(checkFriendshipStatus(id)),
                    dispatch(getFriendList())
                  ]);
                } else {
                  Alert.alert('Lỗi', 'Không thể huỷ kết bạn');
                }
              } catch (error) {
                console.error('Error cancelling friendship:', error);
                Alert.alert(
                  'Lỗi',
                  error?.message || 'Có lỗi xảy ra khi huỷ kết bạn'
                );
              } finally {
                // Tắt loading
                setIsSending(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleCancelFriendship:', error);
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
    const pendingRequest = receivedRequests?.data?.find(request => request.profileId === id);
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
                  <Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />
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
                  <Ionicons name="close-outline" size={20} color="#000" />
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

    // console.log('Current friendshipStatus:', friendshipStatus); // Debug log

    // Use reduxFriendshipStatus instead of local state
    // Trong phần renderFriendshipButton, thay đổi cách gọi handleCancelFriendship
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
            backgroundColor="#f0f0f0"
            borderRadius={15}
            padding={7}
            onPress={handleCancelFriendship} // Không cần truyền friendshipId nữa
            disabled={isSending}
          >
            <XStack alignItems="center" space={5} justifyContent="center">
              {isSending ? (
                <Spinner size="small" color="#FF3B30" />
              ) : (
                <Ionicons name="person-remove-outline" size={20} color="#FF3B30" />
              )}
              <Text color="#FF3B30">
                {isSending ? "Đang huỷ..." : "Huỷ kết bạn"}
              </Text>
            </XStack>
          </Button>
        </XStack>
      );
    }

    // Sửa lại check dùng profileId thay vì id
    const hasSentRequest = sentRequests?.data?.some(request => request.profileId === id);

    if (hasSentRequest) {
      return (
        <XStack space={10} flex={1}>
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
          <Button
            flex={1}
            backgroundColor="#f0f0f0"
            borderRadius={15}
            padding={7}
            onPress={handleCancelRequest}
            disabled={isSending}
          >
            <XStack alignItems="center" space={5} justifyContent="center">
              {isSending ? (
                <Spinner size="small" color="#FF3B30" />
              ) : (
                <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />
              )}
              <Text color="#FF3B30">
                {isSending ? "Đang hủy..." : "Huỷ lời mời"}
              </Text>
            </XStack>
          </Button>
        </XStack>
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

      <View style={{ height: 200, backgroundColor: '#E94057', }} >

      </View>


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

  // console.log(sentRequests, 'Sent Requests');

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
          height: 200,
        }}
      >
        <ImageBackground
          source={{ uri: 'https://res.cloudinary.com/dubwmognz/image/upload/v1747834144/chat-images/photo-1747834136025_6edcab02.jpg?dl=photo-1747834136025.jpg' }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        >
        </ImageBackground>

      </View>

      {/* Profile Info Section */}
      <YStack marginTop={-50} paddingHorizontal={20}>
        {/* Avatar */}
        <Avatar circular size={100} borderWidth={4} borderColor="white">
          {info?.avatar && info.avatar.trim() !== '' ? (
            <Avatar.Image source={{ uri: info.avatar }} />
          ) : (
            <Avatar.Fallback>
              <DefaultAvatar name={info?.name} size={100} />
            </Avatar.Fallback>
          )}
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
          {info?.gender && (
            <XStack space={10} alignItems="center">
              <Ionicons name="transgender-outline" size={20} color="#666" />
              <Text>{info.gender === "M" ? "Nam" : "Nữ"}</Text>
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
              onPress={() => router.push('setting/update/updateProfile')}
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
