import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, XStack, YStack, Image, Spinner } from 'tamagui';
import { useDispatch, useSelector } from 'react-redux';
import { getListGroup, getGroupDetail } from '../../redux/thunks/group';
import apiService from '../../service/api.service';
import { ENDPOINTS } from '../../service/api.endpoint';
import socketService from '../../service/socket.service';
import { setUnreadCounts, updateUnreadCounts, updateLastMessage, updateChatNotification, updateGroup } from '../../redux/slices/chatSlice';

const Chat = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { groups, loading, groupDetails } = useSelector((state) => state.group);
  const { profile } = useSelector((state) => state.profile);

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
    const socket = socketService.getSocket();
    if (socket && profile?.id) {
        // Đăng ký socket với profile
        socket.emit('register', { profileId: profile.id },(response) => {
            console.log('Socket registration respons CHAT:', response);
        });

        // Lấy số tin nhắn chưa đọc
        socket.emit('getUnreadCounts', { profileId: profile.id });

        // Lắng nghe số tin nhắn chưa đọc ban đầu
        socket.on('initialUnreadCounts', (unreadCounts) => {
            dispatch(setUnreadCounts(unreadCounts));
        });

        // Lắng nghe cập nhật số tin nhắn chưa đọc
        socket.on('unreadCountUpdated', (updates) => {
            dispatch(updateUnreadCounts(updates));
        });

        // Lắng nghe tin nhắn mới để cập nhật preview
        socket.on('newMessage', (message) => {
            dispatch(updateLastMessage(message));
        });

        // Lắng nghe thông báo tin nhắn mới
        socket.on('newNotification', (notification) => {
            if (notification.type === 'NEW_MESSAGE') {
                // Cập nhật UI thông báo có tin nhắn mới
                dispatch(updateChatNotification(notification));
            }
        });

        return () => {
            socket.off('initialUnreadCounts');
            socket.off('unreadCountUpdated');
            socket.off('newMessage');
            socket.off('newNotification');
        };
    }
}, [profile?.id]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket && profile?.id) {
        // Đăng ký socket với profile
        socket.emit('register', { profileId: profile.id });

        // Lắng nghe tin nhắn mới để cập nhật preview
        socket.on('newMessage', (message) => {
            console.log('New message in chat list:', message);
            // Cập nhật last message của group
            const updatedGroup = groups.find(g => g.id === message.groupId);
            if (updatedGroup) {
                updatedGroup.messages = [
                    {
                        content: message.content,
                        senderId: message.senderId,
                        updatedAt: message.createdAt
                    },
                    ...updatedGroup.messages
                ];
                dispatch(updateGroup(updatedGroup));
            }
        });

        return () => {
            socket.off('newMessage');
        };
    }
}, [profile?.id, groups]);

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$orange10" />
      </YStack>
    );
  }

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
        groups.map((group) => {
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

          const lastMessage = group.messages?.[0];
          const lastMessageContent = lastMessage?.content || "Không có tin nhắn";
          const lastMessageTime = lastMessage?.updatedAt ?
            new Date(lastMessage.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

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
                  {lastMessage && profile?.id === lastMessage?.senderId ? "Bạn: " : ""}
                  {lastMessageContent}
                </Text>
              </YStack>
              <Text fontSize={12} color="$gray9">
                {lastMessageTime}
              </Text>
            </XStack>
          );
        })
      ) : (
        <Text>Không có cuộc trò chuyện nào</Text>
      )}
    </YStack>
  );
};

export default Chat;
