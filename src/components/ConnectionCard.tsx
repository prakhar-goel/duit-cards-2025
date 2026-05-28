import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { getTagTone, isCardExchangeTag } from "../theme/tags";
import type { Connection } from "../types/social";
import { Avatar } from "./Avatar";
import { BusinessCardThumbnail } from "./BusinessCardThumbnail";

type ConnectionCardProps = {
  connection: Connection;
  onPress: () => void;
};

/**
 * Compact list item for the Home feed.
 *
 * It shows the relationship context first: who the person is, where/when you
 * met, a mini card preview, and a small set of tags. Keep this component
 * presentation-only; filtering and data loading should stay in screen/data code.
 */
export function ConnectionCard({ connection, onPress }: ConnectionCardProps) {
  // Exchange status is displayed as the first tag because it is core context.
  const visibleTags = [connection.exchangeType, ...connection.tags].slice(0, 3);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <Avatar initials={connection.initials} imageUrl={connection.photoUrl} size={54} />
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {connection.name}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
          <Text style={styles.role} numberOfLines={2}>
            {connection.role} at {connection.company}
          </Text>
          <Text style={styles.meta} numberOfLines={2}>
            {connection.timeAgo} - {connection.location}, {connection.city}
          </Text>
        </View>
        <BusinessCardThumbnail connection={connection} />
      </View>

      <Text style={styles.oneLiner}>{connection.oneLiner}</Text>

      <View style={styles.tagRow}>
        {visibleTags.map((tag) => {
          const tone = getTagTone(tag);
          if (isCardExchangeTag(tag)) {
            return (
              <View key={tag} style={[styles.exchangeTag, { backgroundColor: tone.backgroundColor }]}>
                <Ionicons name="card-outline" size={15} color={tone.color} />
                <Text style={[styles.exchangeTagText, { color: tone.color }]}>{tag}</Text>
              </View>
            );
          }

          return (
            <View key={tag} style={[styles.tag, { backgroundColor: tone.backgroundColor }]}>
              <Text style={[styles.tagText, { color: tone.color }]}>{tag}</Text>
            </View>
          );
        })}
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
  identity: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  oneLiner: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
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
  exchangeTag: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 30,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  exchangeTagText: {
    includeFontPadding: false,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15,
    textAlignVertical: "center",
  },
  role: {
    color: "#424B54",
    fontSize: 13,
    marginTop: 2,
  },
  tag: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 30,
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
    includeFontPadding: false,
    lineHeight: 15,
    textAlignVertical: "center",
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
  },
});
