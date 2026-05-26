import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../components/Avatar";
import { BusinessCardThumbnail } from "../components/BusinessCardThumbnail";
import { connections } from "../data/connections";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { getTagTone, isCardExchangeTag } from "../theme/tags";
import type { HomeStackParamList } from "../types/social";

type ConnectionDetailProps = NativeStackScreenProps<HomeStackParamList, "ConnectionDetail">;

export function ConnectionDetailScreen({ navigation, route }: ConnectionDetailProps) {
  const connection = connections.find((item) => item.id === route.params.connectionId) ?? connections[0];

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Connection details</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Avatar initials={connection.initials} imageUrl={connection.photoUrl} size={64} />
          <View style={styles.profileText}>
            <Text style={styles.name}>{connection.name}</Text>
            <Text style={styles.role}>
              {connection.role} at {connection.company}
            </Text>
            <Text style={styles.meta}>
              {connection.dateLabel} - {connection.location}, {connection.city}
            </Text>
          </View>
        </View>

        <View style={styles.businessCardPreview}>
          <BusinessCardThumbnail connection={connection} size="large" />
          <View style={styles.businessCardText}>
            <Text style={styles.cardLabel}>Business card received</Text>
            <Text style={styles.businessCardTitle}>{connection.oneLiner}</Text>
          </View>
        </View>

        <View style={styles.exchangeCard}>
          <Text style={styles.cardLabel}>Card exchange</Text>
          <View style={styles.exchangeRow}>
            <Ionicons name="card-outline" size={22} color={colors.linkedInBlue} />
            <Text style={styles.exchangeText}>{connection.exchangeType}</Text>
          </View>
        </View>

        <DetailSection title="What happened" body={connection.summary} />
        <DetailSection title="Why this person is relevant" body={connection.relevance} emphasis />
        <DetailSection title="Suggested next step" body={connection.nextStep} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.sectionBody}>{connection.contact.email}</Text>
          <Text style={styles.sectionBody}>{connection.contact.phone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagRow}>
            {[connection.exchangeType, ...connection.tags].map((tag) => {
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailSection({ title, body, emphasis }: { title: string; body: string; emphasis?: boolean }) {
  return (
    <View style={[styles.section, emphasis && styles.emphasisSection]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  businessCardPreview: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  businessCardText: {
    flex: 1,
  },
  businessCardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  cardLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 96,
  },
  emphasisSection: {
    backgroundColor: "#F8FAFC",
  },
  exchangeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  exchangeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  exchangeText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  exchangeTag: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  exchangeTagText: {
    fontSize: 12,
    fontWeight: "800",
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    height: 54,
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  iconButton: {
    alignItems: "center",
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  profileText: {
    flex: 1,
  },
  role: {
    color: "#424B54",
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  sectionBody: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagText: {
    color: colors.linkedInBlue,
    fontSize: 12,
    fontWeight: "800",
  },
});
