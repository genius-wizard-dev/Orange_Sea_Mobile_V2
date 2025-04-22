import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Sheet } from '@tamagui/sheet'
import { Button, H2, Input, Paragraph, XStack, YStack } from 'tamagui'

import MeHeaderComponent from "./header/MeHeaderComponent";
import { router } from 'expo-router';
// import { color_main } from '../../styleMixins/@minxin';

const HeaderSearchComponent = () => {
    const [open, setOpen] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    const screenName = route.name.toLowerCase();

    const renderConponentSelectHeader = () => {
        if (screenName === "me") {
            return <MeHeaderComponent navigation={navigation} />;
        }
        if (screenName === "chat") {
            return (
                <TouchableOpacity onPress={() => setOpen(true)}>
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            );
        }
    };


    const handleLinkAddFriend = () => {
        router.push({
            pathname: '/friend/addFriend',
            params: { goBackTo: '/chat' },
        });
    }

    return (
        <>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.navigate("SearchPage")}>
                    <View style={styles.lineSeNavi}>
                        <Ionicons name="search" size={20} color="#fff" style={{ marginTop: 4 }} />
                        <Text style={styles.textSeNavi}>Tìm kiếm</Text>
                    </View>
                </TouchableOpacity>
                <View>
                    {renderConponentSelectHeader()}
                </View>
            </View>

            <Sheet
                modal
                open={open}
                onOpenChange={setOpen}
                snapPoints={[30]}
                dismissOnSnapToBottom
                forceRemoveScrollEnabled={open}
                zIndex={100_000}
                animation="medium"
            >
                <Sheet.Overlay
                    animation="quick"
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                />
                <Sheet.Handle />
                <Sheet.Frame
                    padding="$2"
                    justifyContent="center"
                    alignItems="center"
                >
                    <YStack space="$2" width="100%" paddingHorizontal="$2">
                        <Button
                            size="$5"
                            width="100%"
                            onPress={() => handleLinkAddFriend()}
                            icon={<Ionicons name="person-add-outline" size={20} color="currentColor" />}
                        >
                            Thêm bạn bè
                        </Button>
                        <Button
                            size="$5"
                            width="100%"
                            onPress={() => {
                                setOpen(false);
                                navigation.navigate('NewDirectMessage');
                            }}
                            icon={<Ionicons name="people-outline" size={20} color="currentColor" />}
                        >
                            Tạo nhóm
                        </Button>
                        <Button
                            size="$5"
                            width="100%"
                            onPress={() => {
                                setOpen(false);
                                navigation.navigate('NewDirectMessage');
                            }}
                            icon={<Ionicons name="cloud-outline" size={20} color="currentColor" />}
                        >
                            Cloud của tôi
                        </Button>
                    </YStack>
                </Sheet.Frame>
            </Sheet>
        </>
    );
};

export default HeaderSearchComponent;

const styles = StyleSheet.create({
    headerContainer: {
        width: "100%",
        height: 50,
        backgroundColor: "#FF7A1E",
        justifyContent: "space-between",
        padding: 10,
        paddingRight: 15,
        paddingLeft: 15,
        flexDirection: "row",
        borderBottomColor: "#eaeaea",
        borderWidth: 1
    },
    lineSeNavi: {
        height: "100%",
        flexDirection: "row",
        alignItems: "center", // ✅ Cho icon & text thẳng hàng
    },
    textSeNavi: {
        marginLeft: 15,
        fontSize: 16,
        color: "#fff"
    }
});
