import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TextInput,
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
import { sendPhoneCode, watchPhoneSignIn, clearPhoneSignIn } from "./phoneAuth";
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
export function AuthScreen() {
  const { signInPhone } = usePilot();
  const [started, setStarted] = useState(false);
  const [phone, setPhone] = useState("+91");
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState<
    ((code: string) => Promise<string>) | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [verified, setVerified] = useState<{
    token: string;
    at: number;
  } | null>(null);
  const exchanging = useRef(false);
  const requesting = useRef(false);
  const scroll = useRef<ScrollView>(null);
  async function finish(token: string) {
    if (exchanging.current) return;
    exchanging.current = true;
    setVerified({ token, at: Date.now() });
    setBusy(true);
    try {
      await signInPhone(token);
      await clearPhoneSignIn();
    } catch (e) {
      if ((e as any)?.status === 401) setVerified(null);
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      exchanging.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    // Start fresh; a cached Firebase identity must not silently reopen a signed-out DUIT account.
    let stop = () => {};
    let active = true;
    void clearPhoneSignIn()
      .then(() => {
        if (active)
          stop = watchPhoneSignIn((token) => {
            if (requesting.current) void finish(token);
          });
      })
      .catch(() => {});
    return () => {
      active = false;
      stop();
    };
  }, []);
  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(() => setRemaining((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  function reveal() {
    if (Platform.OS === "web") return;
    requestAnimationFrame(() => {
      const input = TextInput.State.currentlyFocusedInput();
      if (input)
        scroll.current?.scrollResponderScrollNativeHandleToKeyboard(
          input,
          24,
          true,
        );
    });
  }
  useEffect(() => {
    const listener = Keyboard.addListener("keyboardDidShow", reveal);
    return () => listener.remove();
  }, []);
  async function send() {
    if (remaining > 0 || busy) return;
    setBusy(true);
    setError("");
    requesting.current = true;
    setVerified(null);
    try {
      const confirmation = await sendPhoneCode(phone.replace(/[\s()-]/g, ""));
      setConfirm(() => confirmation);
      setCode("");
      setRemaining(60);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not send a code. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    if (verified && Date.now() - verified.at < 5 * 60 * 1000) {
      setError("");
      await finish(verified.token);
      return;
    }
    if (verified) {
      setVerified(null);
      setError("Please request a new code to continue.");
      return;
    }
    if (!confirm) return;
    setBusy(true);
    setError("");
    try {
      await finish(await confirm(code));
    } catch {
      setError("That code is invalid or expired. Check it or request another.");
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : Platform.OS === "android"
              ? "height"
              : undefined
        }
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 24,
            flexGrow: 1,
            maxWidth: 560,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <View style={s.row}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "800",
                letterSpacing: 5,
                color: C.ink,
              }}
            >
              DUIT·
            </Text>
            <Pressable
              accessibilityLabel="Server settings"
              onPress={() => setSettings(true)}
              style={{ padding: 12 }}
            >
              <Icon name="options-outline" />
            </Pressable>
          </View>
          {!started ? (
            <>
              <View
                style={{ marginTop: 36, height: 300, justifyContent: "center" }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: 20,
                    right: 4,
                    height: 205,
                    backgroundColor: C.soft,
                    borderRadius: 22,
                    transform: [{ rotate: "8deg" }],
                    borderWidth: 1,
                    borderColor: C.line,
                  }}
                />
                <View
                  style={{
                    padding: 28,
                    backgroundColor: C.teal,
                    borderRadius: 22,
                    transform: [{ rotate: "-5deg" }],
                  }}
                >
                  <Text
                    style={{ color: C.lime, fontSize: 12, letterSpacing: 2 }}
                  >
                    YOUR NEXT INTRODUCTION
                  </Text>
                  <Text
                    style={{
                      color: C.white,
                      fontSize: 36,
                      fontWeight: "700",
                      marginTop: 22,
                    }}
                  >
                    You. Your work.
                  </Text>
                  <Text style={{ color: C.white, fontSize: 17, marginTop: 7 }}>
                    A reason to stay in touch.
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 36,
                    }}
                  >
                    <Icon name="location-outline" color={C.lime} size={18} />
                    <Text style={{ color: C.white }}>
                      Every hello has a place.
                    </Text>
                  </View>
                </View>
              </View>
              <Title size={38}>Make the hello{`\n`}go somewhere.</Title>
              <Body muted style={{ marginTop: 16, marginBottom: 24 }}>
                Share your card. Remember where you met. Pick up the
                conversation.
              </Body>
              <View style={{ flex: 1, minHeight: 20 }} />
              <Button onPress={() => setStarted(true)} icon="arrow-forward">
                Get started
              </Button>
              <Button tone="quiet" onPress={() => setStarted(true)}>
                Already here? Sign in
              </Button>
            </>
          ) : (
            <>
              <View style={{ marginTop: 48, marginBottom: 28 }}>
                <Title size={34}>
                  {confirm
                    ? "Check your messages."
                    : "Your number.\nYour people."}
                </Title>
                <Body muted style={{ marginTop: 14 }}>
                  {confirm
                    ? `Enter the 6-digit code sent to ${phone}.`
                    : "One number to sign in or create your account."}
                </Body>
              </View>
              {!confirm ? (
                <Field
                  label="Mobile number with country code"
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(value);
                    setVerified(null);
                    requesting.current = false;
                  }}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  onFocus={reveal}
                  placeholder="+91 98765 43210"
                />
              ) : (
                <Field
                  label="Verification code"
                  value={code}
                  onChangeText={(v) =>
                    setCode(v.replace(/\D/g, "").slice(0, 6))
                  }
                  keyboardType="number-pad"
                  autoComplete="sms-otp"
                  textContentType="oneTimeCode"
                  onFocus={reveal}
                  maxLength={6}
                />
              )}
              {!!error && <Notice error>{error}</Notice>}
              <Button
                busy={busy}
                disabled={
                  verified
                    ? false
                    : confirm
                      ? code.length !== 6
                      : remaining > 0 ||
                        !/^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s()-]/g, ""))
                }
                onPress={() => void (confirm || verified ? verify() : send())}
              >
                {confirm || verified
                  ? "Continue"
                  : remaining
                    ? `Send code in ${remaining}s`
                    : "Send code"}
              </Button>
              {confirm && (
                <>
                  <Button
                    tone="quiet"
                    disabled={remaining > 0 || busy}
                    onPress={() => void send()}
                  >
                    {remaining ? `Resend in ${remaining}s` : "Resend code"}
                  </Button>
                  <Button
                    tone="quiet"
                    onPress={() => {
                      setConfirm(null);
                      setVerified(null);
                      setError("");
                      requesting.current = false;
                    }}
                  >
                    Change number
                  </Button>
                </>
              )}
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 19,
                  color: C.muted,
                  marginTop: 24,
                }}
              >
                By continuing, you agree to receive a verification SMS. Google
                processes your number to verify sign-in and prevent abuse.
              </Text>
              <View nativeID="phone-recaptcha" />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <ServerSettings visible={settings} onClose={() => setSettings(false)} />
    </SafeAreaView>
  );
}
