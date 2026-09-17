import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
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
import { getServer, mediaUrl, mediaHeaders, shareUrl } from "./api";
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
      <View
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
      </View>
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

type StoryPage = "Person" | "Card" | "Business";

function StoryVideo({ uri }: { uri: string }) {
  const url = mediaUrl(uri) || uri;
  const player = useVideoPlayer(
    { uri: url, headers: mediaHeaders(url) },
    (p) => {
      p.loop = false;
    },
  );
  const { error } = useEvent(player, "statusChange", { status: player.status });
  return (
    <View style={{ flex: 1, backgroundColor: "#12201d" }}>
      <VideoView
        player={player}
        contentFit="contain"
        nativeControls
        allowsFullscreen
        style={{ width: "100%", height: "100%" }}
      />
      {error && (
        <Text
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            color: C.white,
          }}
        >
          Video unavailable. Try again when connected.
        </Text>
      )}
    </View>
  );
}
export function CardStory({
  card,
  person,
  initialPage = "Person",
  onCTA,
  ctaLabel,
  visible = true,
}: {
  card?: Card | null;
  person?: Person | null;
  initialPage?: StoryPage;
  onCTA?: () => void;
  ctaLabel?: string;
  visible?: boolean;
}) {
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(340);
  const [original, setOriginal] = useState<string | null>(null);
  const [error, setError] = useState("");
  const scroll = useRef<ScrollView>(null);
  const name = person?.name || card?.title || "Your name";
  const company = person?.company || card?.company || "";
  const role = person?.role || card?.role || "";
  const portrait = person?.photoUrl || card?.imageUrl;
  const originalUri = card?.businessCardUrl || person?.businessCardUrl;
  const back = card?.businessCardBackUrl || person?.businessCardBackUrl;
  const hook =
    card?.subtitle || person?.bio || "Let’s find a way to work together.";
  const gallery = card?.businessMedia?.length
    ? card.businessMedia
    : [
        {
          url: card?.coverUrl || "",
          type: "image" as const,
          title: company,
          caption: hook,
        },
      ];
  const slides = [
    {
      kind: "person",
      url: portrait,
      title: name,
      caption: [role, company].filter(Boolean).join(" · "),
    },
    {
      kind: "card",
      url: originalUri,
      title: company || name,
      caption: "Business card",
    },
    ...(back
      ? [
          {
            kind: "card",
            url: back,
            title: company || name,
            caption: "Business card · back",
          },
        ]
      : []),
    ...gallery
      .slice(0, 4)
      .map((m) => ({
        kind: m.type,
        url: m.url,
        title: m.title || company,
        caption: m.caption || hook,
      })),
  ];
  const storyId = person?.id || card?.id;
  useEffect(() => {
    const next =
      initialPage === "Person" ? 0 : initialPage === "Card" ? 1 : back ? 3 : 2;
    setPage(next);
    scroll.current?.scrollTo({ x: next * width, animated: false });
    setError("");
  }, [storyId, initialPage]);
  useEffect(() => {
    scroll.current?.scrollTo({ x: page * width, animated: false });
  }, [width]);
  const move = (index: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    setPage(next);
    scroll.current?.scrollTo({ x: next * width, animated: true });
  };
  const cta = ctaLabel || card?.ctaLabel || "Start a conversation";
  const canAct = Boolean(
    onCTA ||
    card?.isPublished ||
    card?.publicUrl ||
    person?.email ||
    person?.phone ||
    person?.website,
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
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        style={{ height: 350, borderRadius: 20, backgroundColor: C.soft }}
      >
        {slides.map((slide, index) => (
          <View
            key={index}
            style={{
              width,
              height: 350,
              overflow: "hidden",
              justifyContent: "center",
            }}
          >
            {slide.kind === "video" ? (
              index === page && visible ? (
                <StoryVideo key={slide.url} uri={slide.url!} />
              ) : (
                <View />
              )
            ) : slide.kind === "card" ? (
              <CardArtwork
                uri={slide.url}
                name={name}
                company={company}
                role={role}
                height={350}
                onPress={slide.url ? () => setOriginal(slide.url!) : undefined}
                style={{ borderWidth: 0, borderRadius: 0 }}
              />
            ) : slide.url ? (
              <RemoteImage
                uri={slide.url}
                contain={slide.kind !== "person"}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <View style={{ alignItems: "center", padding: 28 }}>
                <Avatar name={name} size={120} />
                <Title size={28} style={{ marginTop: 24 }}>
                  {company || name}
                </Title>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={{ flexDirection: "row", gap: 5, marginTop: 12 }}>
        {slides.map((slide, index) => (
          <Pressable
            key={index}
            accessibilityRole="tab"
            accessibilityLabel={`Slide ${index + 1}: ${slide.title}`}
            accessibilityState={{ selected: page === index }}
            onPress={() => move(index)}
            style={{ flex: 1, paddingVertical: 8 }}
          >
            <View
              style={{
                height: 3,
                borderRadius: 4,
                backgroundColor: page === index ? C.teal : C.line,
              }}
            />
          </Pressable>
        ))}
      </View>
      <View style={[s.row, { marginTop: 4, alignItems: "flex-start" }]}>
        <View style={{ flex: 1 }}>
          <Title size={23}>{slides[page]?.title}</Title>
          <Body muted style={{ fontSize: 13, lineHeight: 20, marginTop: 6 }}>
            {slides[page]?.caption}
          </Body>
        </View>
        <Text style={{ fontSize: 11, color: C.muted, marginTop: 7 }}>
          {page + 1} / {slides.length}
        </Text>
      </View>
      {error && <Notice error>{error}</Notice>}
      {canAct && (
        <Button
          onPress={() => void act()}
          icon="arrow-forward-outline"
          style={{ marginTop: 18 }}
        >
          {cta}
        </Button>
      )}
      {original && (
        <OriginalCard
          uri={original}
          name={name}
          onClose={() => setOriginal(null)}
        />
      )}
    </View>
  );
}
