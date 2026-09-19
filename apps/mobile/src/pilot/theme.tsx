import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeId = "duit" | "instagram";

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  description: string;
  colors: typeof C;
  radius: { card: number; control: number; sheet: number };
};

const duitColors = {
  bg: "#F7F8F2",
  ink: "#142E2B",
  teal: "#163D35",
  lime: "#D5F477",
  muted: "#7F8981",
  line: "#E1E6DC",
  white: "#FFFFFF",
  soft: "#EDF1E8",
  red: "#A34232",
  orange: "#B47B3F",
  blue: "#E8EFED",
};

// This stable object keeps the existing C.* API working while a selected
// palette is applied at runtime. New themes only need another definition.
export const C = { ...duitColors };
export const R = { card: 22, control: 16, sheet: 24 };

export const themes: readonly ThemeDefinition[] = [
  {
    id: "duit",
    name: "DUIT Original",
    description: "Warm paper, deep green and lime accents.",
    colors: duitColors,
    radius: { card: 22, control: 16, sheet: 24 },
  },
  {
    id: "instagram",
    name: "Instagram-inspired",
    description:
      "Instagram-inspired white canvas, crisp type and blue actions.",
    colors: {
      bg: "#FAFAFA",
      ink: "#262626",
      teal: "#0095F6",
      lime: "#FFFFFF",
      muted: "#737373",
      line: "#DBDBDB",
      white: "#FFFFFF",
      soft: "#EFEFEF",
      red: "#ED4956",
      orange: "#F77737",
      blue: "#EAF5FD",
    },
    radius: { card: 12, control: 10, sheet: 18 },
  },
] as const;

const STORAGE_KEY = "duit:appearance:theme:v1";
const listeners = new Set<() => void>();
const DEFAULT_THEME: ThemeId = "instagram";

function definition(id: ThemeId) {
  return themes.find((theme) => theme.id === id) ?? themes[0];
}

function apply(id: ThemeId) {
  const selected = definition(id);
  Object.assign(C, selected.colors);
  Object.assign(R, selected.radius);
  listeners.forEach((listener) => listener());
  return selected;
}

export function onThemeApplied(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type ThemeContextValue = {
  ready: boolean;
  theme: ThemeDefinition;
  setTheme: (id: ThemeId) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).catch(() => null).then((saved) => {
      if (!active) return;
      const id = themes.some((theme) => theme.id === saved)
        ? (saved as ThemeId)
        : DEFAULT_THEME;
      apply(id);
      setThemeId(id);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  async function setTheme(id: ThemeId) {
    apply(id);
    setThemeId(id);
    await AsyncStorage.setItem(STORAGE_KEY, id);
  }

  const value = useMemo(
    () => ({ ready, theme: definition(themeId), setTheme }),
    [ready, themeId],
  );
  if (!ready) return null;
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("ThemeProvider is required");
  return value;
}

export const themeStorageKey = STORAGE_KEY;
