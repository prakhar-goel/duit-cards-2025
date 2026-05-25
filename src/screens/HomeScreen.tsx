import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { ConnectionCard } from "../components/ConnectionCard";
import { MyCardsSection } from "../components/MyCardsSection";
import { connections } from "../data/connections";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import type { Connection, HomeStackParamList } from "../types/social";

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, "HomeList">;

type FilterId = "Today" | "This week" | "Conference" | "Founder" | "Investor" | "Nearby";
type SortId = "Recent" | "Name" | "Most relevant";
type ExchangeFilter = "Shared by me" | "Received by me";
type CategoryFilter = "Founder" | "Investor" | "Product" | "Engineering" | "Sales" | "Marketing";
type DateRangeFilter = "Today" | "Yesterday" | "This week" | "Older" | "2 months back";
type CityFilter = "Jakarta" | "Singapore" | "Gurgaon" | "Bengaluru";
type ConferenceFilter =
  | "Jakarta Design Week"
  | "SEA Founders Dinner"
  | "Gurgaon Retail Meetup"
  | "Fintech Week India"
  | "SME Growth Summit"
  | "North India Startup Mixer";

const filters: FilterId[] = ["Today", "This week", "Conference", "Founder", "Investor", "Nearby"];
const sortOptions: SortId[] = ["Recent", "Most relevant", "Name"];
const exchangeFilters: ExchangeFilter[] = ["Shared by me", "Received by me"];
const categoryFilters: CategoryFilter[] = ["Founder", "Investor", "Product", "Engineering", "Sales", "Marketing"];
const dateRangeFilters: DateRangeFilter[] = ["Today", "Yesterday", "This week", "Older", "2 months back"];
const cityFilters: CityFilter[] = ["Jakarta", "Singapore", "Gurgaon", "Bengaluru"];
const conferenceFilters: ConferenceFilter[] = [
  "Jakarta Design Week",
  "SEA Founders Dinner",
  "Gurgaon Retail Meetup",
  "Fintech Week India",
  "SME Growth Summit",
  "North India Startup Mixer",
];

function matchesFilter(connection: Connection, filter: FilterId) {
  switch (filter) {
    case "Today":
      return connection.dateBucket === "Today";
    case "This week":
      return ["Today", "Yesterday", "This week"].includes(connection.dateBucket);
    case "Conference":
      return connection.meetingType === "Conference";
    case "Founder":
    case "Investor":
      return connection.category === filter;
    case "Nearby":
      return connection.city === "Jakarta";
    default:
      return true;
  }
}

function matchesOneExchange(connection: Connection, filter: ExchangeFilter) {
  switch (filter) {
    case "Shared by me":
      return connection.exchangeType === "Shared my card" || connection.exchangeType === "Both exchanged cards";
    case "Received by me":
      return connection.exchangeType === "Received their card" || connection.exchangeType === "Both exchanged cards";
    default:
      return true;
  }
}

function matchesSelectedFilters<T>(selected: T[], predicate: (filter: T) => boolean) {
  return selected.length === 0 || selected.some(predicate);
}

function matchesDateRange(connection: Connection, filter: DateRangeFilter) {
  if (filter === "2 months back") return connection.dateLabel.toLowerCase().includes("2 months");
  return connection.dateBucket === filter;
}

function textIncludes(value: string | undefined, query: string) {
  return !query.trim() || value?.toLowerCase().includes(query.trim().toLowerCase());
}

