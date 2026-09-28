import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js/min";
import { countryNames } from "../../../../packages/meeting-search/countries.js";
import { phoneDigits } from "./phoneFormat";
import { C, Label, Icon, Sheet } from "./ui";

const names: Record<string, string> = {
  ...countryNames,
  AC: "Ascension Island",
  TA: "Tristan da Cunha",
  XK: "Kosovo",
};
const countries = getCountries()
  .map((code) => ({
    code,
    name: names[code] || code,
    dial: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));
export function PhoneField({
  country,
  onCountry,
  number,
  onNumber,
}: {
  country: CountryCode;
  onCountry: (c: CountryCode) => void;
  number: string;
  onNumber: (v: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const rows = useMemo(
    () =>
      countries.filter((c) =>
        `${c.name} ${c.code} +${c.dial}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [query],
  );
  return (
    <View style={{ marginBottom: 20 }}>
      <Label>THEIR WHATSAPP NUMBER</Label>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose country code"
          onPress={() => setOpen(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 7,
            paddingHorizontal: 13,
            borderWidth: 1,
            borderColor: C.line,
            borderRadius: 13,
            backgroundColor: C.white,
          }}
        >
          <Text style={{ fontSize: 16, color: C.ink }}>
            +{getCountryCallingCode(country)}
          </Text>
          <Icon name="chevron-down" size={14} />
        </Pressable>
        <TextInput
          accessibilityLabel="WhatsApp phone number"
          value={number}
          onChangeText={(v) => onNumber(phoneDigits(v))}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={15}
          placeholder="Phone number"
          placeholderTextColor={C.muted}
          style={{
            flex: 1,
            minHeight: 54,
            fontSize: 17,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 13,
            borderWidth: 1,
            borderColor: C.line,
            color: C.ink,
            backgroundColor: C.white,
          }}
        />
      </View>
      <Sheet visible={open} title="Country code" onClose={() => setOpen(false)}>
        <TextInput
          accessibilityLabel="Search country or calling code"
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCorrect={false}
          placeholder="Type a country or code, e.g. +91"
          placeholderTextColor={C.muted}
          style={{
            padding: 14,
            fontSize: 16,
            backgroundColor: C.soft,
            borderRadius: 12,
            color: C.ink,
            marginBottom: 12,
          }}
        />
        {rows.map((c) => (
          <Pressable
            key={c.code}
            accessibilityRole="button"
            accessibilityLabel={`${c.name} +${c.dial}`}
            onPress={() => {
              onCountry(c.code);
              setOpen(false);
              setQuery("");
            }}
            style={{
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderBottomWidth: 1,
              borderColor: C.line,
            }}
          >
            <Text style={{ color: C.ink, flex: 1, fontSize: 16 }}>
              {c.name}
            </Text>
            <Text style={{ color: C.muted, fontSize: 16 }}>+{c.dial}</Text>
            {c.code === country && <Icon name="checkmark" size={18} />}
          </Pressable>
        ))}
      </Sheet>
    </View>
  );
}
