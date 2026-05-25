import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { Avatar } from "../components/Avatar";
import { meetings } from "../data/socialFeed";
import { colors } from "../theme/colors";
import { screenPadding, spacing } from "../theme/spacing";
import type { MeetingType } from "../types/social";

type MeetingFilter = "All" | MeetingType;

const filters: MeetingFilter[] = ["All", "Event", "Coffee", "Call"];

export function MeetingsScreen() {
  const [filter, setFilter] = useState<MeetingFilter>("All");
  const visibleMeetings = useMemo(
    () => meetings.filter((meeting) => filter === "All" || meeting.type === filter),
    [filter]
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
        <Text style={styles.pageTitle}>Meetings</Text>
        <Text style={styles.pageSubtitle}>
          A timeline of people you met and how to reopen the conversation.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              onPress={() => setFilter(item)}
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {visibleMeetings.map((meeting, index) => (
          <View key={meeting.id} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={styles.timelineDot} />
              {index !== visibleMeetings.length - 1 ? <View style={styles.timelineLine} /> : null}
            </View>
            <View style={styles.meetingCard}>
              <Text style={styles.meetingDate}>{meeting.date}</Text>
              <View style={styles.meetingTop}>
                <Avatar initials={meeting.name.split(" ").map((part) => part[0]).join("")} size={42} />
                <View style={styles.meetingIdentity}>
                  <Text style={styles.meetingName}>{meeting.name}</Text>
                  <Text style={styles.meetingCompany}>
                    {meeting.company} - {meeting.type}
                  </Text>
                </View>
              </View>
              <Text style={styles.meetingLabel}>Discussed</Text>
              <Text style={styles.meetingBody}>{meeting.summary}</Text>
              <Text style={styles.meetingLabel}>Reapproach</Text>
              <Text style={styles.meetingBody}>{meeting.nextStep}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.linkedInGreen,
    borderColor: colors.linkedInGreen,
  },
  filterRow: {
    gap: spacing.sm,
    paddingVertical: 14,
  },
  filterText: {
    color: "#444444",
    fontWeight: "700",
  },
  filterTextActive: {
    color: colors.white,
  },
  meetingBody: {
    color: "#333333",
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  meetingCard: {
    backgroundColor: colors.surface,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    marginBottom: spacing.md,
    padding: 14,
  },
  meetingCompany: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  meetingDate: {
    color: colors.linkedInBlue,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 10,
  },
  meetingIdentity: {
    flex: 1,
  },
  meetingLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "800",
    marginTop: spacing.sm,
    textTransform: "uppercase",
  },
  meetingName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  meetingTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.md,
  },
  page: {
    padding: screenPadding,
    paddingBottom: 96,
  },
  pageSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  pageTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  timelineDot: {
    backgroundColor: colors.linkedInBlue,
    borderRadius: 6,
    height: 12,
    marginTop: spacing.xl,
    width: 12,
  },
  timelineLine: {
    backgroundColor: colors.timelineLine,
    flex: 1,
    marginTop: spacing.xs,
    width: 2,
  },
  timelineRail: {
    alignItems: "center",
    width: 26,
  },
  timelineRow: {
    alignItems: "stretch",
    flexDirection: "row",
  },
});
