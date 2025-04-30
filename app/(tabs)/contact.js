import { Text, YStack, XStack, Input, Tabs, ScrollView } from "tamagui";
import { Ionicons } from '@expo/vector-icons';
import { useState } from "react";
import { useNavigation, useRouter } from "expo-router";

const ContactItem = ({ name, isSystem, onPress }) => (
    <XStack padding={16} alignItems="center" space={12}
        onPress={onPress}>
        {isSystem ? (
            <YStack
                width={48}
                height={48}
                backgroundColor="#f9a875"
                borderRadius={25}
                alignItems="center"
                justifyContent="center"
            >
                <Ionicons name={isSystem === "invite" ? "people" : isSystem === "phonebook" ? "book" : "cake"} size={24} color="white" />
            </YStack>
        ) : (
            <YStack
                width={48}
                height={48}
                backgroundColor="$gray5"
                borderRadius={25} />
        )}
        <YStack flex={1}>
            <Text fontSize={16} color="#1A1A1A">{name}</Text>
            {isSystem === "phonebook" && (
                <Text fontSize={14} color="$gray10">Các liên hệ có dùng Zalo</Text>
            )}
        </YStack>
        {/* {!isSystem && (
            <XStack space={12}>
                <Ionicons name="call-outline" size={24} color="#666" />
                <Ionicons name="videocam-outline" size={24} color="#666" />
            </XStack>
        )} */}
    </XStack>
);

export default function Contact() {
    const [activeTab, setActiveTab] = useState("friends");
    const navigation = useNavigation(); // Assuming you are using React Navigation
    const router = useRouter();
    const handleOpenPageReq = () => {
        router.push({
            pathname: '/contact/listRequestFriend',
            params: { goBackTo: '/contact' },
        });
    }

    return (
        <YStack flex={1} backgroundColor="white">
            {/* <YStack paddingTop={50} paddingHorizontal={16}>
                <XStack alignItems="center" space={12}>
                    <Input
                        flex={1}
                        placeholder="Tìm kiếm"
                        paddingLeft={40}
                        backgroundColor="$gray3"
                        borderWidth={0}
                    />
                    <Ionicons name="person-add-outline" size={24} color="#0068FF" />
                </XStack>
            </YStack> */}

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                flexDirection="column"
                flex={1}
                paddingTop={0}
            >
                <XStack borderBottomWidth={1} borderColor="$gray5">
                    <Tabs.List flex={1} borderBottomWidth={0}>
                        <Tabs.Tab flex={1} value="friends" backgroundColor="transparent">
                            <Text
                                fontSize={16}
                                fontWeight={activeTab === "friends" ? "bold" : "normal"}
                                color={activeTab === "friends" ? "#FE781F" : "$gray11"}
                            >
                                Bạn bè
                            </Text>
                            {activeTab === "friends" && (
                                <YStack
                                    position="absolute"
                                    bottom={0}
                                    width="100%"
                                    height={2}
                                    backgroundColor="#FE781F"
                                />
                            )}
                        </Tabs.Tab>
                        <Tabs.Tab flex={1} value="groups" backgroundColor="transparent">
                            <Text
                                fontSize={16}
                                fontWeight={activeTab === "groups" ? "bold" : "normal"}
                                color={activeTab === "groups" ? "#FE781F" : "$gray11"}
                            >
                                Nhóm
                            </Text>
                            {activeTab === "groups" && (
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

                <Tabs.Content value="friends" flex={1}>
                    <ScrollView>
                        <XStack padding={12} space={5}>
                            <Text fontSize={14} color="$gray11">Tất cả</Text>
                            <Text fontSize={14} color="$gray11" >3</Text>
                        </XStack>

                        <ContactItem
                            name="Lời mời kết bạn"
                            isSystem="invite"
                            onPress={()=>handleOpenPageReq()}
                        />
                        {/* <ContactItem name="Danh bạ máy" isSystem="phonebook" />
                        <ContactItem name="Sinh nhật" isSystem="birthday" /> */}

                        <Text padding={16} fontSize={16} color="$gray11">Danh sách bạn bè</Text>
                        <ContactItem name="Nguyen V Phong" />
                        <ContactItem name="Yume - Nhi Nhi" />
                        <ContactItem name="Zalo" />
                        <ContactItem name="Zalo" />
                        <ContactItem name="Zalo" />
                    </ScrollView>
                </Tabs.Content>

                <Tabs.Content value="groups" flex={1}>
                    <YStack flex={1} justifyContent="center" alignItems="center">
                        <Text>Không có nhóm nào</Text>
                    </YStack>
                </Tabs.Content>
            </Tabs>
        </YStack>
    );
}