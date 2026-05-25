import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { colors } from "../theme/colors";
import { screenPadding, spacing } from "../theme/spacing";

const cardUrl = "https://duit.cards/prakhar";

export function ShareScreen() {
  const [phone, setPhone] = useState("");
  const message = useMemo(
    () => encodeURIComponent(`Hi, sharing my Duit Card: ${cardUrl}`),
    []
  );

  async function shareOnWhatsApp() {
    const digits = phone.replace(/\D/g, "");
    if (!digits) {
      Alert.alert("Phone number required", "Enter the recipient's WhatsApp number with country code.");
      return;
    }

    try {
      await Linking.openURL(`https://wa.me/${digits}?text=${message}`);
    } catch {
      Alert.alert("Could not open WhatsApp", "Please check that WhatsApp is installed on this device.");
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.pageTitle}>Share</Text>
        <Text style={styles.pageSubtitle}>
          Send your digital card over WhatsApp using their phone number.
        </Text>
        <View style={styles.businessCard}>
          <View style={styles.businessContent}>
            <Text style={styles.businessName}>Prakhar Goel</Text>
            <Text style={styles.businessRole}>Full-stack engineer - Product designer</Text>
            <Text style={styles.businessLink}>duit.cards/prakhar</Text>
          </View>
          <View style={styles.qrBlock}>
            <Ionicons name="qr-code-outline" size={66} color={colors.text} />
          </View>
        </View>
        <Text style={styles.inputLabel}>WhatsApp number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. 6281212345678"
          keyboardType="phone-pad"
          placeholderTextColor="#8B8B8B"
          style={styles.phoneInput}
        />
        <Pressable accessibilityRole="button" style={styles.shareButton} onPress={() => void shareOnWhatsApp()}>
          <Ionicons name="logo-whatsapp" size={22} color={colors.white} />
          <Text style={styles.shareButtonText}>Open WhatsApp</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  businessCard: {
    backgroundColor: colors.surface,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    marginTop: spacing.lg,
    padding: spacing.xl,
  },
  businessContent: {
    flex: 1,
  },
  businessLink: {
    color: colors.linkedInBlue,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  businessName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  businessRole: {
    color: "#555555",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  inputLabel: {
    color: "#333333",
    fontWeight: "800",
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
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
  phoneInput: {
    backgroundColor: colors.surface,
    borderColor: "#CFCFCF",
    borderRadius: spacing.sm,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: spacing.md,
  },
  qrBlock: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  shareButton: {
    alignItems: "center",
    backgroundColor: colors.linkedInGreen,
    borderRadius: 24,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.lg,
    paddingVertical: 14,
  },
  shareButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
