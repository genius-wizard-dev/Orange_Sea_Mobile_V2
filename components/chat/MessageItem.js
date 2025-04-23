import { XStack, YStack, Text, Image } from 'tamagui';
import React from 'react';
import { formatTime } from '../../utils/time';
import { ActivityIndicator } from 'react-native';

const MessageItem = ({ msg, isMyMessage }) => (
    <XStack
        justifyContent={isMyMessage ? 'flex-end' : 'flex-start'}
        paddingHorizontal={10}
        marginVertical={5}
        width="100%"
        paddingBottom={10}
    >
        {!isMyMessage && msg.sender && (
            <Image
                source={{ uri: msg.sender.avatarUrl || 'https://cebcu.com/wp-content/uploads/2024/01/anh-gai-xinh-cute-de-thuong-het-ca-nuoc-cham-27.webp' }}
                width={30}
                height={30}
                borderRadius={15}
                marginRight={8}
            />
        )}
        <YStack
            backgroundColor={isMyMessage ? '#0084ff' : '#e4e6eb'}
            padding={10}
            borderRadius={15}
            maxWidth="70%"
        >
            {!isMyMessage && msg.sender && (
                <Text color="#65676b" fontSize={12} marginBottom={4}>{msg.sender.name}</Text>
            )}
            {msg.isRecalled ? (
                <Text color={isMyMessage ? 'white' : '#65676b'} fontStyle="italic">Tin nhắn đã thu hồi</Text>
            ) : (
                <>
                    {msg.type === 'TEXT' && (
                        <XStack alignItems="center" space="$2">
                            <Text color={isMyMessage ? 'white' : 'black'}>{msg.message}</Text>
                            {msg.isPending && (
                                <ActivityIndicator size="small" color={isMyMessage ? 'white' : '#65676b'} />
                            )}
                        </XStack>
                    )}
                    {msg.imageUrl && (
                        <Image source={{ uri: msg.imageUrl }} width={200} height={200} resizeMode="contain" />
                    )}
                </>
            )}
            <Text fontSize={12} color={isMyMessage ? '#e4e6eb' : '#65676b'} textAlign="right" marginTop={4}>
                {formatTime(msg.createdAt)}
            </Text>
        </YStack>
    </XStack>
);

export default MessageItem;
