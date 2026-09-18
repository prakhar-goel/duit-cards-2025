import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  C,
  s,
  Title,
  Body,
  Label,
  Field,
  Button,
  Icon,
  Sheet,
  Notice,
} from "./ui";
import { usePilot } from "./store";
export function ServerSettings({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { server, setServer } = usePilot();
  const [url, setUrl] = useState(server);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setError("");
    setBusy(true);
    try {
      await setServer(url);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check the server address.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet
      visible={visible}
      title="Your DUIT server"
      subtitle="Connect to your DUIT server."
      onClose={onClose}
      footer={
        <Button busy={busy} onPress={() => void save()}>
          Save server & sign in
        </Button>
      }
    >
      <Field
        label="Server address"
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="https://your-private-server.example"
        hint="Paste the full HTTPS address, or your Mac’s local address and port."
      />
      <Notice>
        Changing server signs you out. Saved captures stay with the account and
        server that created them.
      </Notice>
      {error && <Notice error>{error}</Notice>}
    </Sheet>
  );
}
// Injected only for the private demo build; no credential is stored in source.
const demoEmail = process.env.EXPO_PUBLIC_DEMO_EMAIL ?? "";
const demoPassword = process.env.EXPO_PUBLIC_DEMO_PASSWORD ?? "";
const demoReady = Boolean(demoEmail && demoPassword);

export function AuthScreen() {
  const { signIn } = usePilot();
  const [create, setCreate] = useState(false);
  const [email, setEmail] = useState(demoReady ? demoEmail : "");
  const [password, setPassword] = useState(demoReady ? demoPassword : "");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(false);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      await signIn(email, password, create ? name : undefined, inviteCode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 28,
            paddingTop: 24,
            paddingBottom: 35,
            maxWidth: 560,
            width: "100%",
            alignSelf: "center",
            flexGrow: 1,
          }}
        >
          <View style={s.row}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                letterSpacing: 5,
                color: C.ink,
              }}
            >
              DUIT<Text style={{ color: C.teal }}>·</Text>
            </Text>
            <Pressable
              onPress={() => setSettings(true)}
              accessibilityRole="button"
              accessibilityLabel="Server settings"
              style={{ padding: 10 }}
            >
              <Icon name="options-outline" />
            </Pressable>
          </View>
          <View style={{ marginTop: 42, marginBottom: 34 }}>
            <Label>A LITTLE HELLO. A LOT OF POSSIBILITY.</Label>
            <Title size={43} style={{ marginTop: 17 }}>
              Good people.{"\n"}Real possibilities.
            </Title>
            <Body muted style={{ marginTop: 18, fontSize: 16, lineHeight: 25 }}>
              Remember the conversation. Find the right person. Make something
              happen.
            </Body>
          </View>
          <View
            style={{
              backgroundColor: C.teal,
              borderRadius: 24,
              padding: 23,
              marginBottom: 32,
              overflow: "hidden",
            }}
          >
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: C.lime,
                    fontSize: 11,
                    letterSpacing: 1.5,
                    fontWeight: "600",
                  }}
                >
                  FROM HELLO TO WHAT’S NEXT
                </Text>
                <Text
                  style={{
                    color: C.white,
                    fontSize: 20,
                    fontWeight: "500",
                    lineHeight: 28,
                    marginTop: 12,
                  }}
                >
                  Your network has potential.{"\n"}Give it a good memory.
                </Text>
              </View>
              <View
                style={{
                  width: 59,
                  height: 59,
                  borderRadius: 30,
                  backgroundColor: C.lime,
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 10,
                }}
              >
                <Icon name="arrow-up-right-box-outline" size={29} />
              </View>
            </View>
          </View>
          <Title size={24}>
            {create ? "Make your first introduction" : "Welcome back"}
          </Title>
          <Body muted style={{ marginTop: 8, marginBottom: 24 }}>
            {create
              ? "Create your DUIT account."
              : demoReady
                ? "Welcome back. Step inside."
                : "Sign in to DUIT."}
          </Body>
          {create && (
            <Field
              label="Your name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              placeholder="How should we call you?"
            />
          )}
          {!create && (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
              {[
                ["Maya · Northstar", "maya@northstar.example"],
                ["Noah · Fieldwork", "noah@fieldwork.example"],
              ].map(([label, value]) => (
                <Pressable
                  key={value}
                  onPress={() => setEmail(value)}
                  accessibilityRole="button"
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 12,
                    backgroundColor: C.soft,
                  }}
                >
                  <Text
                    style={{ fontSize: 11, color: C.teal, fontWeight: "600" }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@company.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={create ? "new-password" : "current-password"}
            placeholder={create ? "At least 10 characters" : "Your password"}
            onSubmitEditing={() => void submit()}
          />
          {create && (
            <Field
              label="Pilot invite code · if provided"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Your private invitation code"
            />
          )}
          {error && <Notice error>{error}</Notice>}
          <Button
            busy={busy}
            disabled={
              !email.trim() ||
              password.length < (create ? 10 : 1) ||
              (create && name.trim().length < 2)
            }
            onPress={() => void submit()}
            icon="arrow-forward"
          >
            {create ? "Create account" : "Step inside"}
          </Button>
          <Pressable
            onPress={() => {
              setCreate(!create);
              // Signup starts blank; returning to login restores the demo.
              setEmail(create && demoReady ? demoEmail : "");
              setPassword(create && demoReady ? demoPassword : "");
              setError("");
            }}
            accessibilityRole="button"
            style={{ alignItems: "center", padding: 20 }}
          >
            <Text style={{ fontSize: 13, color: C.teal, fontWeight: "600" }}>
              {create
                ? "Already have an account? Sign in"
                : "New to DUIT? Create an account"}
            </Text>
          </Pressable>
          <View style={{ flex: 1, minHeight: 15 }} />
          <Text
            style={{
              textAlign: "center",
              color: C.muted,
              fontSize: 11,
              lineHeight: 18,
            }}
          >
            DUIT · 2026{"\n"}Your notes stay private. Your business
            card travels.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <ServerSettings visible={settings} onClose={() => setSettings(false)} />
    </SafeAreaView>
  );
}
