import { StyleSheet, TextInput, Pressable, Platform, Animated, Keyboard, Dimensions, TouchableWithoutFeedback, View } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Text, XStack, YStack } from 'tamagui';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import EmojiSelector from 'react-native-emoji-selector';
import ImageGallery from './ImageGallery';
import emojiMap from '../../utils/emojiMap';
import FileGallery from './FileGallery';

const MessageInput = ({ onSendMessage, onFocusInput, onTabChange, editingMessage, onEditComplete }) => {
    const [message, setMessage] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const fadeAnimSend = useRef(new Animated.Value(0)).current;
    const [activeTab, setActiveTab] = useState(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const bottomSheetAnim = useRef(new Animated.Value(0)).current;
    const inputPosition = useRef(new Animated.Value(0)).current;
    const bottomSheetHeight = 300;
    const [hasSelectedImage, setHasSelectedImage] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Thêm state isEditing

    const [hasSelectedFile, setHasSelectedFile] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (editingMessage) {
            console.log('MessageInput nhận được tin nhắn cần chỉnh sửa:',
                JSON.stringify(editingMessage, null, 2));

            // Hiển thị nội dung tin nhắn trong input để chỉnh sửa
            setMessage(editingMessage.message || '');
            setIsEditing(true);

            // Focus vào input
            if (inputRef.current) {
                setTimeout(() => {
                    inputRef.current.focus();
                }, 100);
            }
        } else {
            // Reset trạng thái khi không có tin nhắn nào được chỉnh sửa
            if (isEditing) {
                setIsEditing(false);
            }
        }
    }, [editingMessage]);


    useEffect(() => {
        if (message.length > 0 && !hasSelectedImage || isEditing) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnimSend, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnimSend, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [message, hasSelectedImage, isEditing]);

    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => setKeyboardHeight(e.endCoordinates.height)
        );
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardHeight(0)
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, []);

    // Cập nhật hàm handleSend
    const handleSend = () => {
        if (isEditing && editingMessage) {

            // Xử lý chỉnh sửa tin nhắn
            if (message.trim()) {
                onEditComplete({
                    messageId: editingMessage.id,
                    content: message.trim() // Vẫn dùng content ở đây, sẽ được đổi thành newContent trong thunk
                });
            }
            setIsEditing(false);
        } else {
            // Xử lý gửi tin nhắn mới
            if (message.trim()) {
                onSendMessage({
                    type: 'TEXT',
                    content: message.trim()
                });

                // SỬA: Trigger input focus để scroll
                if (onFocusInput) {
                    setTimeout(() => {
                        onFocusInput();
                    }, 50);
                }
            }
        }
        setMessage('');
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setMessage('');
        onEditComplete(null); // Gọi onEditComplete với null để hủy chỉnh sửa
    };

    const closeBottomSheet = () => {
        setActiveTab(null);
        onTabChange && onTabChange(null);
        setHasSelectedImage(false);

        Animated.parallel([
            Animated.spring(inputPosition, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
                tension: 50
            }),
            Animated.spring(bottomSheetAnim, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
                tension: 50
            })
        ]).start(() => {
            bottomSheetAnim.setValue(0);
        });
    };

    const handleFocus = () => {
        setIsFocused(true);
        if (activeTab) {
            closeBottomSheet();
        }
        onFocusInput && onFocusInput();
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const toggleTab = (tabName) => {
        // Nếu đang trong chế độ chỉnh sửa, không cho phép chuyển tab
        if (isEditing) return;

        Keyboard.dismiss();
        if (activeTab === tabName) {
            // Đóng tab
            setActiveTab(null);
            setHasSelectedImage(false);
            setHasSelectedFile(false);
            onTabChange && onTabChange(null);
            Animated.parallel([
                Animated.spring(inputPosition, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 50
                }),
                Animated.spring(bottomSheetAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 50
                })
            ]).start(() => {
                // Reset bottomSheetAnim sau khi đóng
                bottomSheetAnim.setValue(0);
            });
        } else {
            // Mở tab mới
            setActiveTab(tabName);
            // Nếu là tab image, xóa text để ẩn nút gửi tin nhắn
            if (tabName === 'images' || tabName === 'files') {
                setMessage('');
            }
            onTabChange && onTabChange(tabName);
            // Đặt giá trị bottomSheetAnim về 0 trước khi animation
            bottomSheetAnim.setValue(0);
            Animated.parallel([
                Animated.spring(inputPosition, {
                    toValue: -1,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 50
                }),
                Animated.spring(bottomSheetAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    friction: 8,
                    tension: 50
                })
            ]).start();
        }
    };

    const handleOutsidePress = (event) => {
        // Chỉ xử lý click bên ngoài nếu bottomSheet đang mở
        if (!activeTab) return;

        // Lấy tọa độ click
        const { locationY } = event.nativeEvent;
        // Lấy chiều cao màn hình
        const screenHeight = Dimensions.get('window').height;
        // Tính vị trí của bottomSheet (tính từ dưới lên)
        const bottomSheetPosition = bottomSheetHeight + 60; // 60 là chiều cao ước lượng của input

        // Nếu click ở vùng trên bottomSheet thì đóng nó
        if (locationY < (screenHeight - bottomSheetPosition)) {
            closeBottomSheet();
        }
    };

    const handleSendImage = (mediaData) => {
        console.log('handleSendImage được gọi với:', mediaData);

        if (!mediaData || !mediaData.uri) {
            console.error('mediaData không hợp lệ:', mediaData);
            Alert.alert('Lỗi', 'Dữ liệu ảnh/video không hợp lệ');
            return;
        }

        // Xác định type dựa trên mediaType
        const messageType = mediaData.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE';

        console.log('Message type:', messageType);
        console.log('onSendMessage function:', typeof onSendMessage);

        // Kiểm tra onSendMessage có tồn tại không
        if (typeof onSendMessage !== 'function') {
            console.error('onSendMessage không phải là function!');
            Alert.alert('Lỗi', 'Chức năng gửi tin nhắn không khả dụng');
            return;
        }

        // SỬA: Gửi theo format đúng
        const messageData = {
            type: messageType,
            content: "", // Content rỗng cho ảnh/video
            mediaData: mediaData // Đặt mediaData ở đây
        };

        console.log('Đang gửi message với data:', messageData);

        try {
            onSendMessage(messageData);

            if (onFocusInput) {
                setTimeout(() => {
                    onFocusInput();
                }, 100);
            }

            // Đóng bottom sheet
            closeBottomSheet();

            // Reset trạng thái đã chọn ảnh
            setHasSelectedImage(false);

            // Đảm bảo message là rỗng
            setMessage('');

            console.log('Đã gọi onSendMessage thành công');
        } catch (error) {
            console.error('Lỗi khi gọi onSendMessage:', error);
            Alert.alert('Lỗi', 'Không thể gửi tin nhắn: ' + error.message);
        }
    };



    const renderTabContent = () => {
        if (!activeTab) return null;
        return (
            <YStack height={bottomSheetHeight} backgroundColor="#fff" padding={10}>
                {activeTab === 'sticker' && (
                    <View style={{ flex: 1 }}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-end',
                            marginBottom: 10,
                        }}>
                            <Pressable
                                onPress={() => {
                                    setMessage(prevMessage => {
                                        if (prevMessage.length === 0) return prevMessage;

                                        const chars = Array.from(prevMessage);
                                        chars.pop();
                                        return chars.join('');
                                    });
                                }}
                                style={{
                                    padding: 10,
                                    backgroundColor: '#e8e8e8',
                                    borderRadius: 10,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name="backspace-outline" size={24} color="#666" />
                                <Text style={{ marginLeft: 5, color: '#666', fontWeight: '500' }}>Xóa</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            // style={{ flex: 1 }}
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                justifyContent: 'space-between',
                            }}>
                                {Array.from(new Set(Object.values(emojiMap))).map((emoji, index) => (
                                    <Pressable
                                        key={index}
                                        onPress={() => {
                                            setMessage(prevMessage => prevMessage + emoji);
                                        }}
                                        style={{
                                            padding: 8,
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: 10,
                                            margin: 4,
                                            width: '15%', // 4 emoji mỗi hàng
                                            alignItems: 'center',
                                            marginBottom: 8,
                                        }}
                                    >
                                        <Text style={{ fontSize: 30 }}>{emoji}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {activeTab === 'files' && (
                    <XStack flex={1} alignItems="center" justifyContent="center">
                        <FileGallery
                            onFileSelect={(file) => {
                                setHasSelectedFile(!!file);
                                if (!file) {
                                    setMessage('');
                                }
                            }}
                            onSendFile={handleSendFile}
                        />
                    </XStack>
                )}

                {activeTab === 'duplicate' && (
                    <XStack flex={1} alignItems="center" justifyContent="center">
                        <Ionicons name="duplicate-outline" size={50} color="#65676b" />
                    </XStack>
                )}

                {activeTab === 'images' && (
                    <XStack flex={1} alignItems="center" justifyContent="center">
                        <ImageGallery
                            onImageSelect={(image) => {
                                // Nếu image là null, tức là người dùng đã hủy chọn ảnh
                                setHasSelectedImage(!!image);
                                if (!image) {
                                    // Người dùng đã hủy, cho phép nhập text trở lại
                                    setMessage('');
                                }
                            }}
                            onSendImage={handleSendImage}
                        />
                    </XStack>
                )}
            </YStack>
        );
    };

    const handleSendFile = (fileData) => {
        if (fileData) {
            // Kiểm tra loại file để gửi đúng type
            const getFileType = (fileData) => {
                const { type, name } = fileData;

                // Kiểm tra mimeType trước
                if (type) {
                    if (type.startsWith('video/')) {
                        return 'VIDEO';
                    }
                    if (type.startsWith('image/')) {
                        return 'IMAGE';
                    }
                }

                // Fallback kiểm tra extension
                if (name) {
                    const extension = name.toLowerCase().split('.').pop();
                    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'm4v'];
                    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff'];

                    if (videoExtensions.includes(extension)) {
                        return 'VIDEO';
                    }
                    if (imageExtensions.includes(extension)) {
                        return 'IMAGE';
                    }
                }

                return 'RAW';
            };

            const fileType = getFileType(fileData);

            onSendMessage({
                type: fileType,
                content: "", // Content luôn rỗng
                mediaData: fileData // Truyền fileData riêng
            });

            closeBottomSheet();
            setHasSelectedFile(false);
            setMessage('');
        }
    };

    return (
        <>
            {activeTab && (
                <TouchableWithoutFeedback onPress={handleOutsidePress}>
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'transparent'
                    }} />
                </TouchableWithoutFeedback>
            )}

            <YStack
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                zIndex={2}
            >

                {/* Thanh thông báo đang chỉnh sửa */}
                {isEditing && (
                    <XStack
                        backgroundColor="#E3F2FD"
                        paddingVertical={8}
                        paddingHorizontal={15}
                        alignItems="center"
                        justifyContent="space-between"
                        borderTopWidth={1}
                        borderColor="#ccd0d5"
                    >
                        <XStack alignItems="center" flex={1}>
                            <Ionicons name="pencil-outline" size={18} color="#2196F3" style={{ marginRight: 8 }} />
                            <Text style={{ color: "#2196F3", fontSize: 14 }}>Đang chỉnh sửa tin nhắn</Text>
                        </XStack>
                        <Pressable onPress={cancelEditing} style={{ padding: 5 }}>
                            <Ionicons name="close" size={20} color="#666" />
                        </Pressable>
                    </XStack>
                )}

                <Animated.View style={{
                    transform: [{
                        translateY: inputPosition
                    }]
                }}>
                    <XStack
                        space="$2"
                        backgroundColor="white"
                        borderTopWidth={1}
                        borderColor="#ddd"
                        padding={8}
                        alignItems="center"
                        style={{
                            paddingBottom: Platform.OS === 'ios' ? keyboardHeight + 8 : 8
                        }}
                    >
                        <XStack
                            space="$2"
                            flex={1}
                            backgroundColor="#f0f2f5"
                            borderRadius={20}
                            alignItems="center"
                            padding={5}
                            paddingLeft={15}
                        >
                            <Ionicons
                                onPress={() => toggleTab('sticker')}
                                color={activeTab === 'sticker' ? '#0084ff' : '#65676b'}
                                name="happy-outline"
                                size={30}

                            />
                            <TextInput
                                ref={inputRef}
                                style={styles.input}
                                placeholderTextColor="#424242"
                                placeholder={isEditing ? "Chỉnh sửa tin nhắn..." : "Nhập tin nhắn..."}
                                value={message}
                                onChangeText={(text) => {
                                    // Chỉ cho phép nhập text khi không có ảnh được chọn
                                    if (!hasSelectedImage) {
                                        setMessage(text);
                                    }
                                }}
                                multiline
                                maxLength={1000}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                editable={!hasSelectedImage}
                            />
                            <Animated.View style={{
                                flexDirection: 'row',
                                opacity: fadeAnim,
                                gap: 10,
                                position: 'absolute',
                                right: 10,
                                transform: [{
                                    scale: fadeAnim
                                }],
                                zIndex: 5,
                                paddingHorizontal: 5,
                                paddingVertical: 5
                            }}>

                                <Pressable onPress={() => toggleTab('files')}>
                                    <Ionicons
                                        name="attach-outline"
                                        size={30}
                                        color={activeTab === 'files' ? '#0084ff' : '#65676b'}
                                    />
                                </Pressable>

                                {/* <Pressable onPress={() => toggleTab('duplicate')}>
                                    <Ionicons
                                        name="duplicate-outline"
                                        size={30}
                                        color={activeTab === 'duplicate' ? '#0084ff' : '#65676b'}
                                    />
                                </Pressable> */}

                                <Pressable onPress={() => toggleTab('images')}>
                                    <Ionicons
                                        name="images-outline"
                                        size={30}
                                        color={activeTab === 'images' ? '#0084ff' : '#65676b'}
                                        style={{ marginLeft: 10, marginRight: 0 }}
                                    />
                                </Pressable>


                            </Animated.View>
                            <Animated.View style={{
                                opacity: fadeAnimSend,
                                position: 'absolute',
                                right: 10,
                                transform: [{
                                    scale: fadeAnimSend
                                }],
                                zIndex: message.trim().length > 0 ? 6 : 4
                            }}>
                                <Pressable onPress={handleSend} style={{ padding: 5 }}>
                                    <XStack padding={10} paddingRight={0}>
                                        {/* Thay đổi biểu tượng khi đang chỉnh sửa */}
                                        <Ionicons
                                            name={isEditing ? "checkmark-outline" : "send"}
                                            size={30}
                                            color="#0084ff"
                                        />
                                    </XStack>
                                </Pressable>
                            </Animated.View>
                        </XStack>
                    </XStack>

                    {activeTab && (
                        <Animated.View style={{
                            height: bottomSheetHeight,
                            backgroundColor: 'white',
                            borderTopWidth: 1,
                            borderColor: '#ddd',
                            opacity: bottomSheetAnim,
                            transform: [{
                                translateY: bottomSheetAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [bottomSheetHeight, 0],
                                    extrapolate: 'clamp'
                                })
                            }]
                        }}>
                            {renderTabContent()}
                        </Animated.View>
                    )}
                </Animated.View>
            </YStack>
        </>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 8,
        paddingLeft: 10,
        paddingRight: 20,
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    input: {
        maxWidth: 250,
        flex: 1,
        minHeight: 40,
        maxHeight: 150,
        borderRadius: 20,
        fontSize: 16,
    }
});

export default MessageInput;
