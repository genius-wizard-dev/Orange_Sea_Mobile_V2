import { XStack, YStack, Text, Image, Button, Adapt } from 'tamagui';
import React, { useState, useCallback, useEffect, useRef } from 'react';
// import VideoPlayer from 'react-native-video';
import { Video } from 'expo-av';
import { formatTime } from '../../utils/time';
import { ActivityIndicator, Pressable, Alert, View, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { recallMessage, deleteMessageThunk } from '../../redux/thunks/chat';
import MessageOptionsPopover from './MessageOptionsPopover';
import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons';
import { Popover } from '@tamagui/popover';
import socketService from '../../service/socket.service';
import { deleteMessage, setEditingMessage } from '../../redux/slices/chatSlice';
import DefaultAvatar from './DefaultAvatar';
import ImageViewer from './ImageViewer';

import { useRouter } from 'expo-router';

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const MessageItem = ({ msg, isMyMessage, showAvatar }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const pressTimeoutRef = useRef(null);
    const dispatch = useDispatch();
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [isDownloadingFile, setIsDownloadingFile] = useState(false);

    const router = useRouter();

    // console.log('\n=== MESSAGE ITEM RENDER DEBUG ===');
    // console.log('Message ID:', msg.id);
    // console.log('Message type:', msg.type);
    // console.log('Full msg object keys:', Object.keys(msg));
    // console.log('msg.message:', `"${msg.message}"`, typeof msg.message);
    // console.log('msg.content:', `"${msg.content}"`, typeof msg.content);
    // console.log('Is message empty?', !msg.message);
    // console.log('Message length:', msg.message?.length || 0);



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
            console.log("Đang xóa tin nhắn có ID:", msg.id);
            try {
                const result = await dispatch(deleteMessageThunk(msg.id)).unwrap();
                console.log('Delete API result:', result);

                if (result?.statusCode === 200) {
                    // Lưu ID gốc (ID thực của tin nhắn hiện tại)
                    const originalMessageId = msg.id;

                    // ID từ API (chỉ cho socket event)
                    const apiMessageId = result.data.messageId;

                    console.log('Gửi socket event với ID từ API:', apiMessageId);
                    socketService.emitDeleteMessage(apiMessageId);

                    // QUAN TRỌNG: Xóa tin nhắn khỏi UI dùng ID GỐC
                    console.log('Xóa tin nhắn khỏi UI với ID gốc:', originalMessageId);
                    dispatch(deleteMessage(originalMessageId));

                    setIsOpen(false);
                } else {
                    alert(result?.message || 'Có lỗi xảy ra khi xóa tin nhắn');
                }
            } catch (error) {
                console.error('Lỗi khi xoá tin nhắn:', error);
                alert(error?.message || 'Có lỗi xảy ra khi xóa tin nhắn');
            }
            handleClose();
        }
    }, [msg.id, dispatch, handleClose]);




    const handleEdit = useCallback(() => {
        console.log('Bắt đầu chỉnh sửa tin nhắn:', msg.id, 'Nội dung:', msg.message);

        // Tạo đối tượng đơn giản chỉ với thông tin cần thiết để chỉnh sửa
        const editData = {
            id: msg.id,
            message: msg.message || msg.content || '', // Đảm bảo message không bị null
            groupId: msg.groupId
        };

        // Đặt tin nhắn này vào state để chỉnh sửa
        dispatch(setEditingMessage(editData));

        // Đóng popover
        setIsOpen(false);
    }, [msg, dispatch]);







    const handleVideoPress = useCallback(() => {
        if (!msg.imageUrl) {
            Alert.alert("Lỗi", "Không thể phát video này");
            return;
        }

        // Đảo ngược trạng thái phát video
        setIsVideoPlaying(prevState => !prevState);
    }, [msg.imageUrl]);



    const handleImagePress = useCallback(() => {
        if (msg.imageUrl && msg.type === 'IMAGE') {
            setShowImageViewer(true);
        }
    }, [msg.imageUrl, msg.type]);

    const handleCloseImageViewer = useCallback(() => {
        setShowImageViewer(false);
    }, []);


    const downloadFile = async () => {
        setIsDownloadingFile(true);

        try {
            // Xin quyền truy cập storage
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần quyền truy cập bộ nhớ để tải file');
                return;
            }

            // Tạo thư mục OrangeSea trong Downloads nếu chưa có
            const downloadDir = `${FileSystem.documentDirectory}Download/OrangeSea/`;
            const dirInfo = await FileSystem.getInfoAsync(downloadDir);

            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
                console.log('Đã tạo thư mục:', downloadDir);
            }

            // Decode fileName để lấy tên file thực
            const decodedFileName = decodeURIComponent(msg.fileName || `file_${Date.now()}.bin`);
            const fileExtension = decodedFileName.split('.').pop();
            const baseName = decodedFileName.replace(`.${fileExtension}`, '');
            const uniqueFileName = `${baseName}_${Date.now()}.${fileExtension}`;
            const fileUri = `${downloadDir}${uniqueFileName}`;

            console.log('File info:', {
                originalFileName: msg.fileName,
                decodedFileName: decodedFileName,
                downloadUrl: msg.imageUrl,
                saveToPath: fileUri
            });

            // Tải file với timeout và retry
            const downloadWithRetry = async (retries = 3) => {
                for (let i = 0; i < retries; i++) {
                    try {
                        console.log(`Đang tải file, lần thử ${i + 1}/${retries}...`);

                        const downloadResult = await Promise.race([
                            FileSystem.downloadAsync(msg.imageUrl, fileUri, {
                                headers: {
                                    'User-Agent': 'OrangeSeaMobile/1.0',
                                    'Accept': '*/*'
                                }
                            }),
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout')), 30000)
                            )
                        ]);

                        console.log(`Download result status: ${downloadResult.status}`);
                        return downloadResult;
                    } catch (error) {
                        console.log(`Lần thử ${i + 1} thất bại:`, error.message);
                        if (i === retries - 1) throw error;

                        // Đợi 2 giây trước khi thử lại
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            };

            const downloadResult = await downloadWithRetry();

            if (downloadResult.status === 200) {
                // Kiểm tra file đã được tải thành công
                const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
                console.log('File info after download:', fileInfo);

                if (fileInfo.exists && fileInfo.size > 0) {
                    // Lưu vào thư viện media để có thể truy cập từ file manager
                    try {
                        await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
                        console.log('Đã lưu vào media library');
                    } catch (mediaError) {
                        console.log('Không thể lưu vào media library:', mediaError);
                        // Vẫn thành công nếu file đã được lưu vào Documents
                    }

                    Alert.alert(
                        'Thành công',
                        `File "${decodedFileName}" đã được tải xuống thành công!\n\nKích thước: ${Math.round(fileInfo.size / 1024)} KB\nĐường dẫn: Download/OrangeSea/`,
                        [{ text: 'OK' }]
                    );

                    console.log('File đã được lưu tại:', downloadResult.uri);
                } else {
                    throw new Error('File tải về bị lỗi hoặc rỗng');
                }
            } else {
                throw new Error(`HTTP ${downloadResult.status}: Không thể tải file`);
            }

        } catch (error) {
            console.error('Lỗi khi tải file:', error);

            // Xử lý lỗi 401 - Unauthorized
            if (error.message.includes('401')) {
                Alert.alert(
                    'Lỗi xác thực',
                    'URL file có thể đã hết hạn hoặc yêu cầu xác thực. Bạn có muốn thử mở file trong trình duyệt không?',
                    [
                        {
                            text: 'Mở trong trình duyệt',
                            onPress: () => {
                                // Mở URL trong trình duyệt
                                import('expo-linking').then(({ default: Linking }) => {
                                    Linking.openURL(msg.imageUrl);
                                });
                            }
                        },
                        { text: 'Hủy', style: 'cancel' }
                    ]
                );
            } else if (error.message.includes('Unable to resolve host') ||
                error.message.includes('No address associated with hostname')) {
                Alert.alert(
                    'Lỗi mạng',
                    'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.',
                    [
                        { text: 'Thử lại', onPress: downloadFile },
                        { text: 'Hủy', style: 'cancel' }
                    ]
                );
            } else if (error.message === 'Timeout') {
                Alert.alert(
                    'Timeout',
                    'Tải file quá lâu. Vui lòng thử lại.',
                    [
                        { text: 'Thử lại', onPress: downloadFile },
                        { text: 'Hủy', style: 'cancel' }
                    ]
                );
            } else {
                Alert.alert('Lỗi', `Không thể tải file: ${error.message}`);
            }
        } finally {
            setIsDownloadingFile(false);
        }
    };



    const handleDownloadFile = async () => {
        if (!msg.imageUrl) {
            Alert.alert('Lỗi', 'Không tìm thấy đường dẫn file');
            return;
        }

        const decodedFileName = decodeURIComponent(msg.fileName || 'tài liệu');

        Alert.alert(
            'Tùy chọn file',
            `File: "${decodedFileName}"`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Mở trong trình duyệt',
                    onPress: () => {
                        import('expo-linking').then(({ default: Linking }) => {
                            Linking.openURL(msg.imageUrl);
                        });
                    }
                },
                {
                    text: 'Tải xuống',
                    onPress: () => downloadFile()
                }
            ]
        );
    };

    const messageContent = msg.message || msg.content || '';
    const updatedAt = msg.updatedAt || new Date().toISOString();

    const handleForwardMessage = useCallback(() => {
        handleClose(); // Đóng popup

        // Chuẩn bị dữ liệu cần thiết
        const messageData = {
            messageId: msg.id,
            messageContent: msg.message || msg.content || '',
            messageType: msg.type || 'TEXT',
            senderId: msg.sender?.id || msg.senderId,
            imageUrl: msg.imageUrl || msg.url || msg.fileUrl || msg.image || null,
            fileName: msg.fileName || null,
            fileSize: msg.fileSize || null,
        };

        // Điều hướng đến trang chuyển tiếp và truyền dữ liệu
        router.push({
            pathname: '/chat/forwardMessage',
            params: messageData
        });
    }, [msg, router, handleClose]);


    // console.log("msg:", msg);
    return (
        <MessageOptionsPopover
            isOpen={isOpen}
            onClose={handleClose}
            onRecall={handleRecallMessage}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onForward={handleForwardMessage}
            isMyMessage={isMyMessage}
            isRecalled={msg.isRecalled}
            message={msg}  // Truyền msg vào MessageOptionsPopover
        >
            <XStack
                justifyContent={isMyMessage ? 'flex-end' : 'flex-start'}
                width={isMyMessage ? '100%' : '85%'}
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
                        paddingLeft={8}
                        paddingRight={8}
                        paddingTop={3}
                        paddingBottom={3}
                        shadowRadius={6}
                    >
                        <XStack alignItems="flex-start" space={isMyMessage ? 35 : 10} >
                            {!isMyMessage && showAvatar && msg.sender && (
                                msg.sender.avatar ? (
                                    <Image
                                        source={{ uri: msg.sender.avatar }}
                                        width={29}
                                        height={29}
                                        borderRadius={20}
                                        marginTop={5}
                                    />
                                ) : (
                                    <DefaultAvatar name={msg.sender.name} size={30} />
                                )
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
                                elevation={1.1}

                            >
                                {/* Hiển thị chỉ báo đã chỉnh sửa */}
                                {msg.isEdited || (msg.originalContent && !msg.isRecalled) ? (
                                    <Text
                                        fontSize={11}
                                        color={isMyMessage ? '#2196F3' : '#2196F3'}
                                        fontStyle="italic"
                                        textAlign='right'
                                    >
                                        Đã chỉnh sửa
                                    </Text>
                                ) : null}

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
                                            <YStack>
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
                                                        {messageContent}  {/* SỬA: Sử dụng messageContent safe */}
                                                    </Text>
                                                    {msg.isPending && (
                                                        <ActivityIndicator size="small" color={isMyMessage ? 'white' : '#65676b'} />
                                                    )}
                                                </XStack>
                                            </YStack>
                                        )}
                                        {msg.type === 'IMAGE' && (
                                            <TouchableOpacity onPress={handleImagePress}>
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
                                                            width: "100%",
                                                            height: "100%",
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
                                            </TouchableOpacity>
                                        )}
                                        {msg.type === 'RAW' && (
                                            <YStack
                                                borderRadius={10}
                                                overflow="hidden"
                                                backgroundColor={isMyMessage ? '#c57d49' : '#d8d9df'}
                                                padding={10}
                                                space={8}
                                                width={200}
                                            >
                                                <XStack alignItems="center" space={8} flex={1}>
                                                    <YStack
                                                        backgroundColor="rgba(0,0,0,0.1)"
                                                        width={40}
                                                        height={40}
                                                        borderRadius={20}
                                                        justifyContent="center"
                                                        alignItems="center"
                                                    >
                                                        <Ionicons name="document" size={24} color={"#525ec9"} />
                                                    </YStack>

                                                    <YStack flex={1}>
                                                        <Text
                                                            color={isMyMessage ? "white" : "#333"}
                                                            numberOfLines={1}
                                                            ellipsizeMode="middle"
                                                            fontWeight="500"
                                                        >
                                                            {msg.fileName || "Tài liệu"}
                                                        </Text>

                                                        <Text
                                                            fontSize={12}
                                                            color={isMyMessage ? "#f0f2f5" : "#65676b"}
                                                            numberOfLines={1}
                                                        >
                                                            {msg.fileSize ? `${Math.round(msg.fileSize / 1024)} KB` : "no size"}
                                                        </Text>
                                                    </YStack>

                                                    <TouchableOpacity
                                                        onPress={handleDownloadFile}
                                                        disabled={isDownloadingFile}
                                                        style={{
                                                            padding: 8,
                                                            borderRadius: 20,
                                                            backgroundColor: isDownloadingFile
                                                                ? 'rgba(0,0,0,0.3)'
                                                                : (isMyMessage ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'),
                                                            opacity: isDownloadingFile ? 0.6 : 1,
                                                        }}
                                                    >
                                                        {isDownloadingFile ? (
                                                            <ActivityIndicator
                                                                size="small"
                                                                color={isMyMessage ? "white" : "#444"}
                                                            />
                                                        ) : (
                                                            <Ionicons
                                                                name="cloud-download-outline"
                                                                size={24}
                                                                color={isMyMessage ? "white" : "#444"}
                                                            />
                                                        )}
                                                    </TouchableOpacity>
                                                </XStack>

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


                                        {msg.type === 'VIDEO' && (

                                            <TouchableOpacity onPress={handleVideoPress}>
                                                <YStack
                                                    width={200}
                                                    height={200}
                                                    borderRadius={10}
                                                    overflow="hidden"
                                                    backgroundColor="#000"
                                                >

                                                    {isVideoPlaying ? (
                                                        <Video
                                                            source={{ uri: msg.imageUrl }}
                                                            style={{ width: '100%', height: '100%' }}
                                                            useNativeControls
                                                            resizeMode="contain"
                                                            shouldPlay
                                                            onPlaybackStatusUpdate={(status) => {
                                                                if (status.didJustFinish) {
                                                                    setIsVideoPlaying(false);
                                                                }
                                                            }}
                                                        />
                                                        // <>
                                                        //     <Text>VIDEO</Text>
                                                        // </>
                                                    ) : (
                                                        <>
                                                            <Image
                                                                source={{ uri: msg.imageUrl }}
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
                                                            marginLeft={10}
                                                        >
                                                            <ActivityIndicator size="large" color={isMyMessage ? 'white' : '#FF7A1E'} />
                                                        </YStack>
                                                    )}
                                                </YStack>
                                            </TouchableOpacity>

                                        )}

                                        <ImageViewer
                                            visible={showImageViewer}
                                            imageUri={msg.imageUrl}
                                            onClose={handleCloseImageViewer}
                                        />
                                        {
                                            !msg.isRecall && <Text
                                                fontSize={12}
                                                color={isMyMessage ? '#e4e6eb' : '#65676b'}
                                                textAlign={isMyMessage ? "right" : "left"}
                                                marginTop={4}
                                                backgroundColor={isMyMessage ? '#00000000' : '#00000000'}
                                                alignSelf={isMyMessage ? "flex-end" : "flex-start"}
                                            >

                                                {formatTime(updatedAt)}
                                            </Text>
                                        }
                                    </>
                                )}


                            </YStack>
                        </XStack>
                    </YStack>
                </Pressable>
            </XStack>
        </MessageOptionsPopover>
    );
};

export default React.memo(MessageItem);
