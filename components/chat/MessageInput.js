import { StyleSheet, TextInput, Pressable, Platform, Animated, Keyboard, Dimensions, TouchableWithoutFeedback, View } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, Text, XStack, YStack } from 'tamagui';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import EmojiSelector from 'react-native-emoji-selector';
import ImageGallery from './ImageGallery';
import emojiMap from '../../utils/emojiMap';

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
    const inputRef = useRef(null);

    useEffect(() => {
        if (editingMessage) {
            console.log('MessageInput nhận được tin nhắn cần chỉnh sửa:', editingMessage);

            // Truy cập nội dung tin nhắn, đảm bảo không bị null
            const messageContent = editingMessage.message || editingMessage.content || '';
            console.log('Nội dung sẽ hiển thị trong input:', messageContent);

            // Cập nhật giá trị input và trạng thái chỉnh sửa
            setMessage(messageContent);
            setIsEditing(true);

            // Focus vào input khi chuyển sang chế độ chỉnh sửa
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100);
        } else {
            setIsEditing(false);
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

    const handleSend = () => {
        if (isEditing) {
            // Xử lý chỉnh sửa tin nhắn
            if (message.trim() && editingMessage) {
                onEditComplete({
                    messageId: editingMessage.id,
                    content: message.trim()
                });
            }
            // Reset trạng thái sau khi chỉnh sửa
            setIsEditing(false);
        } else {
            // Xử lý gửi tin nhắn mới
            if (message.trim()) {
                onSendMessage({
                    type: 'TEXT',
                    content: message.trim()
                });
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
            if (tabName === 'images') {
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

    const handleSendImage = (imageData) => {
        if (imageData) {
            // Gọi hàm onSendMessage với đúng định dạng
            onSendMessage({
                type: 'IMAGE',
                content: {
                    ...imageData,
                    content: ""  // Đảm bảo content là chuỗi rỗng
                }
            });

            // Đóng bottom sheet
            closeBottomSheet();

            // Reset trạng thái đã chọn ảnh
            setHasSelectedImage(false);

            // Đảm bảo message là rỗng
            setMessage('');
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
                                <Pressable onPress={() => toggleTab('duplicate')}>
                                    <Ionicons
                                        name="duplicate-outline"
                                        size={30}
                                        color={activeTab === 'duplicate' ? '#0084ff' : '#65676b'}
                                    />
                                </Pressable>

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
