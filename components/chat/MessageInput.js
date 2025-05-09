import { StyleSheet, TextInput, Pressable, Platform, Animated, Keyboard, Dimensions, TouchableWithoutFeedback, View } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { XStack, YStack } from 'tamagui';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import EmojiSelector from 'react-native-emoji-selector';

const MessageInput = ({ onSendMessage, onFocusInput, onTabChange }) => {
    const [message, setMessage] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const fadeAnimSend = useRef(new Animated.Value(0)).current;
    const [activeTab, setActiveTab] = useState(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const bottomSheetAnim = useRef(new Animated.Value(0)).current;
    const inputPosition = useRef(new Animated.Value(0)).current;
    const bottomSheetHeight = 300;

    useEffect(() => {
        if (message.length > 0) {
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
    }, [message]);

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
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    const closeBottomSheet = () => {
        setActiveTab(null);
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
        Keyboard.dismiss();
        if (activeTab === tabName) {
            // Đóng tab
            setActiveTab(null);
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

    const renderTabContent = () => {
        if (!activeTab) return null;
        return (
            <YStack height={bottomSheetHeight} backgroundColor="#fff" padding={10}>
                {activeTab === 'sticker' && (
                    <XStack flex={1} alignItems="center" justifyContent="center">
                        {/* <Ionicons name="happy-outline" size={50} color="#65676b" /> */}
                        <EmojiSelector
                            onEmojiSelected={emoji => {
                                setMessage(prevMessage => prevMessage + emoji);
                            }}
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
                        <Ionicons name="images-outline" size={50} color="#65676b" />
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
                        >
                            <Ionicons
                                onPress={() => toggleTab('sticker')}
                                color={activeTab === 'sticker' ? '#0084ff' : '#65676b'}
                                name="happy-outline"
                                size={30}

                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Tin nhắn"
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={1000}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                            />
                            <Animated.View style={{
                                flexDirection: 'row',
                                opacity: fadeAnim,
                                gap: 10,
                                position: 'absolute',
                                right: 10,
                                transform: [{
                                    scale: fadeAnim
                                }]
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
                                        style={{ marginLeft: 10, marginRight: 40 }}
                                    />
                                </Pressable>


                            </Animated.View>
                            <Animated.View style={{
                                opacity: fadeAnimSend,
                                position: 'absolute',
                                right: 10,
                                transform: [{
                                    scale: fadeAnimSend
                                }]
                            }}>
                                <Pressable onPress={handleSend}>
                                    <XStack padding={10}>
                                        <Ionicons name="send" size={30} color="#0084ff" />
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
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        borderRadius: 20,
        fontSize: 16,
        paddingHorizontal: 12,
    }
});

export default MessageInput;
