import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  PanResponder,
  Modal,
  ScrollView,
  Linking,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  C,
  s,
  Avatar,
  Body,
  Button,
  CircleButton,
  Icon,
  Label,
  Notice,
  RemoteImage,
  Title,
} from "./ui";
import { getServer, mediaUrl, shareUrl } from "./api";
import { safeUrl } from "./domain";
import type { Card, Person } from "./types";

export function CardArtwork({
  uri,
  name,
  company,
  role,
  height,
  onPress,
  style,
}: {
  uri?: string | null;
  name: string;
  company?: string;
  role?: string;
  height?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [width, setWidth] = useState(340);
  const [ratio, setRatio] = useState(1.6);
  useEffect(() => setRatio(1.6), [uri]);
  const frameHeight = height ?? Math.min(420, width / ratio);
  const content = uri ? (
    <RemoteImage
      uri={uri}
      contain
      onSize={(w, h) => setRatio(w / h)}
      style={{ width: "100%", height: frameHeight }}
    />
  ) : (
    <View
      style={{
        minHeight: height ?? 210,
        padding: 23,
        backgroundColor: C.teal,
        justifyContent: "space-between",
        gap: 25,
      }}
    >
      <View style={s.row}>
        <Text
          style={{
            color: C.lime,
            fontSize: 11,
            letterSpacing: 1.5,
            fontWeight: "600",
          }}
        >
          {company || "DUIT"}
        </Text>
        <Icon name="arrow-up-right-box-outline" color={C.lime} size={20} />
      </View>
      <View>
        <Text
          style={{
            fontSize: 26,
            color: C.white,
            fontWeight: "500",
            letterSpacing: -0.8,
          }}
        >
          {name}
        </Text>
        {role ? (
          <Text style={{ color: "#B9CFC5", fontSize: 12, marginTop: 7 }}>
            {role}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontSize: 9, letterSpacing: 1, color: "#B9CFC5" }}>
        GENERATED LAYOUT · NO CARD IMAGE UPLOADED
      </Text>
    </View>
  );
  const frame = {
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: C.line,
  };
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}’s card`}
      onPress={onPress}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[frame, style]}
    >
      {content}
    </Pressable>
  ) : (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[frame, style]}
    >
      {content}
    </View>
  );
}

export function WalletTile({
  person,
  onPress,
  width,
}: {
  person: Person;
  onPress: () => void;
  width?: number;
}) {
  return (
    <View style={{ width: width ?? "100%", marginBottom: 20 }}>
      <CardArtwork
        uri={person.businessCardUrl}
        name={person.name}
        company={person.company}
        role={person.role}
        height={width ? width * 0.65 : undefined}
        onPress={onPress}
      />
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Meet ${person.name}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingTop: 11,
          paddingHorizontal: 2,
        }}
      >
        <Avatar name={person.name} url={person.photoUrl} size={34} />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 13, fontWeight: "600", color: C.ink }}
          >
            {person.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontSize: 10, color: C.muted, marginTop: 3 }}
          >
            {person.company || person.role || "New connection"}
          </Text>
        </View>
        <Icon name="arrow-forward-outline" size={16} color={C.muted} />
      </Pressable>
    </View>
  );
}

function OriginalCard({
  uri,
  name,
  onClose,
}: {
  uri: string;
  name: string;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [zoom, setZoom] = useState(false);
  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View
          style={{
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 15,
          }}
        >
          <View style={{ flex: 1 }}>
            <Title size={22}>{name}’s card</Title>
            <Text style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
              Original image · {zoom ? "drag to read" : "tap to enlarge"}
            </Text>
          </View>
          <CircleButton
            label="Close original card"
            icon="close-outline"
            onPress={onClose}
          />
        </View>
        <ScrollView
          horizontal
          maximumZoomScale={3}
          minimumZoomScale={1}
          contentContainerStyle={{
            minWidth: width,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ScrollView
            contentContainerStyle={{
              minHeight: height - 170,
              justifyContent: "center",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                zoom ? "Fit original card" : "Enlarge original card"
              }
              onPress={() => setZoom(!zoom)}
            >
              <RemoteImage
                uri={uri}
                contain
                style={{
                  width: zoom ? width * 2 : width - 24,
                  height: zoom ? (height - 180) * 2 : height - 180,
                  alignSelf: "center",
                }}
              />
            </Pressable>
          </ScrollView>
        </ScrollView>
        <Button tone="quiet" small onPress={() => setZoom(!zoom)}>
          {zoom ? "Fit whole card" : "Enlarge original"}
        </Button>
      </SafeAreaView>
    </Modal>
  );
}

const pages = ["Person", "Card", "Business"] as const;
type StoryPage = (typeof pages)[number];
export function CardStory({
  card,
  person,
  initialPage = "Person",
  onCTA,
  ctaLabel,
}: {
  card?: Card | null;
  person?: Person | null;
  initialPage?: StoryPage;
  onCTA?: () => void;
  ctaLabel?: string;
}) {
  const [page, setPage] = useState<StoryPage>(initialPage);
  const [original, setOriginal] = useState(false);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const storyId = person?.id ?? card?.id;
  useEffect(() => {
    setPage(initialPage);
    setMore(false);
    setError("");
  }, [storyId, initialPage]);
  const name = person?.name || card?.title || "Your name";
  const company = person?.company || card?.company || "";
  const role = person?.role || card?.role || "";
  const portrait = person?.photoUrl || card?.imageUrl;
  const originalUri = person?.businessCardUrl || card?.businessCardUrl;
  const hook =
    card?.subtitle ||
    card?.panels?.find((p) => p.panelType === "hook")?.body ||
    person?.bio ||
    "A good introduction starts with a conversation.";
  const cta =
    ctaLabel ||
    card?.ctaLabel ||
    (person?.email ? "Start a conversation" : "View business website");
  const canAct = Boolean(
    onCTA ||
      card?.isPublished ||
      card?.publicUrl ||
      person?.email ||
      person?.phone ||
      person?.website,
  );
  const move = (delta: number) =>
    setPage((p) => pages[Math.max(0, Math.min(2, pages.indexOf(p) + delta))]);
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > 45) move(g.dx < 0 ? 1 : -1);
        },
      }),
    [],
  );
  async function act() {
    setError("");
    if (onCTA) {
      onCTA();
      return;
    }
    let destination: string | undefined;
    if (card) {
      const contact = card.contact ?? {};
      if (card.ctaType === "email" && contact.email)
        destination = "mailto:" + contact.email;
      else if (card.ctaType === "call" && contact.phone)
        destination = "tel:" + contact.phone;
      else if (card.ctaType === "whatsapp" && contact.phone)
        destination = "https://wa.me/" + contact.phone.replace(/\D/g, "");
      else if (card.ctaType === "book" && card.ctaUrl)
        destination = card.ctaUrl;
      else if (card.slug)
        destination =
          shareUrl(
            card.publicUrl ||
              getServer() + "/c/" + encodeURIComponent(card.slug),
          ) + "#contact";
    }
    if (!destination)
      destination = person?.email
        ? "mailto:" + person.email
        : person?.website ||
          (person?.phone ? "tel:" + person.phone : undefined);
    const allowed = destination && safeUrl(destination);
    if (!allowed) {
      setError("No contact action has been added yet.");
      return;
    }
    try {
      await Linking.openURL(allowed);
    } catch {
      setError(
        "This action could not open. Their contact details are still available below.",
      );
    }
  }
  return (
    <View>
      <View style={{ flexDirection: "row", gap: 7, marginBottom: 15 }}>
        {pages.map((p, i) => (
          <Pressable
            key={p}
            accessibilityRole="tab"
            accessibilityLabel={p + " page"}
            accessibilityState={{ selected: page === p }}
            onPress={() => {
              setPage(p);
              setMore(false);
            }}
            style={{ flex: 1, paddingVertical: 8 }}
          >
            <View
              style={{
                height: 3,
                borderRadius: 4,
                backgroundColor: page === p ? C.teal : C.line,
                marginBottom: 10,
              }}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: page === p ? "700" : "400",
                color: page === p ? C.ink : C.muted,
              }}
            >
              {String(i + 1).padStart(2, "0")} {p}
            </Text>
          </Pressable>
        ))}
      </View>
      <View {...swipe.panHandlers}>
        {page === "Person" ? (
          <View
            style={{
              height: 365,
              borderRadius: 22,
              overflow: "hidden",
              backgroundColor: C.soft,
            }}
          >
            {portrait ? (
              <RemoteImage
                uri={portrait}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingBottom: 85,
                }}
              >
                <Avatar name={name} size={150} />
              </View>
            )}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 20,
                backgroundColor: "rgba(20,46,43,0.92)",
              }}
            >
              <Text
                style={{
                  color: C.white,
                  fontSize: 27,
                  fontWeight: "600",
                  letterSpacing: -0.8,
                }}
              >
                {name}
              </Text>
              <Text style={{ color: "#D2DFD7", fontSize: 12, marginTop: 6 }}>
                {[role, company].filter(Boolean).join(" · ")}
              </Text>
              {person?.city && (
                <Text style={{ color: "#D2DFD7", fontSize: 10, marginTop: 7 }}>
                  {person.city}
                </Text>
              )}
            </View>
          </View>
        ) : page === "Card" ? (
          <View>
            <CardArtwork
              uri={originalUri}
              name={name}
              company={company}
              role={role}
              onPress={originalUri ? () => setOriginal(true) : undefined}
            />
            <View style={[s.row, { marginTop: 11 }]}>
              <Text style={{ fontSize: 11, color: C.muted }}>
                {originalUri
                  ? "Original visiting card"
                  : "A digital card for this connection"}
              </Text>
              {originalUri && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View original visiting card"
                  onPress={() => setOriginal(true)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <Text
                    style={{ fontSize: 11, color: C.teal, fontWeight: "600" }}
                  >
                    Enlarge
                  </Text>
                  <Icon name="expand-outline" size={14} />
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View>
            {card?.coverUrl ? (
              <View
                style={{
                  height: 340,
                  borderRadius: 20,
                  overflow: "hidden",
                  backgroundColor: C.white,
                  borderWidth: 1,
                  borderColor: C.line,
                }}
              >
                <RemoteImage
                  uri={card.coverUrl}
                  contain
                  style={{ width: "100%", height: "100%" }}
                />
              </View>
            ) : (
              <View
                style={{
                  height: 180,
                  backgroundColor: C.soft,
                  borderRadius: 20,
                  padding: 24,
                  justifyContent: "space-between",
                }}
              >
                <Icon name="briefcase-outline" size={33} />
                <Title size={30}>{company || "Their business"}</Title>
              </View>
            )}
            <Text
              style={{
                fontSize: 11,
                color: C.muted,
                marginTop: 16,
                marginBottom: 7,
              }}
            >
              {company || name}
            </Text>
            <Text
              style={{
                fontSize: 22,
                lineHeight: 28,
                letterSpacing: -0.6,
                color: C.ink,
                fontWeight: "500",
              }}
            >
              {hook}
            </Text>
            {(card?.panels?.length ?? 0) > 1 && (
              <Button
                tone="quiet"
                small
                onPress={() => setMore(!more)}
                style={{ alignSelf: "flex-start", marginTop: 8 }}
              >
                {more ? "Less detail" : "Explore the business"}
              </Button>
            )}
            {more &&
              card?.panels
                ?.filter((p) => !["hook", "cta"].includes(p.panelType))
                .map((p) => (
                  <View
                    key={p.panelType}
                    style={{
                      marginTop: 18,
                      paddingTop: 17,
                      borderTopWidth: 1,
                      borderColor: C.line,
                    }}
                  >
                    <Label>{p.panelType}</Label>
                    <Body style={{ marginTop: 7, fontSize: 14 }}>{p.body}</Body>
                  </View>
                ))}
          </View>
        )}
      </View>
      {error && (
        <View style={{ marginTop: 12 }}>
          <Notice error>{error}</Notice>
        </View>
      )}
      {canAct && (
        <Button
          onPress={() => void act()}
          icon="arrow-forward-outline"
          style={{ marginTop: 18 }}
        >
          {cta}
        </Button>
      )}
      {original && originalUri && (
        <OriginalCard
          uri={originalUri}
          name={name}
          onClose={() => setOriginal(false)}
        />
      )}
    </View>
  );
}
