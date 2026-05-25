import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { FeedPostCard } from "../components/FeedPostCard";
import { PostComposer } from "../components/PostComposer";
import { feedPosts } from "../data/socialFeed";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <AppHeader />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.feed}>
        <PostComposer />
        <View style={styles.sortRow}>
          <View style={styles.sortLine} />
          <Text style={styles.sortText}>Sort by: Top</Text>
        </View>
        {feedPosts.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  feed: {
    paddingBottom: 96,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sortLine: {
    backgroundColor: "#C9C9C9",
    flex: 1,
    height: 1,
  },
  sortRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  sortText: {
    color: "#555555",
    fontSize: 12,
    fontWeight: "600",
  },
});
