/**
 * Expo web Dashboard — no Firestore listeners (@react-native-firebase has no onSnapshot on web).
 * Shows Firebase Google session + settings/sign-out. Full ledger UI stays on native / citrus.joed.dev.
 */
import { useContext } from "react";
import { Image, Text, View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";

import Settings from "./Settings";
import { CenteredTitle } from "../components/Text";
import { StyledButton } from "../components/Button";
import { PageWrapper } from "../components/Wrapper";
import { CurrentUserContext, DarkContext } from "../Context";
import { darkTheme, lightTheme } from "../assets/styles";

const Stack = createStackNavigator();

function WebHome({ navigation }) {
  const { currentUserManager } = useContext(CurrentUserContext);
  const { dark } = useContext(DarkContext);
  const pd = currentUserManager?.data?.personalData || {};
  const textColor = dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  const secondary = dark ? darkTheme.textSecondary : lightTheme.textSecondary;

  return (
    <PageWrapper>
      <View
        style={{
          flex: 1,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Image
          source={
            pd.pfpUrl
              ? { uri: pd.pfpUrl }
              : require("../assets/images/LogoShadow.png")
          }
          style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 16 }}
        />
        <CenteredTitle text={pd.displayName || "Citrus"} fontSize={28} />
        <Text style={{ color: secondary, marginTop: 8, textAlign: "center" }}>
          {pd.email || ""}
        </Text>
        <Text
          style={{
            color: textColor,
            marginTop: 24,
            textAlign: "center",
            opacity: 0.85,
            maxWidth: 420,
          }}
        >
          Signed in with Google (Firebase). The full native ledger still uses
          Firestore listeners, which are not available in this web export yet —
          use citrus.joed.dev for the full web app.
        </Text>
        <View style={{ marginTop: 28, width: "100%", maxWidth: 320 }}>
          <StyledButton
            text="Settings / Sign out"
            onClick={() => navigation.navigate("settings")}
          />
        </View>
      </View>
    </PageWrapper>
  );
}

export default function Dashboard() {
  return (
    <View style={{ height: "100%" }}>
      <Stack.Navigator
        initialRouteName="main"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="main" component={WebHome} />
        <Stack.Screen name="settings" component={Settings} />
      </Stack.Navigator>
    </View>
  );
}
