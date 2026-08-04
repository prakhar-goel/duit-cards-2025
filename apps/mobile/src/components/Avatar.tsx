import { Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type AvatarProps = {
  initials: string;
  imageUrl?: string;
  size?: number;
};

export function Avatar({ initials, imageUrl, size = 44 }: AvatarProps) {
  const sizeStyle = { width: size, height: size, borderRadius: size / 2 };

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={[styles.avatar, sizeStyle]} />;
  }

  return (
    <View style={[styles.avatar, sizeStyle]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.linkedInBlue,
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontWeight: "800",
  },
});
