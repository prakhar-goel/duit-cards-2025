import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  type StyleProp,
  type ViewStyle,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { mediaHeaders, mediaUrl } from "./api";
import { initials } from "./domain";
export const C = {
  bg: "#F7F8F2",
  ink: "#142E2B",
  teal: "#163D35",
  lime: "#D5F477",
  muted: "#7F8981",
  line: "#E1E6DC",
  white: "#FFFFFF",
  soft: "#EDF1E8",
  red: "#A34232",
  orange: "#B47B3F",
  blue: "#E8EFED",
};
export function Icon({
  name,
  size = 22,
  color = C.ink,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function pressFeedback() {
  if (Platform.OS !== "web") void Haptics.selectionAsync().catch(() => {});
}
export function Button({
  children,
  onPress,
  icon,
  tone = "primary",
  busy = false,
  disabled = false,
  small = false,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  tone?: "primary" | "secondary" | "quiet" | "danger" | "lime";
  busy?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = tone === "primary" ? C.white : tone === "danger" ? C.red : C.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={typeof children === "string" ? children : undefined}
      accessibilityState={{ disabled: disabled || busy }}
      onPress={() => {
        pressFeedback();
        onPress();
      }}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.button,
        tone === "secondary" && s.secondary,
        tone === "quiet" && s.quiet,
        tone === "danger" && s.danger,
        tone === "lime" && s.lime,
        small && s.small,
        (disabled || busy) && { opacity: 0.48 },
        pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={fg} size="small" />
      ) : icon ? (
        <Icon name={icon} color={fg} size={small ? 17 : 20} />
      ) : null}
      <Text style={[s.buttonText, { color: fg }, small && { fontSize: 12 }]}>
        {children}
      </Text>
    </Pressable>
  );
}
export function CircleButton({
  icon,
  onPress,
  label,
  dark = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  label: string;
  dark?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.circle,
        dark && { backgroundColor: C.teal },
        pressed && { opacity: 0.65 },
      ]}
    >
      <Icon name={icon} color={dark ? C.white : C.ink} />
    </Pressable>
  );
}
function useImageSource(value?: string | null) {
  const uri = mediaUrl(value);
  const headers = mediaHeaders(uri);
  const token = headers?.Authorization;
  const [resolved, setResolved] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (Platform.OS !== "web" || !token) {
      setResolved(uri);
      return;
    }
    let active = true;
    let objectUrl: string | undefined;
    const controller = new AbortController();
    setResolved(undefined);
    void fetch(uri!, {
      headers: { Authorization: token },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Image unavailable");
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setResolved(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [uri, token]);
  return Platform.OS === "web" ? resolved : uri;
}
export function Avatar({
  name,
  url,
  size = 52,
  square = false,
}: {
  name: string;
  url?: string | null;
  size?: number;
  square?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const uri = useImageSource(url);
  useEffect(() => setFailed(false), [uri]);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: square ? Math.min(24, size * 0.18) : size / 2,
        overflow: "hidden",
        backgroundColor: C.soft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {uri && !failed ? (
        <Image
          source={{ uri, headers: mediaHeaders(uri) }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text
          style={{
            fontSize: size * 0.3,
            color: C.teal,
            fontWeight: "600",
            letterSpacing: -1,
          }}
        >
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
export function RemoteImage({
  uri,
  style,
  contain = false,
  onSize,
}: {
  uri?: string | null;
  style: StyleProp<ViewStyle>;
  contain?: boolean;
  onSize?: (width: number, height: number) => void;
}) {
  const url = useImageSource(uri);
  return url ? (
    <Image
      source={{ uri: url, headers: mediaHeaders(url) }}
      style={style as any}
      resizeMode={contain ? "contain" : "cover"}
      onLoad={
        onSize
          ? (event) => {
              const native = event.nativeEvent as any;
              const width =
                native?.source?.width ?? native?.target?.naturalWidth;
              const height =
                native?.source?.height ?? native?.target?.naturalHeight;
              if (width && height) onSize(width, height);
            }
          : undefined
      }
    />
  ) : (
    <View
      style={[
        style,
        {
          backgroundColor: C.soft,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Icon name="image-outline" size={32} color={C.muted} />
    </View>
  );
}
export function Label({
  children,
  color = C.muted,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return <Text style={[s.label, { color }]}>{children}</Text>;
}
export function Title({
  children,
  size = 34,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  style?: any;
}) {
  return (
    <Text style={[s.title, { fontSize: size, lineHeight: size * 1.14 }, style]}>
      {children}
    </Text>
  );
}
export function Body({
  children,
  muted = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  style?: any;
}) {
  return (
    <Text style={[s.body, muted && { color: C.muted }, style]}>{children}</Text>
  );
}
export function Pill({
  children,
  active = false,
  onPress,
  icon,
}: {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const inner = (
    <>
      {icon && <Icon name={icon} size={14} color={active ? C.white : C.ink} />}
      <Text style={[s.pillText, active && { color: C.white }]}>{children}</Text>
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[s.pill, active && s.pillActive]}
    >
      {inner}
    </Pressable>
  ) : (
    <View style={[s.pill, active && s.pillActive]}>{inner}</View>
  );
}
export function Section({
  title,
  action,
  onPress,
  children,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: 28 }}>
      <View style={[s.row, { marginBottom: 14 }]}>
        <Text style={s.sectionTitle}>{title}</Text>
        {action && onPress && (
          <Pressable accessibilityRole="button" onPress={onPress} hitSlop={12}>
            <Text style={s.textLink}>{action} ↗</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}
export function Field({
  label,
  hint,
  error,
  ...props
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#96A198"
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 112, textAlignVertical: "top" },
          error && { borderColor: C.red },
          props.style,
        ]}
      />
      {(hint || error) && (
        <Text style={[s.hint, error && { color: C.red }]}>{error ?? hint}</Text>
      )}
    </View>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Search people, places, conversations…",
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}) {
  return (
    <View style={s.search}>
      <Icon name="search-outline" color={C.muted} size={19} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        returnKeyType="search"
        style={{
          flex: 1,
          color: C.ink,
          fontSize: 14,
          padding: 0,
          minHeight: 48,
        }}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChange("")}
          hitSlop={10}
        >
          <Icon name="close-circle" size={18} color={C.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}
export function Page({
  children,
  refreshing,
  onRefresh,
  style,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={C.teal}
          />
        ) : undefined
      }
      contentContainerStyle={[s.page, style]}
    >
      {children}
    </ScrollView>
  );
}
export function Empty({
  icon = "leaf-outline",
  title,
  body,
  action,
  onPress,
}: {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  body: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Icon name={icon} size={28} />
      </View>
      <Title size={23}>{title}</Title>
      <Body muted style={{ textAlign: "center", marginTop: 10, maxWidth: 300 }}>
        {body}
      </Body>
      {action && onPress && (
        <Button onPress={onPress} tone="secondary" style={{ marginTop: 22 }}>
          {action}
        </Button>
      )}
    </View>
  );
}
export function Notice({
  children,
  error = false,
  action,
  onPress,
}: {
  children: React.ReactNode;
  error?: boolean;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={[s.notice, error && { backgroundColor: "#F9EDE8" }]}>
      <Icon
        name={error ? "alert-circle-outline" : "information-circle-outline"}
        size={18}
        color={error ? C.red : C.teal}
      />
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          lineHeight: 19,
          color: error ? C.red : C.teal,
        }}
      >
        {children}
      </Text>
      {action && onPress && (
        <Pressable onPress={onPress} accessibilityRole="button">
          <Text style={s.textLink}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Sheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: C.bg }}
        edges={["top", "bottom"]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={s.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Title size={25}>{title}</Title>
              {subtitle && (
                <Body muted style={{ fontSize: 13, marginTop: 6 }}>
                  {subtitle}
                </Body>
              )}
            </View>
            <CircleButton
              icon="close-outline"
              onPress={onClose}
              label="Close"
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: 24,
              paddingBottom: 40,
              maxWidth: 720,
              width: "100%",
              alignSelf: "center",
            }}
          >
            {children}
          </ScrollView>
          {footer && <View style={s.sheetFooter}>{footer}</View>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
export function Divider() {
  return (
    <View style={{ height: 1, backgroundColor: C.line, marginVertical: 20 }} />
  );
}
export function Stat({
  value,
  label,
  dark = false,
}: {
  value: string | number;
  label: string;
  dark?: boolean;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "500",
          letterSpacing: -1,
          color: dark ? C.white : C.ink,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: dark ? "#ABC0B5" : C.muted,
          marginTop: 5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
export const s = StyleSheet.create({
  page: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    maxWidth: 760,
    alignSelf: "center",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: C.ink, fontWeight: "600", letterSpacing: -1.3 },
  body: { fontSize: 15, lineHeight: 23, color: C.ink },
  label: {
    fontSize: 10,
    letterSpacing: 1.7,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.5,
    color: C.ink,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: C.teal,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontWeight: "600", fontSize: 14 },
  secondary: { backgroundColor: C.white, borderColor: C.line, borderWidth: 1 },
  quiet: { backgroundColor: "transparent" },
  danger: { backgroundColor: "#F9EDE8" },
  lime: { backgroundColor: C.lime },
  small: {
    minHeight: 36,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 12,
  },
  circle: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.soft,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    minHeight: 34,
    borderRadius: 20,
    backgroundColor: C.soft,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  pillActive: { backgroundColor: C.teal },
  pillText: { fontSize: 12, fontWeight: "500", color: C.ink },
  textLink: { fontSize: 13, fontWeight: "600", color: C.teal },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: C.ink,
    marginBottom: 9,
  },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    lineHeight: 22,
    color: C.ink,
    backgroundColor: C.white,
    minHeight: 51,
  },
  hint: { fontSize: 11, lineHeight: 17, color: C.muted, marginTop: 6 },
  search: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 15,
    alignItems: "center",
    minHeight: 50,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: C.line,
  },
  empty: { alignItems: "center", paddingVertical: 42, paddingHorizontal: 8 },
  emptyIcon: {
    height: 62,
    width: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: C.soft,
    marginBottom: 20,
  },
  notice: {
    backgroundColor: C.soft,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  sheetHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  sheetFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    alignSelf: "center",
    maxWidth: 720,
    width: "100%",
  },
  divider: { height: 1, backgroundColor: C.line },
  muted: { color: C.muted },
  sectionGap: { marginTop: 24 },
});
