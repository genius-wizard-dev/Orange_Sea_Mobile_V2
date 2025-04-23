import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Spinner } from 'tamagui';
import MessageItem from './MessageItem';

const DateDivider = ({ date }) => {
    return (
        <View style={styles.dateDividerContainer}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{date}</Text>
            <View style={styles.dateLine} />
        </View>
    );
};

const MessageList = forwardRef(({ messages, profileId, isLoading }, ref) => {
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

    const groupMessagesByDate = (messages) => {
        const grouped = [];
        let currentDate = '';

        messages.forEach((msg) => {
            const messageDate = new Date(msg.createdAt);
            const formattedDate = messageDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            if (formattedDate !== currentDate) {
                grouped.push({
                    type: 'date',
                    date: formattedDate,
                    id: `date-${formattedDate}`
                });
                currentDate = formattedDate;
            }
            grouped.push({
                type: 'message',
                ...msg
            });
        });

        return grouped;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Spinner size="large" color="$orange10" />
            </View>
        );
    }

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <FlatList
            ref={flatListRef}
            style={styles.container}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            data={groupedMessages}
            keyExtractor={item => item.type === 'date' ? item.id : (item.tempId || item.id)}
            renderItem={({ item }) => {
                if (item.type === 'date') {
                    return <DateDivider date={item.date} />;
                }
                return (
                    <MessageItem
                        msg={item}
                        isMyMessage={item.senderId === profileId}
                    />
                );
            }}
        />
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 10,
        marginBottom: 0
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    dateDividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginVertical: 10
    },
    dateLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E5E5'
    },
    dateText: {
        marginHorizontal: 10,
        color: '#666',
        fontSize: 12
    }
});

export default MessageList;
