import { View } from 'react-native'
import React, { useState } from 'react'
import HeaderLeft from '../../../components/header/HeaderLeft'
import { useLocalSearchParams } from 'expo-router'
import { Text, YStack, XStack, Tabs, ScrollView } from "tamagui"

const RequestItem = ({ name, time, type }) => (
    <XStack padding={16} alignItems="center" space={12}>
        <YStack width={48} height={48} backgroundColor="$gray5" borderRadius={25} />
        <YStack flex={1}>
            <Text fontSize={16} color="#1A1A1A">{name}</Text>
            <Text fontSize={14} color="$gray10">{time}</Text>
        </YStack>
        {type === "received" ? (
            <XStack space={8}>
                <YStack
                    backgroundColor="$gray5"
                    paddingHorizontal={20}
                    paddingVertical={8}
                    borderRadius={20}
                >
                    <Text>Từ chối</Text>
                </YStack>
                <YStack
                    backgroundColor="#FE781F"
                    paddingHorizontal={20}
                    paddingVertical={8}
                    borderRadius={20}
                >
                    <Text color="white">Đồng ý</Text>
                </YStack>
            </XStack>
        ) : (
            <YStack
                backgroundColor="$gray5"
                paddingHorizontal={20}
                paddingVertical={8}
                borderRadius={20}
            >
                <Text>Thu hồi</Text>
            </YStack>
        )}
    </XStack>
)

const ListRequestFriend = () => {
    const { goBackTo } = useLocalSearchParams()
    const [activeTab, setActiveTab] = useState("received")

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
                                Đã nhận (47)
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
                                Đã gửi (1)
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
                        <Text padding={16} color="$gray11">Tháng 03, 2025</Text>
                        <RequestItem
                            name="Nguyễn Tiến"
                            time="18/03/2025"
                            type="received"
                        />
                        <RequestItem
                            name="Tiệm Bé Cá"
                            time="05/03/2025"
                            type="received"
                        />
                        <RequestItem
                            name="Sp"
                            time="18/01/2025"
                            type="received"
                        />
                    </ScrollView>
                </Tabs.Content>

                <Tabs.Content value="sent" flex={1}>
                    <ScrollView>
                        <Text padding={16} color="$gray11">Hôm nay</Text>
                        <RequestItem
                            name="SANG"
                            time="15 phút trước"
                            type="sent"
                            source="Bạn cùng nhóm"
                        />
                    </ScrollView>
                </Tabs.Content>
            </Tabs>
        </YStack>
    )
}

export default ListRequestFriend