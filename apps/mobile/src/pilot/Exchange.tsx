import React, { useEffect, useRef, useState } from "react";
import { View, Text, Linking, ScrollView, Pressable } from "react-native";
import * as Location from "expo-location";
import * as Clipboard from "expo-clipboard";
import { usePilot } from "./store";
import { get, shareUrl, getServer } from "./api";
import { randomId } from "./domain";
import {
  Page,
  C,
  s,
  Title,
  Body,
  Field,
  Button,
  Notice,
  Pill,
  Avatar,
  Label,
  Icon,
} from "./ui";
import { DateTimeField } from "./DateTimeField";
import { PhoneField } from "./PhoneField";
import { internationalPhone } from "./phoneFormat";
import type { CountryCode } from "libphonenumber-js/min";
import { nearbyEvents } from "./meetingContext";
import {
  introductionMessage,
  normalisePhone,
  shareDisabledReason,
} from "./exchangeMessage";

type Place = {
  location: string;
  city: string;
  countryCode: string;
  label?: string;
  latitude?: number;
  longitude?: number;
};
const topics = [
  "Business introduction",
  "Buying a product or service",
  "Selling my product or service",
  "Working together",
  "A follow-up meeting",
  "Something else",
];
function within<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    work,
    new Promise<T>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              "GPS is taking too long. Try again outdoors, or search for the place below.",
            ),
          ),
        ms,
      );
    }),
  ]).finally(() => clearTimeout(timer));
}
export function ExchangeScreen({ onCreate }: { onCreate: () => void }) {
  const { data, notify, offline, exchange } = usePilot();
  const cards = data.cards.filter((c) => c.isPublished);
  const [cardId, setCardId] = useState(cards[0]?.id || "");
  const card = cards.find((c) => c.id === cardId) || cards[0];
  const [name, setName] = useState(""),
    [nationalPhone, setNationalPhone] = useState("");
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("IN");
  const phone = internationalPhone(phoneCountry, nationalPhone);
  const [topic, setTopic] = useState(""),
    [note, setNote] = useState(""),
    [topicsOpen, setTopicsOpen] = useState(false);
  const [place, setPlace] = useState<Place>({
    location: "",
    city: "",
    countryCode: "",
  });
  const [point, setPoint] = useState<{ latitude: number; longitude: number }>();
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationText, setLocationText] = useState(""),
    [searchQuery, setSearchQuery] = useState("");
  const [mapProvider, setMapProvider] = useState("");
  const [results, setResults] = useState<Place[]>([]),
    [searching, setSearching] = useState(false),
    [locationHint, setLocationHint] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString());
  const [eventName, setEventName] = useState(""),
    [eventId, setEventId] = useState<string>();
  const [lead, setLead] = useState(false),
    [busy, setBusy] = useState(false),
    [locating, setLocating] = useState(false),
    [error, setError] = useState("");
  const [editedMessage, setEditedMessage] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<{
    message: string;
    phone: string;
    queued: boolean;
  } | null>(null);
  const clientId = useRef(randomId()),
    revision = useRef(0),
    eventTouched = useRef(false);
  const nearby = nearbyEvents(data.events || [], occurredAt, point);
  useEffect(() => {
    void locate();
    return () => {
      revision.current++;
    };
  }, []);
  useEffect(() => {
    if (!eventTouched.current && nearby.length) {
      setEventName(nearby[0].event.name);
      setEventId(nearby[0].event.id);
    } else if (!eventTouched.current) {
      setEventName("");
      setEventId(undefined);
    }
  }, [nearby.map((e) => e.event.id).join(",")]);
  useEffect(() => {
    let active = true;
    if (searchQuery.trim().length < 3 || offline) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      const focus = point
        ? `&latitude=${point.latitude}&longitude=${point.longitude}`
        : "";
      void get(`/locations?q=${encodeURIComponent(searchQuery.trim())}${focus}`)
        .then((r) => {
          if (!active) return;
          setResults(r.places || []);
          setMapProvider(r.provider || "photon");
          setLocationHint(
            r.places?.length
              ? "Choose the place you met."
              : "No matches. You can keep the place you typed.",
          );
        })
        .catch(() => {
          if (active)
            setLocationHint(
              "Search is unavailable. You can keep the place you typed.",
            );
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 550);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, offline]);
  function choosePlace(value: Place) {
    revision.current++;
    setLocating(false);
    setPlace(value);
    setLocationText(
      value.label ||
        [value.location, value.city, value.countryCode]
          .filter(Boolean)
          .join(", "),
    );
    setPoint(
      value.latitude != null && value.longitude != null
        ? { latitude: value.latitude, longitude: value.longitude }
        : undefined,
    );
    setAccuracy(null);
    setSearchQuery("");
    setResults([]);
    setLocationHint("Map location selected.");
    eventTouched.current = false;
  }
  async function locate() {
    const current = ++revision.current;
    setLocating(true);
    setLocationHint("Finding where you are…");
    try {
      const permission = await within(
        Location.requestForegroundPermissionsAsync(),
        20000,
      );
      if (!permission.granted)
        throw new Error(
          "Location permission is off. Enable it in browser or phone settings, or search for your meeting place.",
        );
      const position = await within(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        15000,
      );
      if (current !== revision.current) return;
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setPoint(coordinates);
      setAccuracy(position.coords.accuracy);
      eventTouched.current = false;
      setPlace({ location: "", city: "", countryCode: "" });
      setLocationText("");
      setSearchQuery("");
      setLocationHint("GPS captured. Finding the address…");
      try {
        const r = await get(
          `/locations?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}`,
        );
        if (current !== revision.current) return;
        if (r.places?.[0]) {
          const address = r.places[0];
          setPlace({
            location: address.location,
            city: address.city,
            countryCode: address.countryCode,
          });
          setLocationText(address.label);
          setMapProvider(r.provider || "photon");
          setLocationHint(
            `GPS captured · address from ${r.provider === "google" ? "Google Maps" : "OpenStreetMap"}`,
          );
        } else setLocationHint("GPS captured. Add a place name if you like.");
      } catch {
        if (current === revision.current)
          setLocationHint(
            "GPS captured. Address lookup needs a connection; your coordinates will still be saved.",
          );
      }
    } catch (e) {
      if (current === revision.current)
        setLocationHint(
          e instanceof Error ? e.message : "Search for where you met below.",
        );
    } finally {
      if (current === revision.current) setLocating(false);
    }
  }
  const publicUrl = card
    ? shareUrl(card.publicUrl || `${getServer()}/c/${card.slug}`)
    : "";
  const discussion = [topic === "Something else" ? "" : topic, note.trim()]
    .filter(Boolean)
    .join(" — ");
  const generated = introductionMessage({
    recipient: name,
    sender: card?.title || "",
    business: card?.subtitle || card?.company || "",
    note: discussion,
    place:
      [eventName, place.location, place.city].filter(Boolean).join(", ") ||
      (point
        ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
        : ""),
    url: publicUrl,
  });
  const message = editedMessage ?? generated;
  const disabledReason = shareDisabledReason(name, phone, message);
  async function openWhatsApp(value: { message: string; phone: string }) {
    await Linking.openURL(
      `https://wa.me/${value.phone.replace(/\D/g, "")}?text=${encodeURIComponent(value.message)}`,
    );
  }
  async function prepare() {
    if (!card || busy || disabledReason) return;
    setBusy(true);
    setError("");
    try {
      const result = await exchange({
        clientId: clientId.current,
        cardId: card.id,
        name: name.trim(),
        phone: normalisePhone(phone),
        note: discussion,
        location: place.location,
        city: place.city,
        countryCode: place.countryCode,
        ...point,
        occurredAt,
        eventName,
        eventId,
        potentialLead: lead,
      });
      // Keep every user edit. Only swap the existing card URL for its personal invitation URL.
      const value = {
        phone: normalisePhone(phone),
        message: result.url ? message.replace(publicUrl, result.url) : message,
        queued: result.queued,
      };
      setPrepared(value);
      await openWhatsApp(value);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not open WhatsApp. Copy the message instead.",
      );
    } finally {
      setBusy(false);
    }
  }
  function next() {
    setName("");
    setNationalPhone("");
    setNote("");
    setTopic("");
    setLead(false);
    setPrepared(null);
    setError("");
    setEditedMessage(null);
    setOccurredAt(new Date().toISOString());
    clientId.current = randomId();
    void locate();
  }
  if (!card)
    return (
      <Page>
        <Title>Start with your card.</Title>
        <Body muted style={{ marginVertical: 22 }}>
          Create and publish your card before sharing it with someone you meet.
        </Body>
        <Button onPress={onCreate}>Create my card</Button>
      </Page>
    );
  return (
    <Page>
      <Label>A HELLO WORTH REMEMBERING</Label>
      <Title style={{ marginTop: 10, marginBottom: 22 }}>
        Share your card.
      </Title>
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <Avatar name={card.title} url={card.imageUrl} size={52} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.ink, fontSize: 17, fontWeight: "700" }}>
            {card.title}
          </Text>
          <Body muted>{card.company}</Body>
        </View>
      </View>
      {cards.length > 1 && (
        <ScrollView
          horizontal
          contentContainerStyle={{ gap: 8, marginBottom: 16 }}
        >
          {cards.map((c) => (
            <Pill
              key={c.id}
              active={c.id === card.id}
              onPress={() => {
                if (!prepared) {
                  setCardId(c.id);
                  setEditedMessage(null);
                }
              }}
            >
              {c.company || c.title}
            </Pill>
          ))}
        </ScrollView>
      )}
      {prepared ? (
        <>
          <Title size={25}>Your message is ready.</Title>
          <Body muted style={{ marginVertical: 14 }}>
            {prepared.queued
              ? "Meeting saved on this phone. It will sync when you reconnect."
              : "The meeting is saved."}{" "}
            Tap Send in WhatsApp to deliver your card.
          </Body>
          <View style={[s.card, { marginBottom: 18 }]}>
            <Body>{prepared.message}</Body>
          </View>
          <Button
            icon="logo-whatsapp"
            onPress={() =>
              void openWhatsApp(prepared).catch(() =>
                setError("WhatsApp could not open. Copy the message below."),
              )
            }
          >
            Open WhatsApp
          </Button>
          <Button
            tone="quiet"
            onPress={() =>
              void Clipboard.setStringAsync(prepared.message).then(() =>
                notify("Message copied."),
              )
            }
          >
            Copy message
          </Button>
          <Button tone="secondary" onPress={next}>
            Meet someone else
          </Button>
        </>
      ) : (
        <>
          <Field
            label="Who did you meet?"
            value={name}
            onChangeText={setName}
            placeholder="Their name"
            autoComplete="name"
          />
          <PhoneField
            country={phoneCountry}
            onCountry={setPhoneCountry}
            number={nationalPhone}
            onNumber={setNationalPhone}
          />
          <Label>WHAT DID YOU DISCUSS?</Label>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose discussion topic"
            accessibilityState={{ expanded: topicsOpen }}
            onPress={() => setTopicsOpen(!topicsOpen)}
            style={[
              s.card,
              s.row,
              { marginTop: 10, marginBottom: 12, padding: 16 },
            ]}
          >
            <Body>{topic || "Choose a topic · optional"}</Body>
            <Icon name={topicsOpen ? "chevron-up" : "chevron-down"} size={18} />
          </Pressable>
          {topicsOpen && (
            <View style={[s.card, { padding: 8, marginBottom: 14 }]}>
              {["", ...topics].map((t) => (
                <Pressable
                  key={t}
                  accessibilityRole="button"
                  onPress={() => {
                    setTopic(t);
                    setTopicsOpen(false);
                  }}
                  style={{ padding: 13 }}
                >
                  <Body>{t || "No topic"}</Body>
                </Pressable>
              ))}
            </View>
          )}
          <Field
            label="Add a detail · optional"
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Send the packaging catalogue"
          />
          <Pill
            active={lead}
            onPress={() => setLead(!lead)}
            icon={lead ? "checkbox" : "square-outline"}
          >
            Potential lead
          </Pill>
          <View style={{ marginTop: 26 }}>
            <DateTimeField value={occurredAt} onChange={setOccurredAt} />
          </View>
          <View style={s.row}>
            <Label>WHERE YOU MET</Label>
            <Button
              small
              tone="quiet"
              icon="locate-outline"
              busy={locating}
              onPress={() => void locate()}
            >
              Use GPS
            </Button>
          </View>
          <Field
            label="Meeting place"
            multiline
            style={{ minHeight: 76 }}
            value={locationText}
            onChangeText={(v) => {
              revision.current++;
              setLocating(false);
              setPoint(undefined);
              setAccuracy(null);
              setLocationText(v);
              setSearchQuery(v);
              setPlace({ location: v, city: "", countryCode: "" });
              setResults([]);
              setLocationHint(
                offline
                  ? "Offline · typed place will be saved."
                  : "Type at least 3 letters to search.",
              );
              eventTouched.current = false;
            }}
            placeholder="Search a building, café, venue or street"
          />
          {!!locationHint && (
            <Text style={[s.hint, { marginBottom: 8 }]}>{locationHint}</Text>
          )}
          {point && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <Icon name="location-outline" size={15} />
              <Text style={{ color: C.teal, fontSize: 12 }}>
                {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                {accuracy != null
                  ? ` · accuracy ±${Math.round(accuracy)} m`
                  : ""}
              </Text>
            </View>
          )}
          {searching && <Text style={s.hint}>Finding places…</Text>}
          {results.map((r, i) => (
            <Pressable
              key={`${r.latitude}:${r.longitude}:${i}`}
              accessibilityRole="button"
              onPress={() => choosePlace(r)}
              style={{ padding: 14, borderBottomWidth: 1, borderColor: C.line }}
            >
              <Body>{r.location}</Body>
              <Body muted>
                {[r.city, r.countryCode].filter(Boolean).join(", ")}
              </Body>
            </Pressable>
          ))}
          {!!mapProvider && (
            <Text
              onPress={() =>
                void Linking.openURL(
                  mapProvider === "google"
                    ? "https://maps.google.com"
                    : "https://www.openstreetmap.org/copyright",
                )
              }
              style={{
                fontSize: 12,
                fontWeight: "400",
                color: "#5E5E5E",
                marginBottom: 22,
              }}
            >
              {mapProvider === "google"
                ? "Google Maps"
                : "© OpenStreetMap contributors · Photon"}
            </Text>
          )}
          <Field
            label="Event · optional"
            value={eventName}
            onChangeText={(v) => {
              eventTouched.current = true;
              setEventName(v);
              setEventId(undefined);
            }}
            placeholder="Add a conference or gathering"
          />
          {!!eventName && (
            <Button
              small
              tone="quiet"
              onPress={() => {
                eventTouched.current = true;
                setEventName("");
                setEventId(undefined);
              }}
            >
              Remove event
            </Button>
          )}
          {!eventTouched.current && !!eventName && (
            <Text style={s.hint}>
              Nearby event from your DUIT events · check before sharing
            </Text>
          )}
          {nearby
            .filter((e) => e.event.id !== eventId)
            .map(({ event }) => (
              <Pill
                key={event.id}
                onPress={() => {
                  eventTouched.current = true;
                  setEventName(event.name);
                  setEventId(event.id);
                }}
              >
                {event.name}
              </Pill>
            ))}
          <View style={{ marginTop: 22 }}>
            <Field
              label="Your WhatsApp message · editable"
              style={{ minHeight: 200 }}
              value={message}
              onChangeText={setEditedMessage}
              multiline
            />
          </View>
          {editedMessage !== null && (
            <Button small tone="quiet" onPress={() => setEditedMessage(null)}>
              Use suggested message
            </Button>
          )}
          {offline && (
            <Text style={[s.hint, { marginBottom: 12 }]}>
              Offline · your meeting will be saved here, then synced. WhatsApp
              needs a connection to deliver.
            </Text>
          )}
          {!!disabledReason && (
            <Text
              accessibilityLiveRegion="polite"
              style={[s.hint, { marginBottom: 12 }]}
            >
              {disabledReason}
            </Text>
          )}
          <Button
            busy={busy}
            disabled={Boolean(disabledReason)}
            icon="logo-whatsapp"
            onPress={() => void prepare()}
          >
            Share on WhatsApp
          </Button>
        </>
      )}
      {!!error && <Notice error>{error}</Notice>}
    </Page>
  );
}
