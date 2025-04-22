import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, XStack, YStack, Image, Spinner } from 'tamagui';
import { useDispatch, useSelector } from 'react-redux';
import { getListGroup } from '../../redux/thunks/group';

const Chat = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { groups, loading } = useSelector((state) => state.group);
  const { profile } = useSelector((state) => state.profile);

  useEffect(() => {
    dispatch(getListGroup());
  }, [dispatch]);

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
          const otherParticipant = group.isGroup ? null :
            group.participants.find(p => p.role === 'MEMBER')?.user;

          const displayName = group.isGroup ?
            group.name :
            otherParticipant?.name || 'Unknown User';

          const avatar = group.isGroup ?
            'https://i.pravatar.cc/150?img=1' :
            otherParticipant?.avatar;

            console.log(group.messages[0])

          return (
            <XStack
              key={group.id}
              space="$3"
              paddingVertical={10}
              borderBottomWidth={1}
              borderColor="$gray5"
              alignItems="center"
              pressStyle={{ opacity: 0.8 }}
              onPress={() => router.push({
                pathname: '/chat/chatDetail',
                params: {
                  groupId: group.id,
                  profileId: otherParticipant.id,
                  goBack: '/chat'
                }
              })}
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
                    {profile.id===group.messages[0]?.senderId ? "Bạn: " : ""}
                  {group.messages.length > 0 ? group.messages[0].content || "No message" :"?"
                  }
                </Text>
              </YStack>
              <Text fontSize={12} color="$gray9">
                {new Date(group.messages[0].updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
