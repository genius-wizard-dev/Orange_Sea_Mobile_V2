import React, { useEffect, useState } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { View, Text, XStack, YStack, Image, Spinner, ScrollView } from 'tamagui';
import { StyleSheet } from 'react-native'; // Thêm StyleSheet từ react-native
import { useDispatch, useSelector } from 'react-redux';
import { getListGroup, getGroupDetail } from '../../redux/thunks/group';
import apiService from '../../service/api.service';
import { ENDPOINTS } from '../../service/api.endpoint';
import socketService from '../../service/socket.service';
import { setUnreadCounts, updateUnreadCounts, updateLastMessage, updateChatNotification, updateGroup, statusUpdated } from '../../redux/slices/chatSlice';
import { updateGroupMessages } from '../../redux/slices/groupSlice';
import { formatTime, displayTime } from '../../utils/time';
import GroupAvatar from '../../components/group/GroupAvatar';
import { useRoute } from '@react-navigation/native';
import ChatItemSkeleton from '../../components/loading/ChatItemSkeleton';

const Chat = () => {
  const router = useRouter();
  const route = useRoute();
  const dispatch = useDispatch();
  const { groups, loading, groupDetails } = useSelector((state) => state.group);
  const { profile } = useSelector((state) => state.profile);
  const unreadCounts = useSelector(state => state.chat.unreadCounts);
  const lastMessages = useSelector(state => state.chat.lastMessages);
  const userStatuses = useSelector(state => state.chat.userStatuses);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Khi màn hình được focus, fetch dữ liệu mới
      dispatch(getListGroup());
    });

    return unsubscribe;
  }, [navigation, dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const groupResult = await dispatch(getListGroup()).unwrap();

      if (Array.isArray(groupResult)) {

        const loadDetailsPromises = groupResult.map(async (group) => {
          if (!group || !group.id) return;
          try {
            await dispatch(getGroupDetail(group.id));
          } catch (error) {
            console.log(`Không thể lấy chi tiết nhóm ${group.id}, có thể nhóm đã bị xóa`);
          }
        });

        const nonGroupChats = groupResult.filter(group => !group.isGroup);
        // console.log('Non group chats:', JSON.stringify(nonGroupChats, null, 2));

        nonGroupChats.forEach(group => {
          if (!group || !group.id) return;

          const groupDetail = groupDetails[group.id];

          // Nếu là chat cá nhân, lấy thông tin trạng thái người dùng
          if (!group.isGroup && groupDetail?.participants) {
            const otherParticipant = groupDetail.participants.find(
              p => p?.userId !== profile?.id
            );

            // console.log("otherParticipant ",otherParticipant)

            // Nếu có người tham gia khác, emit trạng thái người dùng của họ
            if (otherParticipant) {
              const userStatus = userStatuses[otherParticipant.userId];

              // console.log("userStatus ", userStatus)

              if (userStatus) {
                // Emit trạng thái người dùng cập nhật vào server
                socketService.getSocket()?.emit('userStatusUpdate', {
                  profileId: otherParticipant.userId,
                  isOnline: userStatus.isOnline,
                  isActive: userStatus.isActive,
                  groupId: group.id
                });
              }


              dispatch(statusUpdated({
                profileId: otherParticipant.userId,
                isOnline: userStatus?.isOnline || false, // Cung cấp mặc định nếu không có trạng thái
                isActive: userStatus?.isActive || false,
              }));

            }
          }
        });

        // const loadDetailsPromises = nonGroupChats.map(async (group) => {
        //   if (!group || !group.id) return;
        //   try {
        //     await dispatch(getGroupDetail(group.id));
        //   } catch (error) {
        //     console.log(`Không thể lấy chi tiết nhóm ${group.id}, có thể nhóm đã bị xóa`);
        //   }
        // });

        await Promise.all(loadDetailsPromises);
        setIsLoading(false);

      } else {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (profile?.id) {
      // Setup socket listeners và cleanup khi unmount
      const cleanup = socketService.setupCommonListeners(profile.id, dispatch);
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [profile?.id, dispatch]);


  if (loading && !isLoading) {
    return (
      <YStack
        flex={1}
        height="100%"
        bg="white"
        width="100%"
        paddingHorizontal={20}
        paddingBottom={55}
        paddingTop={20}
        space="$3"
      >
        {Array.from({ length: 7 }).map((_, index) => (
          <ChatItemSkeleton key={`skeleton-${index}`} />
        ))}
      </YStack>
    );
  }

  const renderGroup = (group) => {
    if (!group) return null; // Thêm check này

    // console.log(`Rendering group ${group.id}: ${group.name || 'Unnamed'}`);
    // console.log(`Has groupDetail: ${!!groupDetails[group.id]}`);

    const groupDetail = groupDetails[group.id];

    // if (!groupDetail && group.id) {
    //   console.log(`Missing groupDetail for group ID: ${group.id}`);
    // }

    // Lấy lastMessage từ nhiều nguồn và ưu tiên theo thứ tự
    const lastMessage = group.lastMessage;

    // Kiểm tra isRecalled từ messages trong groupDetail nếu có
    const messageInDetail = groupDetail?.messages?.find(m => m.id === lastMessage?.id);
    const isRecalled = messageInDetail?.isRecalled || lastMessage?.isRecalled || false;

    let lastMessageContent = "Không có tin nhắn";

    if (isRecalled) {
      lastMessageContent = "Tin nhắn đã thu hồi";
    } else if (lastMessage) {
      switch (lastMessage.type) {
        case "IMAGE":
          lastMessageContent = "[Hình ảnh]";
          break;
        case "VIDEO":
          lastMessageContent = "[Video]";
          break;
        default:
          if (lastMessage.content) {
            const content = lastMessage.content.replace(/\n/g, ' ');
            lastMessageContent = content.length > 16 ? content.slice(0, 16) + '...' : content;
          }
          break;
      }
    }


    // console.log("profile ", profile)
    const otherParticipant = group.isGroup === false && group?.participants?.find(
      p => p?.profileId !== profile?.id
    );

    // Lấy userId từ participant
    const userStatus = otherParticipant ? userStatuses[otherParticipant.userId] : null;



    const getStatusColor = (status) => {
      if (!status) return '#65676b';               // offline (không có status)
      if (status.isOnline && status.isActive) return '#31a24c'; // online + active
      if (status.isOnline) return '#FFB800';       // online (nhưng inactive)
      return '#65676b';                            // offline
    };


    const limitText = (text, maxLength) => {
      if (!text) return '';
      return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };

    // console.log("otherParticipant ", otherParticipant)

    const displayName = group.isGroup
      ? limitText(group.name || 'Nhóm chat', 25)
      : limitText(otherParticipant?.name || 'Loading...', 25);



    const sender = lastMessage?.sender?.name || '';
    const prefix = lastMessage?.senderId === profile?.id ? "Bạn: " : sender ? `` : "";
    const unreadCount = unreadCounts[group.id] || 0;

    // console.log("groups ", JSON.stringify(groups, null, 2));

    return (
      <XStack
        key={group.id}
        space="$3"
        marginBottom={10}
        paddingBottom={10}
        borderBottomWidth={1}
        borderColor="$gray5"
        alignItems="center"
        pressStyle={{ opacity: 0.8 }}
        onPress={() => {
          router.push({
            pathname: '/chat/chatDetail',
            params: {
              groupId: group.id,
              profileId: profile?.id,
              goBack: '/chat'
            }
          });
        }}
      >
        <View style={styles.avatarContainer}>
          <GroupAvatar group={group} size={50} />
          {group.isGroup ? "" : <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(userStatus) }
            ]}
          />
          }
        </View>
        <YStack flex={1}>
          <Text fontSize={16} fontWeight="700" marginBottom={5}>
            {displayName}
          </Text>
          <Text fontSize={14} color="$gray10">
            {prefix}{lastMessageContent}
          </Text>
        </YStack>
        <Text fontSize={12} color="$gray9">
          {lastMessage?.createdAt ? displayTime(lastMessage.createdAt) : ''}
        </Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text color="white" fontSize={12} fontWeight="bold">
              {unreadCount}
            </Text>
          </View>
        )}
      </XStack>
    );
  };

  // console.log(JSON.stringify(groups, null, 2));

  return (
    <ScrollView width="100%" height="100%" bounces={false} contentContainerStyle={{ flexGrow: 1 }}>
      <YStack
        flex={1}
        height="100%"
        bg="white"
        width="100%"
        paddingHorizontal={20}
        paddingBottom={55}
        paddingTop={20}
        space="$3"
      >
        {isLoading ? (
          // Hiển thị skeleton items khi đang tải
          Array.from({ length: 7 }).map((_, index) => (
            <ChatItemSkeleton key={`skeleton-${index}`} />
          ))
        ) : Array.isArray(groups) && groups.length > 0 ? (
          [...groups]
            .sort((a, b) => {
              const lastMessageA = lastMessages[a.id] || a.messages?.[0] || groupDetails[a.id]?.messages?.[0];
              const lastMessageB = lastMessages[b.id] || b.messages?.[0] || groupDetails[b.id]?.messages?.[0];

              const timeA = lastMessageA?.createdAt ? new Date(lastMessageA.createdAt).getTime() : 0;
              const timeB = lastMessageB?.createdAt ? new Date(lastMessageB.createdAt).getTime() : 0;

              return timeB - timeA; // Sắp xếp giảm dần (mới nhất lên đầu)
            })
            .map((group) => renderGroup(group))
        ) : (
          <Text>Không có cuộc trò chuyện nào</Text>
        )}
      </YStack>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatarContainer: {
    position: 'relative',
    width: 50,
    height: 50,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default Chat;
