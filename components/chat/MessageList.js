import React, { useEffect, useImperativeHandle, useRef, useLayoutEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MessageItem from './MessageItem';

const MessageList = React.forwardRef(({ messages, profileId, isLoading }, ref) => {
    const flatListRef = useRef(null);
    const initialScroll = useRef(true);
    const [forceUpdate, setForceUpdate] = useState(0);

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

    // Force update khi có thay đổi trong messages, đặc biệt là isRecalled
    useEffect(() => {
        if (messages?.length > 0) {
            let hasRecalledMessages = messages.some(m => m.isRecalled);
            console.log('Has recalled messages:', hasRecalledMessages);
            setForceUpdate(prev => prev + 1);
        }
    }, [messages, messages?.some(m => m.isRecalled)]);

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

    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const formatDateHeader = (date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // console.log('Messages in MessageList:', messages?.length);
    // console.log('Messages :', messages);

    const renderMessage = ({ item, index, messages }) => {
        // console.log(`Rendering message ${index}: ID=${item.id}, isRecalled=${item.isRecalled}`);
        const isMyMessage = item.senderId === profileId;

        // Kiểm tra tin nhắn trước đó
        const prevMessage = index < messages.length - 1 ? messages[index + 1] : null;
        const showAvatar = !isMyMessage && (!prevMessage ||
            prevMessage.senderId !== item.senderId ||
            (new Date(item.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 60000)
        );

        // Kiểm tra ngày
        const showDateHeader = !prevMessage || !isSameDay(item.createdAt, prevMessage.createdAt);

        return (
            <View>
                {showDateHeader && (
                    <View style={styles.dateHeaderContainer}>
                        <View style={styles.dateHeaderLine} />
                        <Text style={styles.dateHeaderText}>
                            {formatDateHeader(item.createdAt)}
                        </Text>
                        <View style={styles.dateHeaderLine} />
                    </View>
                )}
                <MessageItem
                    key={`${item.id}_${forceUpdate}`}
                    msg={{
                        ...item,
                        isMyMessage
                    }}
                    isMyMessage={isMyMessage}
                    showAvatar={showAvatar}
                />
            </View>
        );
    };

    if (isLoading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#FF7A1E" /></View>;
    }

    return (
        <FlatList
            ref={flatListRef}
            data={messages ? [...messages].reverse() : []}
            renderItem={({ item, index }) => renderMessage({
                item,
                index,
                messages: messages ? [...messages].reverse() : []
            })}
            keyExtractor={item => `${item.id || item.tempId}_${forceUpdate}`}
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            onLayout={scrollToBottom}
            inverted={messages.length < 6 ? false : true}
            maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10
            }}
            extraData={[forceUpdate, profileId, messages.length]}
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
    },
    dateHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        paddingHorizontal: 10
    },
    dateHeaderLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5E5'
    },
    dateHeaderText: {
        color: '#65676b',
        fontSize: 12,
        marginHorizontal: 10,
        fontWeight: '500'
    }
});

export default MessageList;
