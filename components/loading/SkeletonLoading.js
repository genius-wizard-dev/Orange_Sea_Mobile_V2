import React, { useEffect, useState } from 'react';
import { View } from 'tamagui';
import { StyleSheet, Animated, Easing } from 'react-native';

const SkeletonLoading = ({ width, height, borderRadius = 4, style }) => {
    const animatedValue = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1500,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-350, 350],
    });

    return (
        <View
            style={[
                styles.container,
                { width, height, borderRadius },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E1E9EE',
        overflow: 'hidden',
    },
    shimmer: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        backgroundColor: '#F2F8FC',
        opacity: 0.5,
        transform: [{ translateX: -350 }],
    },
});

export default SkeletonLoading;