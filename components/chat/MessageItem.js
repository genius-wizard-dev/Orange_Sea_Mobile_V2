import { XStack, YStack, Text, Image, Button, Adapt } from 'tamagui';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { formatTime } from '../../utils/time';
import { ActivityIndicator, Pressable, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { recallMessage, deleteMessageThunk } from '../../redux/thunks/chat';
import MessageOptionsPopover from './MessageOptionsPopover';
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons';
import { Popover } from '@tamagui/popover';
import socketService from '../../service/socket.service';

const MessageItem = ({ msg, isMyMessage }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const pressTimeoutRef = useRef(null);
    const dispatch = useDispatch();

    useEffect(() => {
        return () => {
            if (pressTimeoutRef.current) {
                clearTimeout(pressTimeoutRef.current);
            }
        };
    }, []);

    // Thêm effect để reset isPressed khi popover đóng
    useEffect(() => {
        if (!isOpen) {
            setIsPressed(false);
        }
    }, [isOpen]);

    const handlePress = useCallback(() => {
        if (msg.id) {
            setIsOpen(true);
        }
    }, [msg.id]);

    const handleLongPress = useCallback(() => {
        setIsPressed(true);
        handlePress();
        // Reset isPressed after a short delay
        pressTimeoutRef.current = setTimeout(() => {
            setIsPressed(false);
        }, 200);
    }, [handlePress]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleRecall = useCallback(async () => {
        if (msg.id) {
            try {
                const result = await dispatch(recallMessage(msg.id)).unwrap();
                if (result.status === 'error') {
                    Alert.alert(
                        'Lỗi thu hồi',
                        result.message || 'Không thể thu hồi tin nhắn',
                        [{ text: 'Đã hiểu', style: 'default' }]
                    );
                    return;
                }

                // Emit socket event khi thu hồi thành công
                const socket = socketService.getSocket();
                if (socket) {
                    console.log("đã gửi socket thu hòi")
                    socket.emit('recall', {
                        messageId: msg.id,
                        groupId: msg.groupId
                    });
                }
            } catch (error) {
                Alert.alert(
                    'Lỗi thu hồi',
                    error.message || 'Không thể thu hồi tin nhắn',
                    [{ text: 'Đã hiểu', style: 'default' }]
                );
            }
            handleClose();
        }
    }, [msg.id, msg.groupId, dispatch]);

    const handleDelete = useCallback(async () => {
        if (msg.id) {
            try {
                const result = await dispatch(deleteMessageThunk(msg.id)).unwrap();
                if (result.status === 'success') {
                    // Emit socket event khi xóa thành công
                    const socket = socketService.getSocket();
                    if (socket) {
                        socket.emit('delete', {
                            messageId: msg.id,
                            groupId: msg.groupId,
                            userId: msg.senderId
                        });
                    }
                }
            } catch (error) {
                Alert.alert(
                    'Lỗi xóa tin nhắn',
                    error.message || 'Không thể xóa tin nhắn',
                    [{ text: 'Đã hiểu', style: 'default' }]
                );
            }
            handleClose();
        }
    }, [msg.id, msg.groupId, msg.senderId, dispatch]);

    return (
        <MessageOptionsPopover
            isOpen={isOpen}
            onClose={handleClose}
            onRecall={handleRecall}
            onDelete={handleDelete}
            isMyMessage={isMyMessage}
            isRecalled={msg.isRecalled}
        >
            <XStack
                justifyContent={isMyMessage ? 'flex-end' : 'flex-start'}
                width="100%"
            >
                <Pressable
                    onLongPress={handleLongPress}
                    delayLongPress={200}
                    style={({ pressed }) => ({
                        transform: [{ scale: pressed || isPressed ? 1.02 : 1 }],
                        opacity: pressed || isPressed ? 0.9 : 1,
                    })}
                >
                    <YStack
                        // backgroundColor={isPressed ? 'rgba(0,0,0,0.05)' : 'transparent'}
                        borderRadius={15}
                        padding={2}
                        // shadowColor="black"
                        // shadowOffset={{ width: 0, height: 4 }}
                        // shadowOpacity={isPressed ? 0.3 : 0}
                        shadowRadius={6}
                    >
                        <XStack alignItems="center" space>
                            {!isMyMessage && msg.sender && (
                                <Image
                                    source={{ uri: msg.sender.avatarUrl || 'https://cebcu.com/wp-content/uploads/2024/01/anh-gai-xinh-cute-de-thuong-het-ca-nuoc-cham-27.webp' }}
                                    width={30}
                                    height={30}
                                    borderRadius={15}
                                />
                            )}
                            <YStack
                                backgroundColor={isMyMessage ? '#FF7A1E' : '#e4e6eb'}
                                padding={10}
                                marginTop={5}
                                borderRadius={15}
                                maxWidth="90%"
                                width="auto"
                                elevation={1}
                            >
                                {/* {!isMyMessage && msg.sender && (
                                    <Text color="#65676b" fontSize={12} marginBottom={4}>{msg.sender.name}</Text>
                                )} */}
                                {msg.isRecalled ? (
                                    <XStack alignItems="center">
                                        <Text
                                            color={isMyMessage ? 'white' : '#65676b'}
                                            fontStyle="italic"
                                        // textAlign={isMyMessage ? 'right' : 'left'}
                                        >
                                            Tin nhắn đã thu hồi
                                        </Text>
                                    </XStack>
                                ) : (
                                    <>
                                        {msg.type === 'TEXT' && (
                                            <XStack
                                                alignItems="center"
                                                space="$2"
                                                flexWrap="wrap"
                                            >
                                                <Text
                                                    color={isMyMessage ? 'white' : 'black'}
                                                    flexShrink={1}
                                                >
                                                    {msg.message}
                                                </Text>
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
                    </YStack>
                </Pressable>
            </XStack>
        </MessageOptionsPopover>
    );
};

export default React.memo(MessageItem);
