import React, { useEffect, useImperativeHandle, useRef, useLayoutEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MessageItem from './MessageItem';
import { useDispatch } from 'react-redux';
import { setMessages } from '../../redux/slices/chatSlice';
import { fetchPaginatedMessages } from '../../redux/thunks/chat';

const MessageList = React.forwardRef(({
    messages,
    profileId,
    groupId,
    isLoading,
    nextCursor,
    setNextCursor,
    onLoadMoreMessages
}, ref) => {
    const dispatch = useDispatch();
    const flatListRef = useRef(null);
    const initialScroll = useRef(true);
    const cursor = useRef(null);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

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
    }, [messages.length]);

    useEffect(() => {
        if (messages?.length > 0 && !isFirstLoad) {
            setForceUpdate(prev => prev + 1);
        }
    }, [messages.length, isFirstLoad]);

    useEffect(() => {
        if (isFirstLoad && messages?.length > 0) {
            setIsFirstLoad(false);
        }
    }, [messages.length]);

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

    const renderMessage = ({ item, index }) => {
        // console.log(`Rendering message ${index}: ID=${item.id}, Content=${item.message}, CreatedAt=${item.createdAt}, isRecalled=${item.isRecalled}`);
        const isMyMessage = item.senderId === profileId;
        const prevMessage = index < messages.length - 1 ? messages[index + 1] : null;
        const showAvatar = !isMyMessage && (!prevMessage ||
            prevMessage.senderId !== item.senderId ||
            (new Date(item.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 60000)
        );
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
                    key={`${item.id || item.tempId}_${forceUpdate}`}
                    msg={{ ...item, isMyMessage }}
                    isMyMessage={isMyMessage}
                    showAvatar={showAvatar}
                />
            </View>
        );
    };

    const loadMore = async () => {
        if (!hasMore || isLoadingMore || !nextCursor) {
            console.log('Không tải thêm vì:', { hasMore, isLoadingMore, nextCursor });
            return;
        }

        if (nextCursor === cursor.current) {
            console.log('Bỏ qua vì nextCursor đã được xử lý:', nextCursor);
            setHasMore(false);
            return;
        }

        setIsLoadingMore(true);
        cursor.current = nextCursor;

        try {
            const result = await dispatch(fetchPaginatedMessages({
                groupId,
                cursor: nextCursor
            })).unwrap();

            console.log("result fetchPaginatedMessages", result);
            onLoadMoreMessages(result.data);

            if (result?.status === 'success' && result.data?.messages?.length > 0) {
                const formattedMessages = result.data.messages.map(msg => ({
                    id: msg.id,
                    message: msg.content,
                    senderId: msg.senderId,
                    groupId: msg.groupId,
                    createdAt: msg.createdAt,
                    type: msg.type,
                    imageUrl: msg.fileUrl,
                    isRecalled: msg.isRecalled,
                    sender: msg.sender,
                    isMyMessage: msg.senderId === profileId,
                    isPending: false
                }));

                console.log('Formatted messages:', formattedMessages);

                // Lọc tin nhắn trùng lặp dựa trên ID
                const existingIds = new Set(messages.map(msg => msg.id));
                const newMessages = formattedMessages.filter(msg => !existingIds.has(msg.id));

                if (newMessages.length === 0) {
                    console.log('Không có tin nhắn mới để thêm');
                    setHasMore(false);
                    setNextCursor(null);
                    return;
                }

                // Thêm tin nhắn mới vào đầu danh sách (vì inverted)
                const updatedMessages = [...newMessages, ...messages];

                dispatch(setMessages(updatedMessages));
                setNextCursor(result.data.nextCursor);
                setHasMore(result.data.hasMore);
                setForceUpdate(prev => prev + 1);

                // Scroll đến vị trí mới
                setTimeout(() => {
                    if (flatListRef.current) {
                        flatListRef.current.scrollToIndex({
                            index: newMessages.length - 1,
                            animated: false,
                            viewPosition: 0
                        });
                    }
                }, 100);
            } else {
                console.log('Không còn tin nhắn để tải hoặc API trả về lỗi:', result);
                setHasMore(false);
                setNextCursor(null);
            }
        } catch (error) {
            console.error('Lỗi khi tải tin nhắn:', error);
            setHasMore(false);
            setNextCursor(null);
        } finally {
            setIsLoadingMore(false);
        }
    };

    if (isLoading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#FF7A1E" /></View>;
    }

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item, index }) => renderMessage({ item, index })}
            keyExtractor={item => `${item.id || item.tempId}_${forceUpdate}`}
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            inverted={true}
            maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10
            }}
            onEndReached={() => {
                if (!isLoadingMore && hasMore) {
                    console.log('onEndReached triggered');
                    loadMore();
                }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={isLoadingMore && (
                <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color="#FF7A1E" />
                    <Text style={styles.loadingText}>Đang tải tin nhắn cũ...</Text>
                </View>
            )}
            extraData={forceUpdate}
            onScrollToIndexFailed={(info) => {
                console.error('Scroll to index failed:', info);
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index: Math.max(0, info.highestMeasuredFrameIndex),
                        animated: false
                    });
                }, 100);
            }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
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
    },
    loadingMore: {
        padding: 10,
        alignItems: 'center'
    }
});

export default MessageList;