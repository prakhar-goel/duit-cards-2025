import { Ionicons } from "@expo/vector-icons";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { myCards } from "../data/connections";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export function MyCardsSection() {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My cards</Text>
        <Pressable accessibilityRole="button">
          <Text style={styles.manageText}>Manage</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
        {myCards.map((card) => (
          <View key={card.id} style={styles.cardWrap}>
            <ImageBackground
              source={{ uri: card.imageUrl }}
              imageStyle={styles.cardImage}
              style={[styles.cardPreview, { backgroundColor: card.accentColor }]}
            >
              <View style={styles.cardOverlay} />
              <Text style={styles.cardInitial}>DUIT</Text>
              <Pressable style={styles.shareStrip} accessibilityRole="button">
                <Text style={styles.shareText}>Share</Text>
              </Pressable>
            </ImageBackground>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {card.subtitle}
            </Text>
          </View>
        ))}
        <Pressable style={styles.addCard} accessibilityRole="button">
          <View style={styles.addIcon}>
            <Ionicons name="add" size={30} color={colors.linkedInBlue} />
          </View>
          <Text style={styles.cardTitle}>Add Card</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addCard: {
    alignItems: "center",
    width: 112,
  },
  addIcon: {
    alignItems: "center",
    backgroundColor: "#EAF3FC",
    borderRadius: 10,
    height: 92,
    justifyContent: "center",
    width: 112,
  },
  cardInitial: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 3,
    zIndex: 1,
  },
  cardImage: {
    borderRadius: 10,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.34)",
  },
  cardPreview: {
    alignItems: "center",
    borderRadius: 10,
    height: 92,
    justifyContent: "center",
    overflow: "hidden",
    width: 112,
  },
  cardSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  cardsRow: {
    gap: spacing.lg,
    paddingRight: spacing.lg,
  },
  cardWrap: {
    width: 112,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  manageText: {
    color: colors.linkedInBlue,
    fontSize: 14,
    fontWeight: "800",
  },
  section: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  shareStrip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    bottom: 0,
    left: 0,
    paddingVertical: 6,
    position: "absolute",
    right: 0,
  },
  shareText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
});
