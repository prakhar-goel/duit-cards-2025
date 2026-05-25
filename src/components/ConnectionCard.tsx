import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import type { Connection } from "../types/social";
import { Avatar } from "./Avatar";

type ConnectionCardProps = {
  connection: Connection;
  onPress: () => void;
};

export function ConnectionCard({ connection, onPress }: ConnectionCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Image source={{ uri: connection.meetingImageUrl }} style={styles.meetingImage} />
      <View style={styles.topRow}>
        <Avatar initials={connection.initials} imageUrl={connection.photoUrl} />
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{connection.name}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
          <Text style={styles.role}>
            {connection.role} at {connection.company}
          </Text>
          <Text style={styles.meta}>
            {connection.timeAgo} - {connection.location}
          </Text>
        </View>
      </View>

      <View style={styles.exchangePill}>
        <Ionicons name="card-outline" size={15} color={colors.linkedInBlue} />
        <Text style={styles.exchangeText}>{connection.exchangeType}</Text>
      </View>

      <Text style={styles.summary}>{connection.summary}</Text>

      <View style={styles.relevanceBox}>
        <Text style={styles.relevanceLabel}>Why relevant for you</Text>
        <Text style={styles.relevance}>{connection.relevance}</Text>
      </View>

      <View style={styles.tagRow}>
        {connection.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
    padding: spacing.lg,
  },
  exchangePill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.matchBackground,
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  exchangeText: {
    color: colors.linkedInBlue,
    fontSize: 12,
    fontWeight: "800",
  },
  identity: {
    flex: 1,
  },
  meetingImage: {
    borderRadius: 12,
    height: 132,
    marginBottom: spacing.md,
    width: "100%",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  name: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  relevance: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
  },
  relevanceBox: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 10,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  relevanceLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  role: {
    color: "#424B54",
    fontSize: 13,
    marginTop: 2,
  },
  summary: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  tag: {
    backgroundColor: "#F3F2EF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
});
