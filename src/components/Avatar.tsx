import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type AvatarProps = {
  initials: string;
  size?: number;
};

export function Avatar({ initials, size = 44 }: AvatarProps) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
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
