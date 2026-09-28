import React, { useState } from "react";
import { View, Platform } from "react-native";
import * as Updates from "expo-updates";
import { Body, Button, Label, Notice } from "./ui";

export function AppUpdates() {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  if (Platform.OS === "web" || !Updates.isEnabled) return null;
  async function check() {
    setBusy(true);
    setMessage("");
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        const downloaded = await Updates.fetchUpdateAsync();
        setReady(downloaded.isNew);
        setMessage(
          downloaded.isNew
            ? "Update ready. Restart when you’ve finished your current work."
            : "You’re up to date.",
        );
      } else setMessage("You’re up to date.");
    } catch {
      setMessage("Couldn’t check for updates. Try again when you’re online.");
    } finally {
      setBusy(false);
    }
  }
  async function restart() {
    try {
      await Updates.reloadAsync();
    } catch {
      setMessage("Close and reopen DUIT to apply the downloaded update.");
    }
  }
  return (
    <View style={{ gap: 10, marginTop: 24 }}>
      <Label>App updates · OTA enabled</Label>
      <Body muted>
        UI updates download on launch and apply next time you open DUIT.
      </Body>
      <Body muted>
        {Updates.channel} · {Updates.runtimeVersion}
        {Updates.updateId ? ` · ${Updates.updateId.slice(0, 8)}` : ""}
      </Body>
      <Button
        tone="secondary"
        busy={busy}
        onPress={() => void (ready ? restart() : check())}
      >
        {ready ? "Restart to update" : "Check for updates"}
      </Button>
      {!!message && <Notice>{message}</Notice>}
    </View>
  );
}
