import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { ConnectionCard } from "../components/ConnectionCard";
import { MyCardsSection } from "../components/MyCardsSection";
import { connections } from "../data/connections";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import type { Connection, HomeStackParamList } from "../types/social";

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, "HomeList">;

type FilterId = "All" | "Today" | "This week" | "Conference" | "Founder" | "Investor" | "Nearby";

const filters: FilterId[] = ["All", "Today", "This week", "Conference", "Founder", "Investor", "Nearby"];

function matchesFilter(connection: Connection, filter: FilterId) {
  switch (filter) {
    case "Today":
      return connection.dateLabel.toLowerCase().includes("today");
    case "This week":
      return ["today", "yesterday", "monday", "last friday"].some((marker) =>
        connection.dateLabel.toLowerCase().includes(marker)
      );
    case "Conference":
      return connection.meetingType === "Conference";
    case "Founder":
    case "Investor":
      return connection.category === filter;
    case "Nearby":
      return connection.location.toLowerCase().includes("jakarta") || connection.location.toLowerCase().includes("sudirman");
    case "All":
    default:
      return true;
  }
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("All");
  const filteredConnections = useMemo(
    () => connections.filter((connection) => matchesFilter(connection, activeFilter)),
    [activeFilter]
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <MyCardsSection />

        <View style={styles.sectionHeader}>
          <Text style={styles.title}>People you met</Text>
          <Text style={styles.subtitle}>Card exchanges and in-person context, not social posts.</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((filter) => (
            <Pressable
              key={filter}
              accessibilityRole="button"
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {filteredConnections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            onPress={() => navigation.navigate("ConnectionDetail", { connectionId: connection.id })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 96,
  },
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
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  filterText: {
    color: "#444444",
    fontWeight: "700",
  },
  filterTextActive: {
    color: colors.white,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
});
