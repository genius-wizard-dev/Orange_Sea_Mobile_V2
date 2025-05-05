import { StyleSheet, TextInput, Pressable, Platform, Animated } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { XStack } from 'tamagui';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const MessageInput = ({ onSendMessage, onFocusInput }) => {
    const [message, setMessage] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const fadeAnimSend = useRef(new Animated.Value(0)).current;

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

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
        onFocusInput && onFocusInput();
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    return (
        <XStack
            space="$2"
            flex={1}
            backgroundColor="#f0f0f0"
            borderTopWidth={1}
            borderColor="#ddd"
            padding={8}
            alignItems="center"
            style={styles.inputContainer}>
            <XStack
                space="$2"
                flex={1}
                backgroundColor="#f0f2f5"
                borderRadius={20}
                alignItems="center"
                padding={5}
            >
                <Ionicons name="happy-outline" size={30} color="#65676b" />
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
                    <Ionicons name="duplicate-outline" size={30} color="#65676b" />
                    <Ionicons name="mic-outline" size={30} color="#65676b" marginLeft={10} />
                    <Ionicons name="images-outline" size={30} color="#65676b" marginLeft={10}/>
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
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        borderRadius: 20,
        fontSize: 16,
    }
});

export default MessageInput;