function toggleSelection<T>(current: T[], value: T) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function sortConnections(items: Connection[], sortBy: SortId) {
  const next = [...items];
  if (sortBy === "Name") {
    return next.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sortBy === "Most relevant") {
    return next.sort((a, b) => b.tags.length - a.tags.length || a.name.localeCompare(b.name));
  }
  return next;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [activeFilters, setActiveFilters] = useState<FilterId[]>([]);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortId>("Recent");
  const [exchangeFilter, setExchangeFilter] = useState<ExchangeFilter[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter[]>([]);
  const [cityFilter, setCityFilter] = useState<CityFilter[]>([]);
  const [conferenceFilter, setConferenceFilter] = useState<ConferenceFilter[]>([]);
  const [customCity, setCustomCity] = useState("");
  const [customConference, setCustomConference] = useState("");
  const [customDateQuery, setCustomDateQuery] = useState("");
  const filteredConnections = useMemo(
    () =>
      sortConnections(
        connections.filter(
          (connection) =>
            matchesSelectedFilters(activeFilters, (filter) => matchesFilter(connection, filter)) &&
            matchesSelectedFilters(exchangeFilter, (filter) => matchesOneExchange(connection, filter)) &&
            matchesSelectedFilters(categoryFilter, (filter) => connection.category === filter) &&
            matchesSelectedFilters(dateRangeFilter, (filter) => matchesDateRange(connection, filter)) &&
            matchesSelectedFilters(cityFilter, (filter) => connection.city === filter) &&
            matchesSelectedFilters(conferenceFilter, (filter) => connection.conferenceName === filter) &&
            textIncludes(connection.city, customCity) &&
            textIncludes(connection.conferenceName ?? connection.location, customConference) &&
            textIncludes(`${connection.dateLabel} ${connection.dateBucket} ${connection.timeAgo}`, customDateQuery)
        ),
        sortBy
      ),
    [
      activeFilters,
      categoryFilter,
      cityFilter,
      conferenceFilter,
      customCity,
      customConference,
      customDateQuery,
      dateRangeFilter,
      exchangeFilter,
      sortBy,
    ]
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
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowMoreFilters((current) => !current)}
            style={[styles.filterChip, showMoreFilters && styles.moreFilterActive]}
          >
            <Ionicons name="options-outline" size={16} color={showMoreFilters ? colors.white : "#444444"} />
            <Text style={[styles.filterText, showMoreFilters && styles.filterTextActive]}>More filters</Text>
          </Pressable>
          {filters.map((filter) => (
            <Pressable
              key={filter}
              accessibilityRole="button"
              onPress={() => setActiveFilters((current) => toggleSelection(current, filter))}
              style={[styles.filterChip, activeFilters.includes(filter) && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilters.includes(filter) && styles.filterTextActive]}>{filter}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {showMoreFilters ? (
          <View style={styles.morePanel}>
            <FilterGroup title="Sort by">
              {sortOptions.map((option) => (
                <FilterButton
                  key={option}
                  label={option}
                  selected={sortBy === option}
                  onPress={() => setSortBy(option)}
                />
              ))}
            </FilterGroup>
            <FilterGroup title="Card exchange">
              {exchangeFilters.map((option) => (
                <FilterButton
                  key={option}
                  label={option}
                  selected={exchangeFilter.includes(option)}
                  onPress={() => setExchangeFilter((current) => toggleSelection(current, option))}
                />
              ))}
            </FilterGroup>
            <FilterGroup title="Date range">
              {dateRangeFilters.map((option) => (
                <FilterButton
                  key={option}
                  label={option}
                  selected={dateRangeFilter.includes(option)}
                  onPress={() => setDateRangeFilter((current) => toggleSelection(current, option))}
                />
              ))}
              <FilterInput
                value={customDateQuery}
                onChangeText={setCustomDateQuery}
                placeholder="Type date, e.g. 2 months back"
              />
            </FilterGroup>
            <FilterGroup title="City / geolocation">
              {cityFilters.map((option) => (
                <FilterButton
                  key={option}
                  label={option}
                  selected={cityFilter.includes(option)}
                  onPress={() => setCityFilter((current) => toggleSelection(current, option))}
                />
              ))}
              <FilterInput value={customCity} onChangeText={setCustomCity} placeholder="Enter city, e.g. Gurgaon" />
            </FilterGroup>
            <FilterGroup title="Conference / event">
              {conferenceFilters.map((option) => (
                <FilterButton
                  key={option}
                  label={option}
                  selected={conferenceFilter.includes(option)}
                  onPress={() => setConferenceFilter((current) => toggleSelection(current, option))}
                />
              ))}
              <FilterInput
                value={customConference}
                onChangeText={setCustomConference}
                placeholder="Enter conference / event"
              />
            </FilterGroup>
            <FilterGroup title="Type of person">
              {categoryFilters.map((option) => (
                <FilterButton
                  key={option}
                  label={option}
                  selected={categoryFilter.includes(option)}
                  onPress={() => setCategoryFilter((current) => toggleSelection(current, option))}
                />
              ))}
            </FilterGroup>
          </View>
        ) : null}

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

function FilterInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      style={styles.filterInput}
    />
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupTitle}>{title}</Text>
      <View style={styles.filterWrap}>{children}</View>
    </View>
  );
}

function FilterButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.panelChip, selected && styles.panelChipActive]}
    >
      <Text style={[styles.panelChipText, selected && styles.panelChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 96,
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
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
  filterGroup: {
    gap: spacing.sm,
  },
  filterGroupTitle: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  filterInput: {
    backgroundColor: colors.surface,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 13,
    minWidth: "100%",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  moreFilterActive: {
    backgroundColor: colors.linkedInBlue,
    borderColor: colors.linkedInBlue,
  },
  morePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
  },
  panelChip: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  panelChipActive: {
    backgroundColor: colors.matchBackground,
    borderColor: colors.linkedInBlue,
  },
  panelChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  panelChipTextActive: {
    color: colors.linkedInBlue,
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
