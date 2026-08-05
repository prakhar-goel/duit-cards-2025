import { DefaultTheme } from "@react-navigation/native";
import { colors } from "./colors";

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    primary: colors.linkedInBlue,
    border: colors.border,
  },
};
