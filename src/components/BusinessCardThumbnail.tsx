import { StyleSheet, Text, View } from "react-native";
import type { Connection } from "../types/social";

type BusinessCardThumbnailProps = {
  connection: Connection;
  size?: "small" | "large";
};

export function BusinessCardThumbnail({ connection, size = "small" }: BusinessCardThumbnailProps) {
  const theme = connection.businessCardTheme;
  const isLarge = size === "large";

  return (
    <View
      style={[
        styles.card,
        isLarge ? styles.cardLarge : styles.cardSmall,
        { backgroundColor: theme.backgroundColor },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: theme.accentColor }]} />
      <Text style={[styles.name, isLarge && styles.nameLarge, { color: theme.textColor }]} numberOfLines={1}>
        {connection.name}
      </Text>
      <Text style={[styles.role, isLarge && styles.roleLarge, { color: theme.textColor }]} numberOfLines={1}>
        {connection.role}
      </Text>
      <View style={styles.footer}>
        <Text style={[styles.company, { color: theme.textColor }]} numberOfLines={1}>
          {connection.company}
        </Text>
        <View style={[styles.dot, { backgroundColor: theme.accentColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accent: {
    borderRadius: 999,
    height: 5,
    marginBottom: 8,
    width: 28,
  },
  card: {
    borderColor: "rgba(15,23,42,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "space-between",
    overflow: "hidden",
    padding: 10,
  },
  cardLarge: {
    height: 112,
    width: 168,
  },
  cardSmall: {
    height: 62,
    width: 92,
  },
  company: {
    flex: 1,
    fontSize: 8,
    fontWeight: "800",
    opacity: 0.72,
  },
  dot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  name: {
    fontSize: 10,
    fontWeight: "900",
  },
  nameLarge: {
    fontSize: 18,
  },
  role: {
    fontSize: 8,
    fontWeight: "700",
    opacity: 0.78,
  },
  roleLarge: {
    fontSize: 12,
  },
});
