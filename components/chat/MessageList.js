import React, { useEffect, useImperativeHandle, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import MessageItem from './MessageItem';
import { useDispatch } from 'react-redux';
import { setMessages } from '../../redux/slices/chatSlice';
import { fetchPaginatedMessages } from '../../redux/thunks/chat';
import MessageListSkeleton from '../loading/messages/MessageListSkeleton';
import { ImageBackground } from 'expo-image';

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

    const [isRefreshing, setIsRefreshing] = useState(false);
    const loadingRef = useRef(false);

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
        const dateObj = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // Kiểm tra nếu là hôm nay
        if (isSameDay(dateObj, today)) {
            return 'Hôm nay';
        }

        // Kiểm tra nếu là hôm qua
        if (isSameDay(dateObj, yesterday)) {
            return 'Hôm qua';
        }

        // Mapping thứ ngắn gọn
        const shortWeekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const weekday = shortWeekdays[dateObj.getDay()];

        const dateString = dateObj.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `${weekday}, ${dateString}`;
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
                        <View style={styles.dateHeaderLineBorder} >
                            {/* <View style={styles.dateHeaderLine} /> */}
                            <Text style={styles.dateHeaderText}>
                                {formatDateHeader(item.createdAt)}
                            </Text>
                            {/* <View style={styles.dateHeaderLine} /> */}
                        </View>

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

    const loadMore = useCallback(async () => {
        // Kiểm tra điều kiện load more
        if (loadingRef.current || isLoadingMore || !nextCursor || !groupId) {
            console.log('Skip load more:', {
                loading: loadingRef.current,
                isLoadingMore,
                nextCursor,
                groupId
            });
            return;
        }

        console.log('=== LOAD MORE MESSAGES ===');
        console.log('Current nextCursor:', nextCursor);
        console.log('Current messages count:', messages.length);

        loadingRef.current = true;
        setIsLoadingMore(true);

        try {
            const result = await dispatch(fetchPaginatedMessages({
                groupId,
                cursor: nextCursor // Sử dụng nextCursor hiện tại
            })).unwrap();

            console.log('Load more result:', result);

            if (result?.statusCode === 200 && result.data?.messages?.length > 0) {
                // SỬA: Mapping imageUrl đúng cho loadMore
                const formattedMessages = result.data.messages.map(msg => {
                    const imageUrl = msg.fileUrl ||
                        msg.imageUrl ||
                        msg.url ||
                        msg.image ||
                        msg.attachmentUrl ||
                        msg.file ||
                        msg.media ||
                        msg.src ||
                        msg.path ||
                        msg.link;

                    return {
                        id: msg.id,
                        message: msg.content,
                        senderId: msg.senderId,
                        groupId: msg.groupId,
                        createdAt: msg.createdAt,
                        updatedAt: msg.updatedAt,
                        type: msg.type,
                        imageUrl: imageUrl, // SỬA: Sử dụng imageUrl đã detect
                        fileName: msg.fileName,
                        fileSize: msg.fileSize,
                        isRecalled: msg.isRecalled,
                        sender: msg.sender,
                        isMyMessage: msg.senderId === profileId,
                        originalContent: msg.originalContent,
                        isPending: false
                    };
                });

                console.log('=== DEBUG FORMATTED MESSAGES ===');
                formattedMessages.forEach((msg, index) => {
                    if (msg.type === 'IMAGE' || msg.type === 'VIDEO') {
                        console.log(`${msg.type} message ${index}:`, {
                            id: msg.id,
                            type: msg.type,
                            imageUrl: msg.imageUrl
                        });
                    }
                });

                // Gọi callback để cập nhật messages và nextCursor
                onLoadMoreMessages({
                    messages: formattedMessages,
                    nextCursor: result.data.nextCursor
                });

                // Cập nhật nextCursor cho lần load tiếp theo
                setNextCursor(result.data.nextCursor);

                console.log('Updated nextCursor:', result.data.nextCursor);
                console.log('New messages loaded:', formattedMessages.length);
            } else {
                console.log('No more messages to load');
                setNextCursor(null); // Không còn tin nhắn để load
            }
        } catch (error) {
            console.error('Error loading more messages:', error);
        } finally {
            loadingRef.current = false;
            setIsLoadingMore(false);
        }
    }, [dispatch, groupId, nextCursor, messages.length, profileId, onLoadMoreMessages, setNextCursor, isLoadingMore]);


    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const result = await dispatch(fetchPaginatedMessages({
                groupId,
                cursor: null // Reset cursor để load từ đầu
            })).unwrap();

            if (result?.statusCode === 200 && result.data?.messages?.length > 0) {
                const formattedMessages = result.data.messages.map(msg => ({
                    id: msg.id,
                    message: msg.content,
                    senderId: msg.senderId,
                    groupId: msg.groupId,
                    createdAt: msg.createdAt,
                    updatedAt: msg.updatedAt,
                    type: msg.type,
                    imageUrl: msg.fileUrl || msg.imageUrl,
                    fileName: msg.fileName,
                    fileSize: msg.fileSize,
                    isRecalled: msg.isRecalled,
                    sender: msg.sender,
                    isMyMessage: msg.senderId === profileId,
                    originalContent: msg.originalContent,
                    isPending: false
                }));

                onLoadMoreMessages({
                    messages: formattedMessages,
                    nextCursor: result.data.nextCursor,
                    refresh: true // Flag để replace thay vì append
                });

                setNextCursor(result.data.nextCursor);
            }
        } catch (error) {
            console.error('Error refreshing messages:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [dispatch, groupId, profileId, onLoadMoreMessages, setNextCursor]);


    // Render loading indicator ở đầu danh sách
    const renderLoadMoreIndicator = () => {
        if (!isLoadingMore) return null;

        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#FF7A1E" />
                <Text fontSize={12} color="#666" marginTop={8}>
                    Đang tải tin nhắn cũ...
                </Text>
            </View>
        );
    };

    const renderEmptyComponent = () => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text fontSize={16} color="#666" textAlign="center">
                Chưa có tin nhắn nào
            </Text>
            <Text fontSize={14} color="#999" textAlign="center" marginTop={8}>
                Hãy bắt đầu cuộc trò chuyện!
            </Text>
        </View>
    );


    if (isLoading) {
        return <MessageListSkeleton />;
    }

    return (

        <ImageBackground
            source={require('../../assets/bgr_mess.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
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
                onEndReached={loadMore}
                onEndReachedThreshold={0.2}
                ListFooterComponent={renderLoadMoreIndicator}
                ListEmptyComponent={renderEmptyComponent}
                extraData={forceUpdate}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor="#FF7A1E"
                        colors={['#FF7A1E']}
                    />
                }
                // onScrollToIndexFailed={(info) => {
                //     console.error('Scroll to index failed:', info);
                //     setTimeout(() => {
                //         flatListRef.current?.scrollToIndex({
                //             index: Math.max(0, info.highestMeasuredFrameIndex),
                //             animated: false
                //         });
                //     }, 100);
                // }}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                initialNumToRender={20}
                windowSize={5}
            />
        </ImageBackground>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 70,
        paddingBottom: 50,
    },
    contentContainer: {
        flexGrow: 1,
        paddingBottom: 20,
        paddingTop: 10,
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
        paddingHorizontal: 20,
        zIndex: 1
    },
    dateHeaderLineBorder: {
        backgroundColor: '#918787',
        width: "150",
        textAlign: 'center',
        borderRadius: 20,

    },
    dateHeaderLine: {
        flex: 1,
        // height: 1,
        // backgroundColor: '#E5E5E5'
    },
    dateHeaderText: {
        color: '#fff',
        fontSize: 12,
        marginHorizontal: 20,
        padding: 3,
        fontWeight: '500',
        textAlign: 'center',
    },
    loadingMore: {
        padding: 10,
        alignItems: 'center'
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
    }
});

export default MessageList;