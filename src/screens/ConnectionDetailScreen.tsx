import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../components/Avatar";
import { connections } from "../data/connections";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
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
        <Image source={{ uri: connection.meetingImageUrl }} style={styles.heroImage} />
        <View style={styles.profileCard}>
          <Avatar initials={connection.initials} imageUrl={connection.photoUrl} size={64} />
          <View style={styles.profileText}>
            <Text style={styles.name}>{connection.name}</Text>
            <Text style={styles.role}>
              {connection.role} at {connection.company}
            </Text>
            <Text style={styles.meta}>
              {connection.dateLabel} - {connection.location}
            </Text>
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
            {connection.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
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
  heroImage: {
    borderRadius: 16,
    height: 184,
    marginBottom: spacing.md,
    width: "100%",
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
    backgroundColor: colors.matchBackground,
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
