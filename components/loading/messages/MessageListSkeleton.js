import React from 'react';
import { View, ScrollView } from 'tamagui';
import { StyleSheet } from 'react-native';
import MessageSkeleton from './MessageSkeleton';

const MessageListSkeleton = () => {
    // Tạo mẫu alternating pattern cho tin nhắn
    const patterns = [
        { isMyMessage: false },
        { isMyMessage: true },
        { isMyMessage: false },
        { isMyMessage: true },
        { isMyMessage: true },
        { isMyMessage: false },
    ];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {patterns.map((pattern, index) => (
                    <MessageSkeleton
                        key={`message-skeleton-${index}`}
                        isMyMessage={pattern.isMyMessage}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollViewContent: {
        paddingVertical: 16,
    },
});

export default MessageListSkeleton;