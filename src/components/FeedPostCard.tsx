import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import type { FeedPost } from "../types/social";
import { Avatar } from "./Avatar";

const postActions: Array<[keyof typeof Ionicons.glyphMap, string]> = [
  ["thumbs-up-outline", "Like"],
  ["chatbubble-outline", "Comment"],
  ["repeat-outline", "Repost"],
  ["send-outline", "Send"],
];

type FeedPostCardProps = {
  post: FeedPost;
};

export function FeedPostCard({ post }: FeedPostCardProps) {
  return (
    <View style={styles.feedCard}>
      <View style={styles.postHeader}>
        <Avatar initials={post.initials} />
        <View style={styles.postIdentity}>
          <Text style={styles.postName}>{post.name}</Text>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postTime}>{post.time} - Public</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.textMuted} />
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      <View style={styles.matchBadge}>
        <Ionicons name="sparkles-outline" size={15} color={colors.linkedInBlue} />
        <Text style={styles.matchBadgeText}>{post.badge}</Text>
      </View>
      <Text style={styles.stats}>{post.stats}</Text>
      <View style={styles.postActions}>
        {postActions.map(([icon, label]) => (
          <Pressable key={label} accessibilityRole="button" style={styles.postAction}>
            <Ionicons name={icon} size={21} color="#5E6A75" />
            <Text style={styles.postActionText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  feedCard: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
    paddingTop: spacing.md,
  },
  matchBadge: {
    alignItems: "center",
    backgroundColor: colors.matchBackground,
    borderRadius: spacing.sm,
    flexDirection: "row",
    gap: 6,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: 10,
  },
  matchBadgeText: {
    color: colors.linkedInBlue,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  postAction: {
    alignItems: "center",
    flex: 1,
    gap: 3,
    justifyContent: "center",
    paddingVertical: 7,
  },
  postActionText: {
    color: "#5E6A75",
    fontSize: 12,
    fontWeight: "700",
  },
  postActions: {
    borderTopColor: "#E0E0E0",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingVertical: spacing.xs,
  },
  postContent: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  postHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: spacing.md,
  },
  postIdentity: { flex: 1 },
  postName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  postTime: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  postTitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  stats: {
    color: colors.textMuted,
    fontSize: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
});
