import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { ConnectionCard } from "../components/ConnectionCard";
import { MyCardsSection } from "../components/MyCardsSection";
import { getConnectionFilterOptions, getConnections } from "../data/socialRepository";
import { colors } from "../theme/colors";
import { layout } from "../theme/layout";
import { spacing } from "../theme/spacing";
import type { Connection, ConnectionCategory, HomeStackParamList } from "../types/social";

type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, "HomeList">;

type FilterId = "Today" | "This week" | "Conference" | "Founder" | "Investor" | "Nearby";
type SortId = "Recent" | "Name" | "Most relevant";
type ExchangeFilter = "Shared by me" | "Received by me";
type CategoryFilter = ConnectionCategory;
type DateRangeFilter = "Today" | "Yesterday" | "This week";
type CityFilter = string;
type ConferenceFilter = string;
type ConnectionMonthGroup = {
  monthYear: string;
  data: Connection[];
};
type FilterPanelId = "Sort" | "Quick" | "Exchange" | "Date" | "City" | "Event" | "Person";
type ConnectionPlacement = "primary" | "lessImportant" | "hidden";
type ConnectionView = "primary" | "lessImportant" | "hidden";

const filters: FilterId[] = ["Today", "This week", "Conference", "Founder", "Investor", "Nearby"];
const sortOptions: SortId[] = ["Recent", "Most relevant", "Name"];
const exchangeFilters: ExchangeFilter[] = ["Shared by me", "Received by me"];
const dateRangeFilters: DateRangeFilter[] = ["Today", "Yesterday", "This week"];
const filterPanels: FilterPanelId[] = ["Sort", "Quick", "Exchange", "Date", "City", "Event", "Person"];
const connectionViews: { id: ConnectionView; label: string }[] = [
  { id: "primary", label: "Primary" },
  { id: "lessImportant", label: "Less important" },
  { id: "hidden", label: "Hidden" },
];
const connections = getConnections();
const filterOptions = getConnectionFilterOptions(connections);
const categoryFilters: CategoryFilter[] = filterOptions.categories;
const cityFilters: CityFilter[] = filterOptions.cities;
const conferenceFilters: ConferenceFilter[] = filterOptions.conferences;

// Top-row quick filters intentionally stay broad. More precise filters live in
// the expanded panel so the default home screen remains lightweight.
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

// Multi-select groups use OR behavior within one group, then AND across groups.
// Example: (Founder OR Investor) AND (Gurgaon OR Singapore).
function matchesSelectedFilters<T>(selected: T[], predicate: (filter: T) => boolean) {
  return selected.length === 0 || selected.some(predicate);
}

