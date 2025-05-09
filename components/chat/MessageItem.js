import { XStack, YStack, Text, Image, Button, Adapt } from 'tamagui';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { formatTime } from '../../utils/time';
import { ActivityIndicator, Pressable, Alert, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { recallMessage, deleteMessageThunk } from '../../redux/thunks/chat';
import MessageOptionsPopover from './MessageOptionsPopover';
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons';
import { Popover } from '@tamagui/popover';
import socketService from '../../service/socket.service';

const MessageItem = ({ msg, isMyMessage, showAvatar }) => {
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

    const handleRecallMessage = async () => {
        if (msg.id) {
            try {
                const result = await dispatch(recallMessage(msg.id));
                if (result.meta.requestStatus === 'rejected') {
                    alert(result.payload?.message || 'Có lỗi xảy ra khi thu hồi tin nhắn');
                } else {
                    socketService.emitRecallMessage(result.payload.id, result.payload.groupId);
                    setIsOpen(false);
                }
            } catch (error) {
                console.error('Lỗi khi thu hồi tin nhắn:', error);
            }
        }
    };

    const handleDelete = useCallback(async () => {
        if (msg.id) {
            try {
                const result = await dispatch(deleteMessageThunk(msg.id));
                if (result.meta.requestStatus === 'rejected') {
                    alert(result.payload?.message || 'Có lỗi xảy ra khi xoá tin nhắn');
                } else {
                    socketService.emitDeleteMessage(msg.id, msg.groupId, msg.senderId);
                    setIsOpen(false);
                    dispatch({
                        type: 'chat/messageDeleted',
                        payload: {
                            messageId: msg.id,
                            groupId: msg.groupId,
                            userId: msg.senderId
                        }
                    });
                }

            } catch (error) {
                console.error('Lỗi khi xoá tin nhắn:', error);
            }
            handleClose();
        }
    }, [msg.id, msg.groupId, msg.senderId, dispatch]);

    return (
        <MessageOptionsPopover
            isOpen={isOpen}
            onClose={handleClose}
            onRecall={handleRecallMessage}
            onDelete={handleDelete}
            isMyMessage={isMyMessage}
            isRecalled={msg.isRecalled}
            message={msg}  // Truyền msg vào MessageOptionsPopover
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
                        borderRadius={15}
                        padding={2}
                        shadowRadius={6}
                    >
                        <XStack alignItems="center" space={isMyMessage ? 35 : 10} >
                            {!isMyMessage && showAvatar && msg.sender && (
                                <Image
                                    source={{ uri: msg.sender.avatar || 'https://cebcu.com/wp-content/uploads/2024/01/anh-gai-xinh-cute-de-thuong-het-ca-nuoc-cham-27.webp' }}
                                    width={30}
                                    height={30}
                                    borderRadius={15}
                                />
                            )}
                            {!isMyMessage && !showAvatar && (
                                <View style={{ width: 20 }} />
                            )}
                            <YStack
                                backgroundColor={isMyMessage ? '#d88954' : '#e4e6eb'}
                                padding={10}
                                marginTop={2}
                                borderRadius={10}
                                borderTopLeftRadius={!isMyMessage && !showAvatar ? 0 : 10}
                                maxWidth="90%"
                                width="auto"
                                elevation={1}

                            >
                                {/* {!isMyMessage && msg.sender && (
                                    <Text color="#65676b" fontSize={12} marginBottom={4}>{msg.sender.name}</Text>
                                )} */}
                                {msg.isRecalled ? (
                                    <XStack alignItems="center" >
                                        <Text
                                            color={isMyMessage ? '#cacbce' : '#949596'}
                                            fontStyle="italic"
                                            backgroundColor={isMyMessage ? '#d88954' : '#e4e6eb'}
                                        >
                                            Tin nhắn đã được thu hồi
                                        </Text>
                                    </XStack>
                                ) : (
                                    <>
                                        {msg.type === 'TEXT' && (
                                            <XStack
                                                alignItems="center"
                                                flexWrap="wrap"
                                                backgroundColor={isMyMessage ? '#d88954' : '#e4e6eb'}
                                            >
                                                <Text
                                                    color={isMyMessage ? 'white' : 'black'}
                                                    flexShrink={1}
                                                    backgroundColor={isMyMessage ? '#d88954' : '#e4e6eb'}
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
                                <Text
                                    fontSize={12}
                                    color={isMyMessage ? '#e4e6eb' : '#65676b'}
                                    textAlign="right" marginTop={4}
                                    backgroundColor={isMyMessage ? '#d88954' : '#e4e6eb'}
                                >
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
