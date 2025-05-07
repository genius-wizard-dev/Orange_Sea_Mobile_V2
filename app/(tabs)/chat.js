import React, { useEffect, useState } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { View, Text, XStack, YStack, Image, Spinner } from 'tamagui';
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

const Chat = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { groups, loading, groupDetails } = useSelector((state) => state.group);
  const { profile } = useSelector((state) => state.profile);
  const unreadCounts = useSelector(state => state.chat.unreadCounts);
  const lastMessages = useSelector(state => state.chat.lastMessages);
  const userStatuses = useSelector(state => state.chat.userStatuses);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const navigation = useNavigation()
  useEffect(() => {
    const fetchData = async () => {
      const groupResult = await dispatch(getListGroup()).unwrap();

      if (Array.isArray(groupResult)) {
        const nonGroupChats = groupResult.filter(group => !group.isGroup);
        // console.log('Non group chats:', JSON.stringify(nonGroupChats, null, 2));

        nonGroupChats.forEach(group => {
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

              console.log("userStatus ", userStatus)

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



        await Promise.all(
          nonGroupChats.map(async (group) => {
            try {
              const groupDetailRes = await dispatch(getGroupDetail(group.id)).unwrap();
              // console.log('Group detail full:', JSON.stringify(groupDetailRes.data || groupDetailRes, null, 2));

              // Log thông tin user từ participants
              const participants = groupDetailRes.data?.participants || groupDetailRes.participants;
              participants?.forEach(p => {
                // console.log('Participant user:', JSON.stringify(p.user, null, 2));
              });

            } catch (error) {
              console.error('Error fetching group detail:', error);
            }
          })
        );



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


  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$orange10" />
      </YStack>
    );
  }

  const renderGroup = (group) => {
    if (!group) return null; // Thêm check này

    const groupDetail = groupDetails[group.id];

    // Lấy lastMessage từ nhiều nguồn và ưu tiên theo thứ tự
    const lastMessage = lastMessages[group.id] ||
      group.messages?.[0] ||
      groupDetail?.messages?.[0];

    // console.log('Last message sources:', {
    //   fromLastMessages: lastMessages[group.id],
    //   fromGroup: group.messages?.[0],
    //   fromGroupDetail: groupDetail?.messages?.[0],
    //   finalLastMessage: lastMessage
    // });

    // Kiểm tra isRecalled từ messages trong groupDetail nếu có
    const messageInDetail = groupDetail?.messages?.find(m => m.id === lastMessage?.id);
    const isRecalled = messageInDetail?.isRecalled || lastMessage?.isRecalled || false;

    const lastMessageContent = isRecalled
      ? "Tin nhắn đã thu hồi"
      : lastMessage?.content || "Không có tin nhắn";

    const otherParticipant = !group.isGroup && groupDetail?.participants?.find(
      p => p?.userId !== profile?.id
    );

    // Lấy userId từ participant
    const otherUserId = otherParticipant?.userId;
    const userStatus = otherParticipant ? userStatuses[otherParticipant.userId] : null;



    const getStatusColor = (status) => {
      if (!status) return '#65676b';               // offline (không có status)
      if (status.isOnline && status.isActive) return '#31a24c'; // online + active
      if (status.isOnline) return '#FFB800';       // online (nhưng inactive)
      return '#65676b';                            // offline
    };


    const displayName = group.isGroup
      ? (group.name || 'Nhóm chat')  // Thêm fallback name
      : (otherParticipant?.user?.name || 'Loading...');

    const avatar = group.isGroup ?
      'https://i.ibb.co/jvVzkvBm/bgr-default.png' :
      otherParticipant?.user?.avatar || 'https://i.ibb.co/jvVzkvBm/bgr-default.png';

    const sender = lastMessage?.sender?.name || '';
    const prefix = lastMessage?.senderId === profile?.id ? "Bạn: " : sender ? `` : "";
    const unreadCount = unreadCounts[group.id] || 0;



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
          <Text fontSize={16} fontWeight="700">
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
    <YStack
      flex={1}
      bg="white"
      width="100%"
      paddingHorizontal={20}
      paddingBottom={55}
      paddingTop={20}
      space="$3"
    >
      {Array.isArray(groups) && groups.length > 0 ? (
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
