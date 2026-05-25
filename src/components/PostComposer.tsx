import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { Avatar } from "./Avatar";

export function PostComposer() {
  return (
    <View style={styles.composer}>
      <View style={styles.composerTop}>
        <Avatar initials="PG" size={42} />
        <Pressable accessibilityRole="button" style={styles.startPost}>
          <Text style={styles.startPostText}>Start a post</Text>
        </Pressable>
      </View>
      <View style={styles.composerActions}>
        <Text style={styles.composerAction}>
          <Ionicons name="image-outline" size={16} color={colors.linkedInBlue} /> Photo
        </Text>
        <Text style={styles.composerAction}>
          <Ionicons name="calendar-outline" size={16} color="#C37D16" /> Event
        </Text>
        <Text style={styles.composerAction}>
          <Ionicons name="newspaper-outline" size={16} color="#7B61FF" /> Write article
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  composerAction: {
    color: "#565656",
    fontSize: 13,
    fontWeight: "700",
  },
  composerActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: spacing.md,
  },
  composerTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: spacing.md,
  },
  startPost: {
    borderColor: "#8C8C8C",
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    height: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  startPostText: {
    color: "#555555",
    fontSize: 15,
    fontWeight: "700",
  },
});
