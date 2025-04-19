import { Text, YStack } from "tamagui";

export default function Contact() {
    return(
        <YStack width="100%" flex={1} backgroundColor="white" paddingTop={70}>
            <YStack paddingHorizontal={20} justifyContent="center" alignItems="center" marginBottom={20}>
                <Text fontSize={34} fontWeight="bold" color="#1A1A1A">
                    Liên hệ
                </Text>
            </YStack>
            <YStack flex={1} marginTop={20} paddingHorizontal={20}>
                <Text>Contact</Text>
            </YStack>
        </YStack>
    )
}