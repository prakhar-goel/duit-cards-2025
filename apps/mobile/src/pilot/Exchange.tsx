import React, { useEffect, useRef, useState } from "react";
import { View, Text, Linking, ScrollView } from "react-native";
import * as Location from "expo-location";
import * as Clipboard from "expo-clipboard";
import { usePilot } from "./store";
import { get, post, shareUrl, getServer } from "./api";
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
} from "./ui";
import { DateTimeField } from "./DateTimeField";
import { suggestEvents, type EventSuggestion } from "./meetingContext";
import { introductionMessage, normalisePhone } from "./exchangeMessage";

export function ExchangeScreen({ onCreate }: { onCreate: () => void }) {
  const { data, refresh, notify } = usePilot();
  const cards = data.cards.filter((c) => c.isPublished);
  const [cardId, setCardId] = useState(cards[0]?.id || "");
  const card = cards.find((c) => c.id === cardId) || cards[0];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91");
  const [note, setNote] = useState("");
  const [place, setPlace] = useState({
    location: "",
    city: "",
    countryCode: "",
  });
  const [point, setPoint] = useState<{ latitude: number; longitude: number }>();
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString());
  const [eventName, setEventName] = useState("");
  const [events, setEvents] = useState<EventSuggestion[]>([]);
  const [lead, setLead] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [prepared, setPrepared] = useState<{
    url: string;
    message: string;
    phone: string;
  } | null>(null);
  const clientId = useRef(randomId());
  const revision = useRef(0);
  useEffect(() => {
    void get("/events")
      .then((r) => setEvents(r.events || []))
      .catch(() => {});
    void Location.getForegroundPermissionsAsync().then((p) => {
      if (p.granted) void locate(false);
    });
    return () => {
      revision.current++;
    };
  }, []);
  async function locate(request = true) {
    const current = ++revision.current;
    setLocating(true);
    try {
      const permission = request
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (!permission.granted)
        throw new Error("You can enter where you met below.");
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (revision.current !== current) return;
      setPoint({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const [address] = await Location.reverseGeocodeAsync(position.coords);
      if (revision.current !== current) return;
      if (address)
        setPlace({
          location: [
            ...new Set([address.name, address.street].filter(Boolean)),
          ].join(", "),
          city: address.city || address.subregion || "",
          countryCode: address.isoCountryCode || "",
        });
    } catch (e) {
      if (revision.current === current)
        setError(
          e instanceof Error ? e.message : "Enter your meeting place below.",
        );
    } finally {
      if (revision.current === current) setLocating(false);
    }
  }
  const message = introductionMessage({
    recipient: name,
    sender: card?.title || "",
    business: card?.subtitle || card?.company || "",
    note,
    place: [eventName, place.location, place.city].filter(Boolean).join(", "),
    url: card
      ? shareUrl(card.publicUrl || `${getServer()}/c/${card.slug}`)
      : "",
  });
  async function openWhatsApp(value: { message: string; phone: string }) {
    await Linking.openURL(
      `https://wa.me/${value.phone.replace(/\D/g, "")}?text=${encodeURIComponent(value.message)}`,
    );
  }
  async function prepare() {
    if (!card || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await post("/exchanges", {
        clientId: clientId.current,
        cardId: card.id,
        name: name.trim(),
        phone: normalisePhone(phone),
        note,
        ...place,
        ...point,
        occurredAt,
        eventName,
        potentialLead: lead,
      });
      const value = {
        url: res.url,
        phone: normalisePhone(phone),
        message: introductionMessage({
          recipient: name,
          sender: card.title,
          business: card.subtitle || card.company || "",
          note,
          place: [eventName, place.location, place.city]
            .filter(Boolean)
            .join(", "),
          url: res.url,
        }),
      };
      setPrepared(value);
      void refresh();
      await openWhatsApp(value);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not open WhatsApp. You can copy the message instead.",
      );
    } finally {
      setBusy(false);
    }
  }
  function next() {
    setName("");
    setPhone("+91");
    setNote("");
    setLead(false);
    setPrepared(null);
    setError("");
    setOccurredAt(new Date().toISOString());
    clientId.current = randomId();
  }
  if (!card)
    return (
      <Page>
        <Title>Start with your card.</Title>
        <Body muted style={{ marginVertical: 22 }}>
          Create your introduction, then share it with the next person you meet.
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
                if (!prepared) setCardId(c.id);
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
            The meeting is saved. Tap Send in WhatsApp to deliver your card.
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
          <Field
            label="Their WhatsApp number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Include country code"
          />
          <Field
            label="What did you discuss?"
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="A few words will do"
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
            label="Building / street / place"
            value={place.location}
            onChangeText={(v) => {
              revision.current++;
              setLocating(false);
              setPoint(undefined);
              setPlace((p) => ({ ...p, location: v }));
            }}
            placeholder="Café, office or venue"
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Field
              style={{ flex: 2 }}
              label="City"
              value={place.city}
              onChangeText={(city) => {
                revision.current++;
                setPoint(undefined);
                setPlace((p) => ({ ...p, city }));
              }}
            />
            <Field
              style={{ flex: 1 }}
              label="Country"
              value={place.countryCode}
              onChangeText={(countryCode) => {
                revision.current++;
                setPoint(undefined);
                setPlace((p) => ({
                  ...p,
                  countryCode: countryCode.toUpperCase(),
                }));
              }}
              placeholder="IN"
            />
          </View>
          <Field
            label="Event · optional"
            value={eventName}
            onChangeText={setEventName}
            placeholder="The conference or gathering"
          />
          {suggestEvents(events, occurredAt, point)
            .filter((e) => e.current || (e.nearby != null && e.nearby < 25))
            .map(({ event }) => (
              <Pill
                key={event.id}
                active={eventName === event.name}
                onPress={() => {
                  revision.current++;
                  setLocating(false);
                  setEventName(event.name);
                  setPlace({
                    location: event.venue || "",
                    city: event.city || "",
                    countryCode: event.countryCode || "",
                  });
                  setPoint(
                    event.latitude != null && event.longitude != null
                      ? { latitude: event.latitude, longitude: event.longitude }
                      : undefined,
                  );
                }}
              >
                {event.name}
              </Pill>
            ))}
          <View style={{ marginTop: 22 }}>
            <Label>MESSAGE PREVIEW</Label>
          </View>
          <View style={[s.card, { marginTop: 12, marginBottom: 20 }]}>
            <Body>{message}</Body>
          </View>
          <Button
            busy={busy}
            disabled={
              name.trim().length < 2 ||
              !/^\+[1-9]\d{7,14}$/.test(normalisePhone(phone))
            }
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
