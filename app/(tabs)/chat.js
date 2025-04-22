import React, { useEffect } from 'react';
import { View, Text, XStack, YStack, Image, Spinner } from 'tamagui';
import { useDispatch, useSelector } from 'react-redux';
import { getListGroup } from '../../redux/thunks/group';

const Chat = () => {
  const dispatch = useDispatch();
  const { groups, loading } = useSelector((state) => state.group);
  // console.log("Groups from Redux:", groups);

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
      // paddingTop={40}
      paddingBottom={85}
      space="$3"
    >
      {Array.isArray(groups) && groups.length > 0 ? (
        groups.map((group) => {
          // console.log("Mapping group:", group);
          const otherParticipant = group.isGroup ? null :
            group.participants.find(p => p.role === 'MEMBER')?.user;

          const displayName = group.isGroup ?
            group.name :
            otherParticipant?.name || 'Unknown User';

          const avatar = group.isGroup ?
            'https://i.pravatar.cc/150?img=1' :
            otherParticipant?.avatar;

          return (
            <XStack
              key={group.id}
              space="$3"
              paddingVertical={10}
              borderBottomWidth={1}
              borderColor="$gray5"
              alignItems="center"
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
                  {group.messages.length > 0 ?
                    group.messages[0].text || "No message" :
                    "No messages yet"}
                </Text>
              </YStack>
              <Text fontSize={12} color="$gray9">
                {new Date(group.updatedAt).toLocaleTimeString([],
                  { hour: '2-digit', minute: '2-digit' }
                )}
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
