import { Text, YStack, XStack, Input, Tabs, ScrollView, Spinner } from "tamagui";
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from "react";
import { useNavigation, useRouter } from "expo-router";
import { useDispatch, useSelector } from 'react-redux';
import { getFriendList } from '../../redux/thunks/friend';
import { Image } from 'react-native';
import DefaultAvatar from "~/components/chat/DefaultAvatar";

const ContactItem = ({ name, isSystem, onPress, avatar }) => (
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
                borderRadius={25}
                overflow="hidden"
            >
                {avatar ? (
                    <Image
                        source={{ uri: avatar }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                ) : (
                    <DefaultAvatar name={name} size={52} />
                )}
            </YStack>
        )}
        <YStack flex={1}>
            <Text fontSize={16} color="#1A1A1A">{name}</Text>
            {isSystem === "phonebook" && (
                <Text fontSize={14} color="$gray10">Các liên hệ có dùng Zalo</Text>
            )}
        </YStack>
    </XStack>
);

export default function Contact() {
    const [activeTab, setActiveTab] = useState("friends");
    const navigation = useNavigation();
    const router = useRouter();
    const dispatch = useDispatch();
    const { friends, loading } = useSelector((state) => state.friend);
    const { profile } = useSelector((state) => state.profile);

    useEffect(() => {
        dispatch(getFriendList());
    }, [dispatch]);

    const handleOpenPageReq = () => {
        router.push({
            pathname: '/contact/listRequestFriend',
            params: { goBackTo: '/contact' },
        });
    }

    const handleOpenProfile = (friendProfile) => {
        // console.log(friendProfile)
        router.push({
            pathname: '/profile/[id]',
            params: {
                id: friendProfile.profileId,
                goBackTo: '/contact',
            },
        });
    };

    // console.log("friends", friends)


    return (
        <YStack flex={1} backgroundColor="white">
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

                <ScrollView
                    width="100%"
                    height="100%"
                    bounces={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <Tabs.Content value="friends" flex={1}>
                        <ScrollView>
                            <XStack padding={12} space={5}>
                                <Text fontSize={14} color="$gray11">Tất cả</Text>
                                <Text fontSize={14} color="$gray11" >{friends.data?.length || 0}</Text>
                            </XStack>

                            <ContactItem
                                name="Lời mời kết bạn"
                                isSystem="invite"
                                onPress={handleOpenPageReq}
                            />

                            <Text padding={16} fontSize={16} color="$gray11">Danh sách bạn bè</Text>

                            {loading ? (
                                <YStack height={200} justifyContent="center" alignItems="center">
                                    <Spinner size="large" color="$orange10" />
                                </YStack>
                            ) : friends.data?.length > 0 ? (
                                friends.data.map((friend) => (
                                    <ContactItem
                                        key={friend.id}
                                        name={friend.name}
                                        avatar={friend.avatar}
                                        onPress={() => handleOpenProfile(friend)

                                        }
                                    />
                                ))
                            ) : (
                                <YStack height={200} justifyContent="center" alignItems="center">
                                    <Text color="$gray11">Chưa có bạn bè</Text>
                                </YStack>
                            )}
                        </ScrollView>
                    </Tabs.Content>

                    <Tabs.Content value="groups" flex={1}>
                        <YStack flex={1} justifyContent="center" alignItems="center">
                            <Text>Không có nhóm nào</Text>
                        </YStack>
                    </Tabs.Content>
                </ScrollView>
            </Tabs>
        </YStack>
    );
}