import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MessageItem from './MessageItem';

const MessageList = React.forwardRef(({ messages, profileId, isLoading }, ref) => {

    const flatListRef = useRef(null);
    useImperativeHandle(ref, () => ({
        scrollToEnd: () => {
            if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
            }
        }
    }));

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);


    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Format giờ:phút
        const time = date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Nếu là today hoặc yesterday thì hiển thị tương ứng
        if (date.toDateString() === today.toDateString()) {
            return `Hôm nay, ${time}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Hôm qua, ${time}`;
        }

        // Ngày khác thì hiển thị đầy đủ
        const fullDate = date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return `${fullDate}, ${time}`;
    };

    console.log('Messages in MessageList:', messages?.length);

    const renderMessage = ({ item }) => (
        <MessageItem 
            msg={item}
            isMyMessage={item.senderId === profileId}
        />
    );

    if (isLoading) {
        return <View style={styles.center}><Text>Đang tải...</Text></View>;
    }

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id || item.tempId || Math.random().toString()}
            style={styles.container}
            onContentSizeChange={() => flatListRef?.current?.scrollToEnd()}
            inverted={false}
        />
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default MessageList;
