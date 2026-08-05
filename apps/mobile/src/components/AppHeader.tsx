import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { colors } from "../theme/colors";
import { layout } from "../theme/layout";
import { spacing } from "../theme/spacing";
import { Avatar } from "./Avatar";

export function AppHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Avatar initials="PG" size={36} />
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#5E6A75" />
          <TextInput placeholder="Search" placeholderTextColor="#5E6A75" style={styles.searchInput} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Messages" style={styles.headerIcon}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#424B54" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 56,
  },
  headerContent: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.md,
    height: 56,
    maxWidth: layout.contentMaxWidth,
    paddingHorizontal: spacing.md,
    width: "100%",
  },
  headerIcon: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.searchBackground,
    borderRadius: 6,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    height: 38,
    paddingHorizontal: 10,
  },
  searchInput: {
    color: "#111827",
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
});
