import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MeetingsScreen } from "../screens/MeetingsScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ShareScreen } from "../screens/ShareScreen";
import { colors } from "../theme/colors";
import { navigationTheme } from "../theme/navigationTheme";
import type { RootTabParamList } from "../types/social";

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcons: Record<
  keyof RootTabParamList,
  { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }
> = {
  Home: { focused: "home", unfocused: "home-outline" },
  Meetings: { focused: "people", unfocused: "people-outline" },
  Share: { focused: "paper-plane", unfocused: "paper-plane-outline" },
  Profile: { focused: "person", unfocused: "person-outline" },
};

export function MainNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 18);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: [
            styles.tabBar,
            {
              height: 54 + bottomInset,
              paddingBottom: bottomInset,
            },
          ],
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, size, focused }) => {
            const iconName = focused ? tabIcons[route.name].focused : tabIcons[route.name].unfocused;
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Meetings" component={MeetingsScreen} />
        <Tab.Screen name="Share" component={ShareScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
