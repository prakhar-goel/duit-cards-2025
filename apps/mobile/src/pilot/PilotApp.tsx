import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ExpoLinking from "expo-linking";
import { PilotProvider, usePilot } from "./store";
import { AuthScreen } from "./Auth";
import { ExchangeScreen } from "./Exchange";
import { PeopleScreen, PersonDetail } from "./People";
import { MeetingsScreen } from "./Meetings";
import { CardStory } from "./CardStory";
import { MyCardScreen } from "./Cards";
import { CaptureSheet } from "./Capture";
import {
  C,
  Icon,
  Label,
  Title,
  Body,
  Sheet,
  Button,
  Notice,
  Avatar,
  pressFeedback,
} from "./ui";
import { get, post } from "./api";
import type { Person, Tab, Card } from "./types";
import { ThemeProvider, useTheme } from "./theme";
const tabs: { name: Tab; icon: React.ComponentProps<typeof Icon>["name"] }[] = [
  { name: "People", icon: "people-outline" },
  { name: "Share", icon: "share-outline" },
  { name: "My Card", icon: "id-card-outline" },
];
function Main() {
  // Re-render themed screens without remounting navigation or the account store.
  useTheme();
  const store = usePilot();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("People");
  const [personId, setPersonId] = useState<string | null>(null);
  const [capture, setCapture] = useState(false);
  const [capturePerson, setCapturePerson] = useState<Person | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [publicCard, setPublicCard] = useState<Card | null>(null);
  const [linkError, setLinkError] = useState("");
  const url = ExpoLinking.useURL();
  const opacity = useRef(new Animated.Value(1)).current;
  const handled = useRef("");
  useEffect(() => {
    setTab("People");
    setPersonId(null);
    setCapture(false);
    setCapturePerson(null);
  }, [store.session?.user.id]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (store.session && tab !== "People") {
          setTab("People");
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [store.session?.user.id, tab]);
  useEffect(() => {
    if (!url || url === handled.current) return;
    handled.current = url;
    const parsed = ExpoLinking.parse(url);
    const parts = [parsed.hostname, ...(parsed.path ?? "").split("/")].filter(
      Boolean,
    ) as string[];
    const type = parts[parts.length - 2];
    const id = parts[parts.length - 1];
    if (["card", "c", "share", "s"].includes(type)) {
      setShareToken(type === "share" || type === "s" ? id : null);
      void get(
        `/public/${type === "share" || type === "s" ? "shares" : "cards"}/${encodeURIComponent(id)}`,
      )
        .then((r) => setPublicCard(r.card))
        .catch((e) => setLinkError(e.message));
    }
  }, [url]);
  function navigate(next: Tab) {
    pressFeedback();
    if (next === "Capture") {
      setCapturePerson(null);
      setCapture(true);
      return;
    }
    setTab(next);
    opacity.setValue(0.4);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }
  function openCapture(p?: Person) {
    setCapturePerson(p ?? null);
    setCapture(true);
  }
  if (!store.ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            letterSpacing: 6,
            fontSize: 30,
            fontWeight: "700",
            color: C.teal,
          }}
        >
          DUIT
        </Text>
        <ActivityIndicator color={C.teal} style={{ marginTop: 25 }} />
      </View>
    );
  if (!store.session) return <AuthScreen />;
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <StatusBar style="dark" />
      <Animated.View style={{ flex: 1, opacity }}>
        {tab === "People" ? (
          <PeopleScreen onPerson={setPersonId} onCapture={() => openCapture()} onCreate={() => navigate("My Card")} />
        ) : tab === "Share" ? (
          <ExchangeScreen onCreate={() => navigate("My Card")} />
        ) : <MyCardScreen />}
      </Animated.View>
      <View
        style={{
          backgroundColor: C.bg,
          borderTopWidth: 1,
          borderTopColor: C.line,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            maxWidth: 760,
            width: "100%",
            alignSelf: "center",
            paddingHorizontal: 9,
          }}
        >
          {tabs.map((t) => (
            <Pressable
              key={t.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t.name }}
              accessibilityLabel={t.name}
              onPress={() => navigate(t.name)}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 52,
                gap: 5,
              }}
            >
              {t.name === "Share" ? (
                <View
                  style={{
                    width: 51,
                    height: 51,
                    borderRadius: 19,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: C.teal,
                    marginTop: -18,
                    borderWidth: 5,
                    borderColor: C.bg,
                  }}
                >
                  <Icon name="share-outline" color={C.lime} size={29} />
                </View>
              ) : (
                <View
                  style={{
                    width: 42,
                    height: 29,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 11,
                    backgroundColor: tab === t.name ? C.soft : "transparent",
                  }}
                >
                  <Icon
                    name={t.icon}
                    color={tab === t.name ? C.teal : C.muted}
                    size={22}
                  />
                </View>
              )}
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: tab === t.name ? "700" : "500",
                  color: tab === t.name ? C.teal : C.muted,
                  marginTop: t.name === "Share" ? -1 : 0,
                }}
              >
                {t.name}{t.name === "My Card" && store.data.leads.some(l => l.status === "new") ? " •" : ""}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {store.toast && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 100 + insets.bottom,
            left: 20,
            right: 20,
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: C.ink,
              paddingHorizontal: 21,
              paddingVertical: 15,
              borderRadius: 18,
              maxWidth: 500,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                lineHeight: 19,
                color: C.white,
                textAlign: "center",
              }}
            >
              {store.toast}
            </Text>
          </View>
        </View>
      )}
      <PersonDetail
        suspended={capture}
        id={personId}
        onClose={() => setPersonId(null)}
        onCapture={openCapture}
      />
      <CaptureSheet
        visible={capture}
        existing={capturePerson}
        onClose={() => setCapture(false)}
        onSaved={(id) => {
          if (id) {
            if (!personId) setPersonId(id);
          }
        }}
      />
      <Sheet
        visible={Boolean(publicCard) || Boolean(linkError)}
        title="An introduction for you"
        onClose={() => {
          setPublicCard(null);
          setLinkError("");
        }}
        footer={
          publicCard ? (
            <Button
              onPress={() =>
                void post(shareToken ? `/shares/${encodeURIComponent(shareToken)}/save` : `/cards/${publicCard.id}/save`)
                  .then(async (r) => {
                    setPublicCard(null);
                    await store.refresh();
                    setPersonId(r.person.id);
                    store.notify("Saved to your people.");
                  })
                  .catch((e) => store.notify(e.message))
              }
            >
              Save this person
            </Button>
          ) : undefined
        }
      >
        {linkError && <Notice error>{linkError}</Notice>}
        {publicCard && <CardStory card={publicCard} />}
      </Sheet>
    </SafeAreaView>
  );
}
export default function PilotApp() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ThemeProvider>
        <PilotProvider>
          <Main />
        </PilotProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
