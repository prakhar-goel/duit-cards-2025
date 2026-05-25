import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../components/Avatar";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export function ProfileScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHero}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200" }}
            style={styles.cover}
          />
          <View style={styles.profileAvatar}>
            <Avatar initials="PG" size={88} />
          </View>
        </View>
        <View style={styles.profilePanel}>
          <Text style={styles.profileName}>Prakhar Goel</Text>
          <Text style={styles.profileHeadline}>
            Senior full-stack engineer and product designer building Duit Cards
          </Text>
          <Text style={styles.profileMeta}>Jakarta, Indonesia - 1,248 connections</Text>
          <View style={styles.profileActions}>
            <Pressable accessibilityRole="button" style={styles.primaryPill}>
              <Text style={styles.primaryPillText}>Open to</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.secondaryPill}>
              <Text style={styles.secondaryPillText}>Add profile section</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>About</Text>
          <Text style={styles.aboutText}>
            Duit Cards helps professionals turn business card exchanges into meaningful relationships,
            follow-ups, and lightweight CRM workflows.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  aboutCard: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    padding: spacing.xl,
  },
  aboutText: {
    color: "#333333",
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  aboutTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  cover: {
    height: 116,
    width: "100%",
  },
  primaryPill: {
    backgroundColor: colors.linkedInBlue,
    borderRadius: 20,
    paddingHorizontal: spacing.xl,
    paddingVertical: 9,
  },
  primaryPillText: {
    color: colors.white,
    fontWeight: "800",
  },
  profileActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 14,
  },
  profileAvatar: {
    borderColor: colors.surface,
    borderRadius: 48,
    borderWidth: 4,
    left: spacing.xl,
    position: "absolute",
    top: 72,
  },
  profileHeadline: {
    color: "#333333",
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  profileHero: {
    backgroundColor: colors.surface,
    height: 180,
  },
  profileMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  profileName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  profilePanel: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryPill: {
    borderColor: colors.linkedInBlue,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: 9,
  },
  secondaryPillText: {
    color: colors.linkedInBlue,
    fontWeight: "800",
  },
});
