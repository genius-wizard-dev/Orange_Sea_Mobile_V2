<YStack flex={1}>
    <MessageList 
        style={{ 
            marginBottom: Platform.OS === 'ios' ? 60 : 50 // thêm margin bottom cho MessageList
        }}
        // ...existing props
    />
    <MessageInput />
</YStack>
