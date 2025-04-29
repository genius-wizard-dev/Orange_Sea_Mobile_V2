import React, { useEffect, useImperativeHandle, useRef, useLayoutEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MessageItem from './MessageItem';

const MessageList = React.forwardRef(({ messages, profileId, isLoading }, ref) => {
    const flatListRef = useRef(null);
    const initialScroll = useRef(true);
    const [forceUpdate, setForceUpdate] = useState(0); // Thêm state để force update

    useImperativeHandle(ref, () => ({
        scrollToEnd: () => {
            if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: true });
            }
        }
    }));

    const scrollToBottom = () => {
        if (flatListRef.current && messages?.length > 0) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: !initialScroll.current });
            initialScroll.current = false;
        }
    };

    useLayoutEffect(() => {
        const timer = setTimeout(scrollToBottom, 200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Thêm effect để force update khi có tin nhắn mới
    useEffect(() => {
        if (messages?.length > 0) {
            setForceUpdate(prev => prev + 1);
        }
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

    const renderMessage = ({ item }) => {
        // console.log('Rendering message:', item.id, 'isPending:', item.isPending);
        return (
            <MessageItem 
                key={`${item.id}_${forceUpdate}`} // Thêm forceUpdate vào key
                msg={item}
                isMyMessage={item.senderId === profileId}
            />
        );
    };

    if (isLoading) {
        return <View style={styles.center}><Text>Đang tải các đoạn tin nhắn...</Text></View>;
    }

    return (
        <FlatList
            ref={flatListRef}
            data={[...messages].reverse()}
            renderItem={renderMessage}
            keyExtractor={item => `${item.id || item.tempId}_${forceUpdate}`} // Cập nhật keyExtractor
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            onLayout={scrollToBottom}
            inverted={true}
            maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10
            }}
            extraData={forceUpdate} // Thêm extraData để force re-render
        />
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    contentContainer: {
        flexGrow: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default MessageList;
