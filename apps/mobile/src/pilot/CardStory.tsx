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
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
  ParallaxMedia,
  Title,
} from "./ui";
import { getServer, mediaUrl, mediaHeaders, shareUrl } from "./api";
import { safeUrl } from "./domain";
import { LeadForm } from "./LeadForm";
import { post } from "./api";
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
      onSize={height === undefined ? (w, h) => setRatio(w / h) : undefined}
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
      onLayout={
        height === undefined
          ? (e) => setWidth(e.nativeEvent.layout.width)
          : undefined
      }
      style={[frame, style]}
    >
      {content}
    </Pressable>
  ) : (
    <View
      onLayout={
        height === undefined
          ? (e) => setWidth(e.nativeEvent.layout.width)
          : undefined
      }
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${person.name}’s card`}
      onPress={onPress}
      style={{ width: width ?? "100%", marginBottom: 20 }}
    >
      <CardArtwork
        uri={person.businessCardUrl}
        name={person.name}
        company={person.company}
        role={person.role}
        height={width ? width * 0.65 : undefined}
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
    </Pressable>
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

function StoryVideo({ uri, poster }: { uri: string; poster?: string | null }) {
  const url = mediaUrl(uri) || uri;
  const player = useVideoPlayer(
    { uri: url, headers: mediaHeaders(url) },
    (p) => {
      p.loop = true;
      p.muted = true;
      p.play();
    },
  );
  const { error, status } = useEvent(player, "statusChange", {
    status: player.status,
  });
  return (
    <View style={{ flex: 1, backgroundColor: "#12201d" }}>
      <VideoView
        player={player}
        contentFit="contain"
        nativeControls
        allowsFullscreen
        style={{ width: "100%", height: "100%" }}
      />
      {status !== "readyToPlay" && poster && (
        <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
          <RemoteImage
            uri={poster}
            contain
            style={{ width: "100%", height: "100%" }}
          />
        </View>
      )}
      {!!error && (
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
  immersive = false,
  onDockChange,
}: {
  card?: Card | null;
  person?: Person | null;
  initialPage?: StoryPage;
  onCTA?: () => void;
  ctaLabel?: string;
  visible?: boolean;
  immersive?: boolean;
  onDockChange?: (action: StoryAction) => void;
}) {
  const [page, setPage] = useState(0);
  const [enquiry, setEnquiry] = useState(false);
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Captions sit inside the portrait frame, leaving about 30% for About below.
  const imageHeight = immersive
    ? Math.max(250, (screenHeight - insets.top - insets.bottom - 64 - 60) * 0.7)
    : 440;
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
      ctaLabel: "Let’s connect",
      ctaPrompt: `Meet ${name.split(" ")[0]} · ${company}`,
      ctaColor: card?.theme?.color,
    },
    {
      kind: "card",
      url: originalUri,
      title: company || name,
      caption: "Business card",
      ctaLabel: "Work with us",
      ctaPrompt: card?.subtitle || company,
      ctaColor: card?.theme?.color,
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
      .filter((m) => !!m.url?.trim())
      .slice(0, 4)
      .map((m) => ({
        kind: m.type,
        url: m.url,
        title: m.title || company,
        caption: m.caption || hook,
        ctaLabel: "ctaLabel" in m ? (m.ctaLabel as string) : undefined,
        ctaPrompt: "ctaPrompt" in m ? (m.ctaPrompt as string) : undefined,
        ctaColor: "ctaColor" in m ? (m.ctaColor as string) : undefined,
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
  const current = slides[Math.min(page, slides.length - 1)];
  const cta =
    current?.ctaLabel || ctaLabel || card?.ctaLabel || "Start a conversation";
  const prompt = current?.ctaPrompt || current?.caption || company;
  const color = /^#[0-9a-f]{6}$/i.test(
    current?.ctaColor || card?.theme?.color || "",
  )
    ? (current?.ctaColor || card?.theme?.color)!
    : C.teal;
  useEffect(() => {
    onDockChange?.({ label: cta, prompt, color, act: () => void act() });
  }, [page, card, person, ctaLabel, onDockChange]);
  useEffect(() => {
    if (card?.slug && visible)
      void post(`/public/cards/${encodeURIComponent(card.slug)}/events`, {
        type: "viewed",
        source: "android-card",
        eventKey: `view:${card.id}:${Date.now()}`,
      }).catch(() => {});
  }, [card?.id]);
  const leadCard =
    card?.slug && (card.isPublished || card.publicUrl)
      ? card
      : person?.cardSlug
        ? { slug: person.cardSlug, title: name, company, imageUrl: portrait }
        : null;
  const canAct = Boolean(
    onCTA ||
    leadCard ||
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
    if (leadCard) {
      setEnquiry(true);
      void post(`/public/cards/${encodeURIComponent(leadCard.slug)}/cta`, {
        source: "android-card",
      }).catch(() => {});
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
      <View
        style={{
          height: imageHeight,
          overflow: "hidden",
          borderRadius: immersive ? 0 : 20,
          backgroundColor: "#102822",
        }}
      >
        <ParallaxMedia height={imageHeight}>
          <ScrollView
            ref={scroll}
            horizontal
            pagingEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setPage(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            style={{
              height: imageHeight,
              borderRadius: immersive ? 0 : 20,
              backgroundColor: "#102822",
            }}
          >
            {slides.map((slide, index) => (
              <View
                key={index}
                style={{
                  width,
                  height: imageHeight,
                  overflow: "hidden",
                  justifyContent: "center",
                }}
              >
                {Math.abs(index - page) > 1 ? (
                  <View />
                ) : slide.kind === "video" ? (
                  index === page && visible && !enquiry ? (
                    <StoryVideo
                      key={slide.url}
                      uri={slide.url!}
                      poster={card?.coverUrl}
                    />
                  ) : (
                    <View />
                  )
                ) : slide.kind === "card" ? (
                  <CardArtwork
                    uri={slide.url}
                    name={name}
                    company={company}
                    role={role}
                    height={imageHeight}
                    onPress={
                      slide.url ? () => setOriginal(slide.url!) : undefined
                    }
                    style={{
                      borderWidth: 0,
                      borderRadius: 0,
                      backgroundColor: "#102822",
                    }}
                  />
                ) : slide.url ? (
                  <RemoteImage
                    uri={slide.url}
                    contain
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
        </ParallaxMedia>
        <LinearGradient
          pointerEvents="none"
          colors={["transparent", "rgba(5,20,17,0.35)", "rgba(5,20,17,0.94)"]}
          locations={[0, 0.35, 1]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 170,
          }}
        />
        <View
          style={{ position: "absolute", bottom: 12, left: 20, right: 20 }}
          pointerEvents="box-none"
        >
          <View
            style={[s.row, { alignItems: "flex-end" }]}
            pointerEvents="none"
          >
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 25,
                  lineHeight: 29,
                  fontWeight: "600",
                  color: C.white,
                }}
              >
                {current?.title}
              </Text>
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  color: "#E5EDE8",
                  marginTop: 5,
                }}
              >
                {current?.caption}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: C.white, paddingBottom: 2 }}>
              {page + 1} / {slides.length}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 5, marginTop: 6 }}>
            {slides.map((slide, index) => (
              <Pressable
                key={index}
                accessibilityRole="tab"
                accessibilityLabel={`Slide ${index + 1}: ${slide.title}`}
                accessibilityState={{ selected: page === index }}
                onPress={() => move(index)}
                style={{ flex: 1, paddingVertical: 10 }}
              >
                <View
                  style={{
                    height: 3,
                    borderRadius: 4,
                    backgroundColor: page === index ? C.white : "#FFFFFF55",
                  }}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: immersive ? 22 : 0 }}>
        {!!error && <Notice error>{error}</Notice>}
        {canAct && !onDockChange && (
          <Button
            onPress={() => void act()}
            icon="arrow-forward-outline"
            style={{ marginTop: 18 }}
          >
            {cta}
          </Button>
        )}
      </View>
      {enquiry && leadCard && (
        <LeadForm
          card={leadCard}
          label={cta}
          context={current?.title || company}
          productImage={
            current?.kind === "video" ||
            current?.kind === "person" ||
            current?.kind === "card"
              ? card?.coverUrl || gallery.find((m) => m.type === "image")?.url
              : current?.url || card?.coverUrl
          }
          category={[role, company, card?.bio, current?.caption]
            .filter(Boolean)
            .join(" ")}
          onClose={() => setEnquiry(false)}
        />
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

export type StoryAction = {
  label: string;
  prompt: string;
  color: string;
  act: () => void;
};
export function StoryDock({ action }: { action: StoryAction | null }) {
  if (!action) return null;
  return (
    <View
      style={{
        backgroundColor: action.color,
        paddingVertical: 6,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Text
        numberOfLines={2}
        style={{ color: "#fff", fontSize: 11, lineHeight: 15, flex: 1 }}
      >
        {action.prompt}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={action.act}
        style={({ pressed }) => ({
          backgroundColor: "#fff",
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 6,
          minHeight: 44,
          flexBasis: "48%",
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text
          style={{
            color: "#153D35",
            fontWeight: "700",
            fontSize: 12,
            lineHeight: 17,
            includeFontPadding: false,
            textAlignVertical: "center",
            textAlign: "center",
          }}
        >
          {action.label} ↗
        </Text>
      </Pressable>
    </View>
  );
}
