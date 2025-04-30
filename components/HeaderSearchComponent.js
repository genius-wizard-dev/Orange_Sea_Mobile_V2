import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons'; // ✅ Dùng icon của Expo

import MeHeaderComponent from "./header/MeHeaderComponent";
// import { color_main } from '../../styleMixins/@minxin';

const HeaderSearchComponent = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const screenName = route.name.toLowerCase();

    const renderConponentSelectHeader = () => {
        if (screenName === "me") {
            return <MeHeaderComponent navigation={navigation} />;
        }
    };

    return (
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
