/**
 * Expo web Dashboard — self-contained.
 * Do not import Settings / Avatar / dbManager: those pull @react-native-firebase/firestore
 * and crash the web bundle after auth restore navigates here.
 */
import { useContext, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { CenteredTitle } from "../components/Text";
import { PageWrapper } from "../components/Wrapper";
import { CurrentUserContext, DarkContext } from "../Context";
import { darkTheme, lightTheme, buttonStyles, globalColors } from "../assets/styles";
import { googleAuth } from "../api/auth";

function WebButton({ text, onClick, color }) {
  const { dark } = useContext(DarkContext);
  const border =
    color === "red"
      ? globalColors.red
      : dark
        ? darkTheme.buttonBorder
        : lightTheme.buttonBorder;
  const label =
    color === "red"
      ? globalColors.red
      : dark
        ? darkTheme.textPrimary
        : lightTheme.textPrimary;

  return (
    <View
      style={{
        width: buttonStyles.buttonWidth,
        height: buttonStyles.buttonHeight,
        marginTop: 10,
        borderRadius: 10,
        backgroundColor: dark ? darkTheme.buttonFill : lightTheme.buttonFill,
      }}
    >
      <Pressable
        onPress={onClick}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: 10,
          borderWidth: buttonStyles.buttonBorderWidth,
          borderColor: border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: label, fontSize: 20 }}>{text}</Text>
      </Pressable>
    </View>
  );
}

export default function Dashboard({ navigation }) {
  const { currentUserManager, setCurrentUserManager } = useContext(CurrentUserContext);
  const { dark, setDark } = useContext(DarkContext);
  const [showSettings, setShowSettings] = useState(false);

  const pd = currentUserManager?.data?.personalData || {};
  const textColor = dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  const secondary = dark ? darkTheme.textSecondary : lightTheme.textSecondary;

  async function handleLogout() {
    try {
      await googleAuth.signOut();
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
    setCurrentUserManager(null);
    navigation.reset({ index: 0, routes: [{ name: "login" }] });
  }

  if (showSettings) {
    return (
      <PageWrapper justifyContent="center">
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 40,
          }}
        >
          <Image
            source={
              pd.pfpUrl
                ? { uri: pd.pfpUrl }
                : require("../assets/images/LogoShadow.png")
            }
            style={{ width: 160, height: 160, borderRadius: 80, marginBottom: 16 }}
          />
          <CenteredTitle text={pd.displayName || "Citrus"} fontSize={24} />
          <CenteredTitle
            text={`Email: ${pd.email || "?"}`}
            alignment="left"
            fontSize={14}
          />
          <View style={{ marginTop: 12 }}>
            <WebButton
              text={dark ? "Light mode" : "Dark mode"}
              onClick={() => setDark(!dark)}
            />
            <WebButton text="Back" onClick={() => setShowSettings(false)} />
            <WebButton text="Logout" color="red" onClick={handleLogout} />
          </View>
        </View>
      </PageWrapper>
    );
  }

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
        <View style={{ marginTop: 28, alignItems: "center" }}>
          <WebButton text="Settings / Sign out" onClick={() => setShowSettings(true)} />
        </View>
      </View>
    </PageWrapper>
  );
}
