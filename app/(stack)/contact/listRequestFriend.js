import { View } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getReceivedRequests, getSentRequests } from '~/redux/thunks/friend'
import HeaderLeft from '../../../components/header/HeaderLeft'
import { useLocalSearchParams } from 'expo-router'
import { Text, YStack, XStack, Tabs, ScrollView, Avatar } from "tamagui"
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router';

const RequestItem = ({ name, time, type, avatar, profileId }) => {
    const router = useRouter();

    const handleProfile = (profileId) => {
        router.push({
            pathname: '/profile/[id]',
            params: {
                id: profileId,
                goBackTo: '/contact/listRequestFriend',
            },
        });
    };

    return (
        <XStack padding={16} alignItems="center" space={12} pressStyle={{ opacity: 0.7 }}>
            <YStack
                flex={1}
                flexDirection="row"
                alignItems="center"
                space={12}
                onPress={() => handleProfile(profileId)}
            >
                {avatar ? (
                    <Avatar circular size={48}>
                        <Avatar.Image source={{ uri: avatar }} />
                        <Avatar.Fallback>
                            <Ionicons name="person" size={24} color="#666" />
                        </Avatar.Fallback>
                    </Avatar>
                ) : (
                    <YStack width={48} height={48} backgroundColor="$gray5" borderRadius={25} />
                )}
                <YStack flex={1}>
                    <Text fontSize={16} color="#1A1A1A">{name}</Text>
                    <Text fontSize={14} color="$gray10">{time}</Text>
                </YStack>
            </YStack>

            {type === "received" ? (
                <XStack space={8}>
                    {/* <YStack
                        backgroundColor="$gray5"
                        paddingHorizontal={20}
                        paddingVertical={8}
                        borderRadius={20}
                    >
                        <Text>Từ chối</Text>
                    </YStack> */}
                    {/* <YStack
                        backgroundColor="#FE781F"
                        paddingHorizontal={20}
                        paddingVertical={8}
                        borderRadius={20}
                    >
                        <Text color="white"></Text>
                    </YStack> */}
                </XStack>
            ) : (
                <YStack
                    backgroundColor="$gray5"
                    paddingHorizontal={20}
                    paddingVertical={8}
                    borderRadius={20}
                >
                    {/* <Text>Thu hồi</Text> */}
                </YStack>
            )}
        </XStack>
    )
}

const ListRequestFriend = () => {
    const dispatch = useDispatch();
    const { sentRequests, receivedRequests } = useSelector((state) => state.friend);
    const { goBackTo } = useLocalSearchParams()
    const [activeTab, setActiveTab] = useState("received")

    useEffect(() => {
        dispatch(getReceivedRequests());
        dispatch(getSentRequests());
    }, [dispatch]);

    return (
        <YStack flex={1} backgroundColor="white">
            <HeaderLeft goBack={goBackTo} title="Lời mời kết bạn" />

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                flexDirection="column"
                flex={1}
            >
                <XStack borderBottomWidth={1} borderColor="$gray5">
                    <Tabs.List flex={1} borderBottomWidth={0}>
                        <Tabs.Tab flex={1} value="received" backgroundColor="transparent">
                            <Text
                                fontSize={16}
                                fontWeight={activeTab === "received" ? "bold" : "normal"}
                                color={activeTab === "received" ? "#FE781F" : "$gray11"}
                            >
                                Đã nhận ({receivedRequests?.length || 0})
                            </Text>
                            {activeTab === "received" && (
                                <YStack
                                    position="absolute"
                                    bottom={0}
                                    width="100%"
                                    height={2}
                                    backgroundColor="#FE781F"
                                />
                            )}
                        </Tabs.Tab>
                        <Tabs.Tab flex={1} value="sent" backgroundColor="transparent">
                            <Text
                                fontSize={16}
                                fontWeight={activeTab === "sent" ? "bold" : "normal"}
                                color={activeTab === "sent" ? "#FE781F" : "$gray11"}
                            >
                                Đã gửi ({sentRequests?.length || 0})
                            </Text>
                            {activeTab === "sent" && (
                                <YStack
                                    position="absolute"
                                    bottom={0}
                                    width="100%"
                                    height={2}
                                    backgroundColor="#FE781F"
                                />
                            )}
                        </Tabs.Tab>
                    </Tabs.List>
                </XStack>

                <Tabs.Content value="received" flex={1}>
                    <ScrollView>
                        <Text padding={16} color="$gray11">Lời mời đã nhận</Text>
                        {receivedRequests?.map((request) => (
                            <RequestItem
                                key={request.id}
                                profileId={request.profileId}
                                name={request.name}
                                time={request.createdAt}
                                type="received"
                                avatar={request.avatar}
                            />
                        ))}
                        {!receivedRequests?.length && (
                            <Text padding={16} color="$gray11" textAlign="center">
                                Chưa có lời mời kết bạn nào
                            </Text>
                        )}
                    </ScrollView>
                </Tabs.Content>

                <Tabs.Content value="sent" flex={1}>
                    <ScrollView>
                        <Text padding={16} color="$gray11">Đã gửi</Text>
                        {sentRequests?.map((request) => (
                            <RequestItem
                                key={request.id}
                                profileId={request.profileId}
                                name={request.name}
                                time={request.createdAt} // Có thể cần format lại thời gian
                                type="sent"
                                avatar={request.avatar}
                            />
                        ))}
                        {!sentRequests?.length && (
                            <Text padding={16} color="$gray11" textAlign="center">
                                Chưa có lời mời nào được gửi
                            </Text>
                        )}
                    </ScrollView>
                </Tabs.Content>
            </Tabs>
        </YStack>
    )
}

export default ListRequestFriend