function matchesDateRange(connection: Connection, filter: DateRangeFilter) {
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

// SectionList expects sections shaped as { title-ish metadata, data }.
// We group by precomputed monthYear so the UI can mimic a photo timeline.
function groupConnectionsByMonth(items: Connection[]): ConnectionMonthGroup[] {
  return items.reduce<ConnectionMonthGroup[]>((groups, connection) => {
    const existingGroup = groups.find((group) => group.monthYear === connection.monthYear);
    if (existingGroup) {
      existingGroup.data.push(connection);
      return groups;
    }

    return [...groups, { monthYear: connection.monthYear, data: [connection] }];
  }, []);
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 18);
  const [activeFilters, setActiveFilters] = useState<FilterId[]>([]);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [activeFilterPanel, setActiveFilterPanel] = useState<FilterPanelId>("Sort");
  const [activeConnectionView, setActiveConnectionView] = useState<ConnectionView>("primary");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [connectionPlacements, setConnectionPlacements] = useState<Record<string, ConnectionPlacement>>({});
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortId>("Recent");
  const [exchangeFilter, setExchangeFilter] = useState<ExchangeFilter[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter[]>([]);
  const [cityFilter, setCityFilter] = useState<CityFilter[]>([]);
  const [conferenceFilter, setConferenceFilter] = useState<ConferenceFilter[]>([]);
  const [customCity, setCustomCity] = useState("");
  const [customConference, setCustomConference] = useState("");
  const [customDateQuery, setCustomDateQuery] = useState("");
  const lastScrollY = useRef(0);
  const selectedConnection = selectedConnectionId
    ? connections.find((connection) => connection.id === selectedConnectionId)
    : undefined;
  const selectedFilterCount =
    activeFilters.length +
    exchangeFilter.length +
    categoryFilter.length +
    dateRangeFilter.length +
    cityFilter.length +
    conferenceFilter.length +
    Number(Boolean(customCity.trim())) +
    Number(Boolean(customConference.trim())) +
    Number(Boolean(customDateQuery.trim()));
  const filterPanelCounts: Record<FilterPanelId, number> = {
    Sort: sortBy === "Recent" ? 0 : 1,
    Quick: activeFilters.length,
    Exchange: exchangeFilter.length,
    Date: dateRangeFilter.length + Number(Boolean(customDateQuery.trim())),
    City: cityFilter.length + Number(Boolean(customCity.trim())),
    Event: conferenceFilter.length + Number(Boolean(customConference.trim())),
    Person: categoryFilter.length,
  };

  // Filtering is kept client-side for the prototype. When data moves to an API,
  // this predicate can become request params while the UI state stays similar.
  const filteredConnections = useMemo(
    () =>
      sortConnections(
        connections.filter(
          (connection) =>
            (connectionPlacements[connection.id] ?? "primary") === activeConnectionView &&
            matchesSelectedFilters(activeFilters, (filter) => matchesFilter(connection, filter)) &&
            matchesSelectedFilters(exchangeFilter, (filter) => matchesOneExchange(connection, filter)) &&
            matchesSelectedFilters(categoryFilter, (filter) => connection.category === filter) &&
            matchesSelectedFilters(dateRangeFilter, (filter) => matchesDateRange(connection, filter)) &&
            matchesSelectedFilters(cityFilter, (filter) => connection.city === filter) &&
            matchesSelectedFilters(conferenceFilter, (filter) => connection.conferenceName === filter) &&
            textIncludes(connection.city, customCity) &&
            textIncludes(connection.conferenceName ?? connection.location, customConference) &&
            textIncludes(
              `${connection.dateLabel} ${connection.dateBucket} ${connection.timeAgo} ${connection.monthYear} ${connection.dateSearchText}`,
              customDateQuery
            )
        ),
        sortBy
      ),
    [
      activeConnectionView,
      activeFilters,
      categoryFilter,
      cityFilter,
      conferenceFilter,
      connectionPlacements,
      customCity,
      customConference,
      customDateQuery,
      dateRangeFilter,
      exchangeFilter,
      sortBy,
    ]
  );
  const groupedConnections = useMemo(() => groupConnectionsByMonth(filteredConnections), [filteredConnections]);

  function clearAllFilters() {
    setActiveFilters([]);
    setExchangeFilter([]);
    setCategoryFilter([]);
    setDateRangeFilter([]);
    setCityFilter([]);
    setConferenceFilter([]);
    setCustomCity("");
    setCustomConference("");
    setCustomDateQuery("");
    setSortBy("Recent");
  }

  function handleListScroll(y: number) {
    const delta = y - lastScrollY.current;
    if (y > 80 && delta > 8) setIsHeaderVisible(false);
    if (delta < -8 || y < 24) setIsHeaderVisible(true);
    lastScrollY.current = y;
  }

  function moveConnection(connectionId: string, placement: ConnectionPlacement) {
    setConnectionPlacements((current) => ({ ...current, [connectionId]: placement }));
    setSelectedConnectionId(null);
  }

  function getConnectionCount(view: ConnectionView) {
    return connections.filter((connection) => (connectionPlacements[connection.id] ?? "primary") === view).length;
  }

  function getPriorityLabel(connection: Connection) {
    const placement = connectionPlacements[connection.id] ?? "primary";
    if (placement === "lessImportant") return "Less important";
    if (placement === "hidden") return "Hidden";
    return undefined;
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {isHeaderVisible ? <AppHeader /> : null}
      <SectionList
        sections={groupedConnections}
        keyExtractor={(connection) => connection.id}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled
        style={styles.list}
        contentContainerStyle={styles.content}
        onScroll={(event) => handleListScroll(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            <MyCardsSection />

            <View style={styles.sectionHeader}>
              <Text style={styles.title}>People you met</Text>
              <Text style={styles.subtitle}>Card exchanges and in-person context, not social posts.</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.viewSwitchRow}>
              {connectionViews.map((view) => {
                const selected = activeConnectionView === view.id;
                return (
                  <Pressable
                    key={view.id}
                    accessibilityRole="button"
                    onPress={() => setActiveConnectionView(view.id)}
                    style={[styles.viewSwitchChip, selected && styles.viewSwitchChipActive]}
                  >
                    <Text style={[styles.viewSwitchText, selected && styles.viewSwitchTextActive]}>
                      {view.label} ({getConnectionCount(view.id)})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowMoreFilters((current) => !current)}
                style={[styles.filterChip, showMoreFilters && styles.moreFilterActive]}
              >
                <Ionicons name="options-outline" size={16} color={showMoreFilters ? colors.white : "#444444"} />
                <Text style={[styles.filterText, showMoreFilters && styles.filterTextActive]}>Filters</Text>
              </Pressable>
              <View style={styles.filterSummaryChip}>
                <Text style={styles.filterSummaryText}>
                  {selectedFilterCount ? `${selectedFilterCount} active` : "Any date, city, person"}
                </Text>
              </View>
              {selectedFilterCount ? (
                <Pressable accessibilityRole="button" onPress={clearAllFilters} style={styles.clearInlineButton}>
                  <Text style={styles.clearInlineText}>Clear</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.monthSection}>
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>{section.monthYear}</Text>
              <Text style={styles.monthSubtitle}>
                {section.data.length} {section.data.length === 1 ? "exchange" : "exchanges"}
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <ConnectionCard
            connection={item}
            priorityLabel={getPriorityLabel(item)}
            onMorePress={() => setSelectedConnectionId(item.id)}
            onPress={() => navigation.navigate("ConnectionDetail", { connectionId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="file-tray-outline" size={28} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>
              Contacts you move to {activeConnectionView === "hidden" ? "Hidden" : "Less important"} will show up here.
            </Text>
          </View>
        }
      />
      <FilterSheet
        visible={showMoreFilters}
        activePanel={activeFilterPanel}
        onSelectPanel={setActiveFilterPanel}
        onClose={() => setShowMoreFilters(false)}
        onClear={clearAllFilters}
        bottomInset={bottomInset}
        panelCounts={filterPanelCounts}
        sortLabel={sortBy}
      >
        {activeFilterPanel === "Sort" ? (
          <FilterGroup title="Sort">
            {sortOptions.map((option) => (
              <FilterButton key={option} label={option} selected={sortBy === option} onPress={() => setSortBy(option)} />
            ))}
          </FilterGroup>
        ) : null}
        {activeFilterPanel === "Quick" ? (
          <FilterGroup title="Quick filters">
            {filters.map((filter) => (
              <FilterButton
                key={filter}
                label={filter}
                selected={activeFilters.includes(filter)}
                onPress={() => setActiveFilters((current) => toggleSelection(current, filter))}
              />
            ))}
          </FilterGroup>
        ) : null}
        {activeFilterPanel === "Exchange" ? (
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
        ) : null}
        {activeFilterPanel === "Date" ? (
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
              placeholder="Try: 2 Oct 2025 - 17 Nov 2025"
            />
            <Text style={styles.inputHint}>
              You can also type "2nd week of Jan", "Feb 2025", "last month", or "2 months back".
            </Text>
          </FilterGroup>
        ) : null}
        {activeFilterPanel === "City" ? (
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
        ) : null}
        {activeFilterPanel === "Event" ? (
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
        ) : null}
        {activeFilterPanel === "Person" ? (
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
        ) : null}
      </FilterSheet>
      <ConnectionActionSheet
        connection={selectedConnection}
        placement={selectedConnection ? connectionPlacements[selectedConnection.id] ?? "primary" : "primary"}
        bottomInset={bottomInset}
        onClose={() => setSelectedConnectionId(null)}
        onMove={moveConnection}
      />
    </SafeAreaView>
  );
}

function ConnectionActionSheet({
  connection,
  placement,
  bottomInset,
  onClose,
  onMove,
}: {
  connection: Connection | undefined;
  placement: ConnectionPlacement;
  bottomInset: number;
  onClose: () => void;
  onMove: (connectionId: string, placement: ConnectionPlacement) => void;
}) {
  if (!connection) return null;

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <View style={styles.actionBackdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close contact actions" style={styles.sheetScrim} onPress={onClose} />
        <View style={[styles.actionSheet, { paddingBottom: bottomInset }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.actionTitle}>{connection.name}</Text>
          <Text style={styles.actionSubtitle}>Choose where this contact should live.</Text>

          {placement !== "primary" ? (
            <ActionRow
              icon="arrow-up-circle-outline"
              title="Move to primary"
              subtitle="Show in your main relationship view again."
              onPress={() => onMove(connection.id, "primary")}
            />
          ) : null}
          {placement !== "lessImportant" ? (
            <ActionRow
              icon="file-tray-outline"
              title="Move to less important"
              subtitle="Keep it available, but out of the primary view."
              onPress={() => onMove(connection.id, "lessImportant")}
            />
          ) : null}
          {placement !== "hidden" ? (
            <ActionRow
              icon="eye-off-outline"
              title="Hide contact"
              subtitle="Remove it from regular lists until you open Hidden."
              onPress={() => onMove(connection.id, "hidden")}
              destructive
            />
          ) : null}

          <Pressable accessibilityRole="button" onPress={onClose} style={styles.actionCancelButton}>
            <Text style={styles.actionCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.actionRow}>
      <Ionicons name={icon} size={22} color={destructive ? "#B91C1C" : colors.linkedInBlue} />
      <View style={styles.actionCopy}>
        <Text style={[styles.actionRowTitle, destructive && styles.actionRowTitleDestructive]}>{title}</Text>
        <Text style={styles.actionRowSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function FilterSheet({
  visible,
  activePanel,
  bottomInset,
  onSelectPanel,
  onClose,
  onClear,
  panelCounts,
  sortLabel,
  children,
}: {
  visible: boolean;
  activePanel: FilterPanelId;
  bottomInset: number;
  onSelectPanel: (panel: FilterPanelId) => void;
  onClose: () => void;
  onClear: () => void;
  panelCounts: Record<FilterPanelId, number>;
  sortLabel: SortId;
  children: ReactNode;
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close filters" style={styles.sheetScrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.sheetCloseButton}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.sheetBody}>
            <View style={styles.sheetRail}>
              {filterPanels.map((panel) => (
                <Pressable
                  key={panel}
                  accessibilityRole="button"
                  onPress={() => onSelectPanel(panel)}
                  style={[styles.sheetRailItem, activePanel === panel && styles.sheetRailItemActive]}
                >
                  <Text style={[styles.sheetRailText, activePanel === panel && styles.sheetRailTextActive]}>{panel}</Text>
                  {panel === "Sort" || panelCounts[panel] ? (
                    <Text style={[styles.sheetRailMeta, activePanel === panel && styles.sheetRailMetaActive]}>
                      {panel === "Sort" ? sortLabel : `${panelCounts[panel]} selected`}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
            <ScrollView style={styles.sheetContent} contentContainerStyle={styles.sheetContentInner}>
              {children}
            </ScrollView>
          </View>
          <View style={[styles.sheetFooter, { paddingBottom: bottomInset }]}>
            <Pressable accessibilityRole="button" onPress={onClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear all</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  actionBackdrop: {
    backgroundColor: "rgba(0,0,0,0.35)",
    flex: 1,
    justifyContent: "flex-end",
  },
  actionCancelButton: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
  },
  actionCancelText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  actionCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionRowSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  actionRowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  actionRowTitleDestructive: {
    color: "#B91C1C",
  },
  actionSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
    paddingTop: spacing.sm,
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  content: {
    paddingBottom: 96,
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: 48,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  list: {
    alignSelf: "center",
    maxWidth: layout.contentMaxWidth,
    width: "100%",
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 38,
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
    includeFontPadding: false,
    fontWeight: "700",
    lineHeight: 18,
    textAlignVertical: "center",
  },
  filterTextActive: {
    color: colors.white,
  },
  filterSummaryChip: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: 14,
  },
  filterSummaryText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
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
  inputHint: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 17,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  applyButton: {
    alignItems: "center",
    backgroundColor: colors.linkedInBlue,
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  clearButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  clearButtonText: {
    color: colors.linkedInGreen,
    fontSize: 15,
    fontWeight: "800",
  },
  clearInlineButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: spacing.sm,
  },
  clearInlineText: {
    color: colors.linkedInBlue,
    fontSize: 13,
    fontWeight: "800",
  },
  moreFilterActive: {
    backgroundColor: colors.linkedInBlue,
    borderColor: colors.linkedInBlue,
  },
  monthHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  monthSection: {
    backgroundColor: colors.background,
    borderBottomColor: "rgba(218,218,218,0.7)",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  monthTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
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
    backgroundColor: "#E8F5EF",
    borderColor: colors.linkedInGreen,
  },
  panelChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  panelChipTextActive: {
    color: colors.linkedInGreen,
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
  viewSwitchChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 13,
  },
  viewSwitchChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  viewSwitchRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  viewSwitchText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  viewSwitchTextActive: {
    color: colors.white,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "78%",
    overflow: "hidden",
  },
  sheetBackdrop: {
    backgroundColor: "rgba(0,0,0,0.44)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBody: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 360,
  },
  sheetCloseButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  sheetContent: {
    flex: 1,
  },
  sheetContentInner: {
    padding: spacing.lg,
  },
  sheetFooter: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: "#D1D5DB",
    borderRadius: 999,
    height: 4,
    marginTop: spacing.sm,
    width: 42,
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sheetRail: {
    backgroundColor: "#F8FAFC",
    borderRightColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    width: 130,
  },
  sheetRailItem: {
    borderLeftColor: "transparent",
    borderLeftWidth: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  sheetRailItemActive: {
    backgroundColor: colors.surface,
    borderLeftColor: colors.linkedInGreen,
  },
  sheetRailText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  sheetRailTextActive: {
    color: colors.text,
    fontWeight: "900",
  },
  sheetRailMeta: {
    color: colors.linkedInGreen,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 3,
  },
  sheetRailMetaActive: {
    color: colors.linkedInGreen,
  },
  sheetScrim: {
    flex: 1,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
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
