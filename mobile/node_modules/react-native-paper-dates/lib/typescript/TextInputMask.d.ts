import * as React from 'react';
declare const _default: React.ForwardRefExoticComponent<Pick<Pick<import("react-native").TextInputProps & React.RefAttributes<import("react-native").TextInput> & {
    mode?: "flat" | "outlined" | undefined;
    left?: React.ReactNode;
    right?: React.ReactNode;
    disabled?: boolean | undefined;
    label?: import("react-native-paper/lib/typescript/components/TextInput/types").TextInputLabelProp | undefined;
    placeholder?: string | undefined;
    error?: boolean | undefined;
    onChangeText?: Function | undefined;
    selectionColor?: string | undefined;
    underlineColor?: string | undefined;
    activeUnderlineColor?: string | undefined;
    outlineColor?: string | undefined;
    activeOutlineColor?: string | undefined;
    textColor?: string | undefined;
    dense?: boolean | undefined;
    multiline?: boolean | undefined;
    numberOfLines?: number | undefined;
    onFocus?: ((args: any) => void) | undefined;
    onBlur?: ((args: any) => void) | undefined;
    render?: ((props: import("react-native-paper/lib/typescript/components/TextInput/types").RenderProps) => React.ReactNode) | undefined;
    value?: string | undefined;
    style?: import("react-native").StyleProp<import("react-native").TextStyle>;
    theme: import("react-native-paper/lib/typescript/types").InternalTheme;
    testID?: string | undefined;
    outlineStyle?: import("react-native").StyleProp<import("react-native").ViewStyle>;
    underlineStyle?: import("react-native").StyleProp<import("react-native").ViewStyle>;
} & React.RefAttributes<{
    focus: () => void;
    clear: () => void;
    blur: () => void;
    isFocused: () => boolean;
    setNativeProps: (nativeProps: object) => void;
}>, "label" | "style" | "children" | "pointerEvents" | "allowFontScaling" | "numberOfLines" | "onLayout" | "onPressIn" | "onPressOut" | "testID" | "nativeID" | "maxFontSizeMultiplier" | "disabled" | "selectionColor" | "textBreakStrategy" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "accessibilityRole" | "accessibilityState" | "accessibilityHint" | "accessibilityValue" | "onAccessibilityAction" | "accessibilityLabelledBy" | "accessibilityLiveRegion" | "importantForAccessibility" | "accessibilityElementsHidden" | "accessibilityLanguage" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "left" | "right" | "ref" | "key" | "hitSlop" | "removeClippedSubviews" | "collapsable" | "needsOffscreenAlphaCompositing" | "renderToHardwareTextureAndroid" | "focusable" | "shouldRasterizeIOS" | "isTVSelectable" | "hasTVPreferredFocus" | "tvParallaxProperties" | "tvParallaxShiftDistanceX" | "tvParallaxShiftDistanceY" | "tvParallaxTiltAngle" | "tvParallaxMagnification" | "onStartShouldSetResponder" | "onMoveShouldSetResponder" | "onResponderEnd" | "onResponderGrant" | "onResponderReject" | "onResponderMove" | "onResponderRelease" | "onResponderStart" | "onResponderTerminationRequest" | "onResponderTerminate" | "onStartShouldSetResponderCapture" | "onMoveShouldSetResponderCapture" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel" | "onTouchEndCapture" | "onPointerEnter" | "onPointerEnterCapture" | "onPointerLeave" | "onPointerLeaveCapture" | "onPointerMove" | "onPointerMoveCapture" | "onPointerCancel" | "onPointerCancelCapture" | "onPointerDown" | "onPointerDownCapture" | "onPointerUp" | "onPointerUpCapture" | "value" | "mode" | "error" | "placeholder" | "onFocus" | "onBlur" | "onChange" | "onKeyPress" | "onScroll" | "defaultValue" | "spellCheck" | "autoCapitalize" | "autoCorrect" | "autoFocus" | "autoComplete" | "maxLength" | "textAlign" | "textAlignVertical" | "multiline" | "onContentSizeChange" | "scrollEnabled" | "textColor" | "dense" | "render" | "blurOnSubmit" | "caretHidden" | "contextMenuHidden" | "editable" | "keyboardType" | "onChangeText" | "onEndEditing" | "onSelectionChange" | "onSubmitEditing" | "onTextInput" | "placeholderTextColor" | "returnKeyType" | "secureTextEntry" | "selectTextOnFocus" | "selection" | "inputAccessoryViewID" | "clearButtonMode" | "clearTextOnFocus" | "dataDetectorTypes" | "enablesReturnKeyAutomatically" | "keyboardAppearance" | "passwordRules" | "rejectResponderTermination" | "selectionState" | "textContentType" | "cursorColor" | "importantForAutofill" | "disableFullscreenUI" | "inlineImageLeft" | "inlineImagePadding" | "returnKeyLabel" | "underlineColorAndroid" | "showSoftInputOnFocus" | "underlineColor" | "activeUnderlineColor" | "outlineColor" | "activeOutlineColor" | "outlineStyle" | "underlineStyle"> & {
    theme?: import("@callstack/react-theme-provider").$DeepPartial<unknown> | undefined;
} & {
    mask: string;
    value: string;
}, "label" | "style" | "children" | "pointerEvents" | "allowFontScaling" | "numberOfLines" | "onLayout" | "onPressIn" | "onPressOut" | "testID" | "nativeID" | "maxFontSizeMultiplier" | "disabled" | "selectionColor" | "textBreakStrategy" | "accessible" | "accessibilityActions" | "accessibilityLabel" | "accessibilityRole" | "accessibilityState" | "accessibilityHint" | "accessibilityValue" | "onAccessibilityAction" | "accessibilityLabelledBy" | "accessibilityLiveRegion" | "importantForAccessibility" | "accessibilityElementsHidden" | "accessibilityLanguage" | "accessibilityViewIsModal" | "onAccessibilityEscape" | "onAccessibilityTap" | "onMagicTap" | "accessibilityIgnoresInvertColors" | "left" | "right" | "key" | "hitSlop" | "removeClippedSubviews" | "collapsable" | "needsOffscreenAlphaCompositing" | "renderToHardwareTextureAndroid" | "focusable" | "shouldRasterizeIOS" | "isTVSelectable" | "hasTVPreferredFocus" | "tvParallaxProperties" | "tvParallaxShiftDistanceX" | "tvParallaxShiftDistanceY" | "tvParallaxTiltAngle" | "tvParallaxMagnification" | "onStartShouldSetResponder" | "onMoveShouldSetResponder" | "onResponderEnd" | "onResponderGrant" | "onResponderReject" | "onResponderMove" | "onResponderRelease" | "onResponderStart" | "onResponderTerminationRequest" | "onResponderTerminate" | "onStartShouldSetResponderCapture" | "onMoveShouldSetResponderCapture" | "onTouchStart" | "onTouchMove" | "onTouchEnd" | "onTouchCancel" | "onTouchEndCapture" | "onPointerEnter" | "onPointerEnterCapture" | "onPointerLeave" | "onPointerLeaveCapture" | "onPointerMove" | "onPointerMoveCapture" | "onPointerCancel" | "onPointerCancelCapture" | "onPointerDown" | "onPointerDownCapture" | "onPointerUp" | "onPointerUpCapture" | "value" | "mode" | "error" | "placeholder" | "onFocus" | "onBlur" | "onChange" | "onKeyPress" | "onScroll" | "defaultValue" | "spellCheck" | "autoCapitalize" | "autoCorrect" | "autoFocus" | "autoComplete" | "maxLength" | "textAlign" | "textAlignVertical" | "multiline" | "onContentSizeChange" | "scrollEnabled" | "textColor" | "dense" | "render" | "blurOnSubmit" | "caretHidden" | "contextMenuHidden" | "editable" | "keyboardType" | "onChangeText" | "onEndEditing" | "onSelectionChange" | "onSubmitEditing" | "onTextInput" | "placeholderTextColor" | "returnKeyType" | "secureTextEntry" | "selectTextOnFocus" | "selection" | "inputAccessoryViewID" | "clearButtonMode" | "clearTextOnFocus" | "dataDetectorTypes" | "enablesReturnKeyAutomatically" | "keyboardAppearance" | "passwordRules" | "rejectResponderTermination" | "selectionState" | "textContentType" | "cursorColor" | "importantForAutofill" | "disableFullscreenUI" | "inlineImageLeft" | "inlineImagePadding" | "returnKeyLabel" | "underlineColorAndroid" | "showSoftInputOnFocus" | "underlineColor" | "activeUnderlineColor" | "outlineColor" | "activeOutlineColor" | "outlineStyle" | "underlineStyle" | "mask" | "theme"> & React.RefAttributes<unknown>>;
export default _default;
