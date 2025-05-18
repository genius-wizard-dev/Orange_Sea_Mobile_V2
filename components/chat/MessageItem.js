import { XStack, YStack, Text, Image, Button, Adapt } from 'tamagui';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import VideoPlayer from 'react-native-video';
// import { Video } from 'expo-av';
import { formatTime } from '../../utils/time';
import { ActivityIndicator, Pressable, Alert, View, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { recallMessage, deleteMessageThunk } from '../../redux/thunks/chat';
import MessageOptionsPopover from './MessageOptionsPopover';
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons';
import { Popover } from '@tamagui/popover';
import socketService from '../../service/socket.service';
import { deleteMessage } from '../../redux/slices/chatSlice';

const MessageItem = ({ msg, isMyMessage, showAvatar }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const pressTimeoutRef = useRef(null);
    const dispatch = useDispatch();
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);


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
                const result = await dispatch(recallMessage(msg.id)).unwrap();
                // Truy cập trực tiếp vào dữ liệu trả về từ API
                if (result?.statusCode === 200) {
                    // Lấy messageId từ data của response
                    const messageId = result.data.messageId;
                    if (messageId) {
                        socketService.emitRecallMessage(messageId);
                        setIsOpen(false);
                    } else {
                        console.error('Không tìm thấy messageId trong phản hồi API');
                        alert('Có lỗi xảy ra khi thu hồi tin nhắn');
                    }
                } else {
                    alert(result?.message || 'Có lỗi xảy ra khi thu hồi tin nhắn');
                }
            } catch (error) {
                console.error('Lỗi khi thu hồi tin nhắn:', error);
                alert(error?.message || 'Có lỗi xảy ra khi thu hồi tin nhắn');
            }
        }
    };

    const handleDelete = useCallback(async () => {
        if (msg.id) {
            try {
                const result = await dispatch(deleteMessageThunk(msg.id)).unwrap();
                console.log('Delete API result:', result);
                
                // Truy cập trực tiếp vào dữ liệu trả về từ API
                if (result?.statusCode === 200) {
                    // Lấy messageId từ data của response
                    const messageId = result.data.messageId || msg.id;
                    
                    if (messageId) {
                        console.log('Gửi socket event xóa tin nhắn với ID:', messageId);
                        socketService.emitDeleteMessage(messageId);
                        setIsOpen(false);
                        
                        // Cập nhật UI trực tiếp sử dụng action deleteMessage
                        console.log('Xóa tin nhắn khỏi UI trực tiếp:', messageId);
                        dispatch(deleteMessage(messageId));
                    } else {
                        console.error('Không tìm thấy messageId trong phản hồi API');
                        alert('Có lỗi xảy ra khi xóa tin nhắn');
                    }
                } else {
                    alert(result?.message || 'Có lỗi xảy ra khi xóa tin nhắn');
                }
            } catch (error) {
                console.error('Lỗi khi xoá tin nhắn:', error);
                alert(error?.message || 'Có lỗi xảy ra khi xóa tin nhắn');
            }
            handleClose();
        }
    }, [msg.id, dispatch]);

    const handleVideoPress = useCallback(() => {
        if (!msg.imageUrl) {
            Alert.alert("Lỗi", "Không thể phát video này");
            return;
        }

        // Đảo ngược trạng thái phát video
        setIsVideoPlaying(prevState => !prevState);
    }, [msg.imageUrl]);

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
                        <XStack alignItems="flex-start" space={isMyMessage ? 35 : 10} >
                            {!isMyMessage && showAvatar && msg.sender && (
                                <Image
                                    source={{ uri: msg.sender.avatar || 'https://cebcu.com/wp-content/uploads/2024/01/anh-gai-xinh-cute-de-thuong-het-ca-nuoc-cham-27.webp' }}
                                    width={30}
                                    height={30}
                                    borderRadius={13}
                                    marginTop={5}
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
                                        {msg.type === 'IMAGE' && msg.imageUrl && (
                                            <YStack
                                                width={200}
                                                height={200}
                                                borderRadius={10}
                                                overflow="hidden"
                                                backgroundColor="#000" // fallback nếu ảnh chưa load
                                            >
                                                <Image
                                                    source={{ uri: msg.imageUrl }}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                    }}
                                                    resizeMode="cover"
                                                />
                                                {msg.isPending && (
                                                    <YStack
                                                        position="absolute"
                                                        top={0}
                                                        left={0}
                                                        right={0}
                                                        bottom={0}
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        backgroundColor="rgba(0,0,0,0.2)"
                                                    >
                                                        <ActivityIndicator size="large" color={isMyMessage ? 'white' : '#FF7A1E'} />
                                                    </YStack>
                                                )}
                                            </YStack>
                                        )}


                                        {msg.type === 'VIDEO' && msg.imageUrl && (

                                            <TouchableOpacity onPress={handleVideoPress}>
                                                <YStack
                                                    width={200}
                                                    height={200}
                                                    borderRadius={10}
                                                    overflow="hidden"
                                                    backgroundColor="#000"
                                                >
                                                    {isVideoPlaying ? (
                                                        // <Video
                                                        //     source={{ uri: msg.imageUrl }}
                                                        //     style={{ width: '100%', height: '100%' }}
                                                        //     useNativeControls
                                                        //     resizeMode="contain"
                                                        //     shouldPlay
                                                        //     onPlaybackStatusUpdate={(status) => {
                                                        //         if (status.didJustFinish) {
                                                        //             setIsVideoPlaying(false);
                                                        //         }
                                                        //     }}
                                                        // />
                                                        <>
                                                        <Text>VIDEO</Text>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Image
                                                                source={{ uri: msg.thumbnailUrl || msg.imageUrl }}
                                                                style={{ width: '100%', height: '100%' }}
                                                                resizeMode="cover"
                                                            />
                                                            <YStack
                                                                position="absolute"
                                                                top={0}
                                                                left={0}
                                                                right={0}
                                                                bottom={0}
                                                                justifyContent="center"
                                                                alignItems="center"
                                                            >
                                                                <XStack
                                                                    backgroundColor="rgba(0,0,0,0.4)"
                                                                    borderRadius={30}
                                                                    width={60}
                                                                    height={60}
                                                                    justifyContent="center"
                                                                    alignItems="center"
                                                                >
                                                                    <Ionicons name="play" size={30} color="white" />
                                                                </XStack>
                                                            </YStack>
                                                        </>
                                                    )}

                                                    {msg.isPending && (
                                                        <YStack
                                                            position="absolute"
                                                            top={0}
                                                            left={0}
                                                            right={0}
                                                            bottom={0}
                                                            justifyContent="center"
                                                            alignItems="center"
                                                            backgroundColor="rgba(0,0,0,0.2)"
                                                        >
                                                            <ActivityIndicator size="large" color={isMyMessage ? 'white' : '#FF7A1E'} />
                                                        </YStack>
                                                    )}
                                                </YStack>
                                            </TouchableOpacity>

                                        )}

                                    </>
                                )}
                                <Text
                                    fontSize={12}
                                    color={isMyMessage ? '#e4e6eb' : '#65676b'}
                                    textAlign="right"
                                    marginTop={4}
                                    backgroundColor={isMyMessage ? '#00000000' : '#00000000'}
                                    alignSelf="flex-end"
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
