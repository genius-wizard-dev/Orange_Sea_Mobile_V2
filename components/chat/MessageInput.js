import { StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import React, { useState } from 'react';
import { XStack } from 'tamagui';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const MessageInput = ({ onSendMessage, onFocusInput }) => {
    const [message, setMessage] = useState('');
    const [isFocused, setIsFocused] = useState(false);

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

    return (
        <XStack style={[
            styles.inputContainer, 
            isFocused && { marginBottom: 50 }
        ]}>
            <XStack space="$2" flex={1} backgroundColor="#f0f2f5" borderRadius={20} alignItems="center" padding={5}>
                <Ionicons name="happy-outline" size={24} color="#65676b" />
                <TextInput
                    style={styles.input}
                    placeholder="Tin nhắn"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    maxLength={1000}
                    onFocus={handleFocus}
                    onBlur={() => setIsFocused(false)}
                />
                <Ionicons name="images-outline" size={24} color="#65676b" />
                <FontAwesome name="microphone" size={24} color="#65676b" />
            </XStack>
            <Pressable onPress={handleSend}>
                <XStack padding={10}>
                    <Ionicons name="send" size={24} color="#0084ff" />
                </XStack>
            </Pressable>
        </XStack>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#e4e6eb',
        backgroundColor: 'white',
        minHeight: 60,
        marginBottom: 0,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingHorizontal: 10,
        maxHeight: 100,
        paddingVertical: 5
    }
});

export default MessageInput;
