import React from 'react';
import { View, Text, XStack, YStack, Image } from 'tamagui';

const fakeChatData = [
  {
    id: '1',
    name: 'Alice Johnson',
    imageAvatar: 'https://i.pravatar.cc/150?img=1',
    timeNearest: '2:30 PM',
    messages: [{ text: 'Hello, how are you?' }],
  },
  {
    id: '2',
    name: 'Bob Smith',
    imageAvatar: 'https://i.pravatar.cc/150?img=2',
    timeNearest: '1:10 PM',
    messages: [{ text: 'Just checking in, let me know!' }],
  },
  {
    id: '3',
    name: 'Charlie Brown',
    imageAvatar: 'https://i.pravatar.cc/150?img=3',
    timeNearest: '12:00 PM',
    messages: [{ text: 'Are we still on for tomorrow?' }],
  },
];

const Chat: React.FC = () => {
  return (
    <YStack
      flex={1}
      bg="white"
      width="100%"
      paddingHorizontal={20}
      paddingTop={40}
      paddingBottom={85}
      space="$3"
    >
      {fakeChatData.map((item) => (
        <XStack
          key={item.id}
          space="$3"
          paddingVertical={10}
          borderBottomWidth={1}
          borderColor="$gray5"
          alignItems="center"
        >
          <Image
            source={{ uri: item.imageAvatar }}
            width={50}
            height={50}
            borderRadius={25}
          />
          <YStack flex={1}>
            <Text fontSize={16} fontWeight="700">
              {item.name}
            </Text>
            <Text fontSize={14} color="$gray10">
              {item.messages[0].text.length > 25
                ? item.messages[0].text.substring(0, 25) + '...'
                : item.messages[0].text}
            </Text>
          </YStack>
          <Text fontSize={12} color="$gray9">
            {item.timeNearest}
          </Text>
        </XStack>
      ))}
    </YStack>
  );
};

export default Chat;
