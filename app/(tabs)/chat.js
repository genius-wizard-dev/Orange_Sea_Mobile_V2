import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, XStack, YStack, Image, Spinner } from 'tamagui';
import { StyleSheet } from 'react-native'; // Thêm StyleSheet từ react-native
import { useDispatch, useSelector } from 'react-redux';
import { getListGroup, getGroupDetail } from '../../redux/thunks/group';
import apiService from '../../service/api.service';
import { ENDPOINTS } from '../../service/api.endpoint';
import socketService from '../../service/socket.service';
import { setUnreadCounts, updateUnreadCounts, updateLastMessage, updateChatNotification, updateGroup } from '../../redux/slices/chatSlice';
import { updateGroupMessages } from '../../redux/slices/groupSlice';

const Chat = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { groups, loading, groupDetails } = useSelector((state) => state.group);
  const { profile } = useSelector((state) => state.profile);
  const unreadCounts = useSelector(state => state.chat.unreadCounts);
  const lastMessages = useSelector(state => state.chat.lastMessages);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchData = async () => {
      const groupResult = await dispatch(getListGroup()).unwrap();
      
      if (Array.isArray(groupResult)) {
        const nonGroupChats = groupResult.filter(group => !group.isGroup);
        console.log('Non group chats:', JSON.stringify(nonGroupChats, null, 2));

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
    const groupDetail = groupDetails[group.id];
    
    // Tìm người dùng khác trong cuộc trò chuyện
    const otherParticipant = !group.isGroup && groupDetail?.participants?.find(
      p => p?.userId !== profile?.id
    )?.user;

    // console.log('Group detail:', groupDetail);
    // console.log('Other participant:', otherParticipant);

    const displayName = group.isGroup ? 
      group.name : 
      otherParticipant?.name || 'Loading...';

    const avatar = group.isGroup ?
      'https://i.pravatar.cc/150?img=1' :
      otherParticipant?.avatar || 'https://i.pravatar.cc/150?img=1';

    const lastMessage = lastMessages[group.id] || group.messages?.[0];
    const lastMessageContent = lastMessage?.content || "Không có tin nhắn";
    const sender = lastMessage?.sender?.name || '';
    const prefix = lastMessage?.senderId === profile?.id ? "Bạn: " : sender ? `` : "";
    const unreadCount = unreadCounts[group.id] || 0;  // Đã định nghĩa ở đây

    return (
      <XStack
        key={group.id}
        space="$3"
        paddingVertical={10}
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
        <Image
          source={{ uri: avatar }}
          width={50}
          height={50}
          borderRadius={25}
        />
        <YStack flex={1}>
          <Text fontSize={16} fontWeight="700">
            {displayName}
          </Text>
          <Text fontSize={14} color="$gray10">
            {prefix}{lastMessageContent}
          </Text>
        </YStack>
        <Text fontSize={12} color="$gray9">
          {lastMessage?.createdAt ? new Date(lastMessage.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          }) : ''}
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

  return (
    <YStack
      flex={1}
      bg="white"
      width="100%"
      paddingHorizontal={20}
      paddingBottom={85}
      space="$3"
    >
      {Array.isArray(groups) && groups.length > 0 ? (
        groups.map((group) => renderGroup(group))
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
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default Chat;
