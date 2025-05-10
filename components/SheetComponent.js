import React from 'react'
import { Sheet } from '@tamagui/sheet'

const SheetComponent = ({
    open,
    onOpenChange,
    snapPoints = [30, 70, 100],
    children,
    zIndex = 100_002,
    animation = "quick",
    defaultSnapPoint = 0,
    forceRemoveScrollEnabled = false
}) => {
    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            modal
            dismissOnSnapToBottom
            snapPoints={snapPoints}
            defaultSnapPoint={defaultSnapPoint}
            forceRemoveScrollEnabled={forceRemoveScrollEnabled}
            zIndex={zIndex}
            animation={animation}
            disableDrag 
        >
            <Sheet.Overlay
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
                backgroundColor="rgba(0,0,0,0.4)"
            />
            <Sheet.Handle />
            <Sheet.Frame
                padding="$4"
                space
                backgroundColor="#fff"
            >
                {children}
            </Sheet.Frame>
        </Sheet>
    )
}


export default SheetComponent
