/**
 * Expo web export login — joed.dev SSO only (no Firebase / GoogleSignin native modules).
 */
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";

import { GoogleButton } from "../components/Button";
import { CenteredTitle } from "../components/Text";
import { PageWrapper } from "../components/Wrapper";
import { CurrentUserContext } from "../Context";
import { isWebSso, signInWithJoedSso } from "../api/auth";

function makeWebUserManager(user) {
  const pd = user.personalData || {};
  const uid = user.id;
  return {
    documentId: uid,
    data: {
      personalData: {
        displayName: pd.displayName || uid,
        email: pd.email || uid,
        phoneNumber: pd.phoneNumber || null,
        pfpUrl: pd.pfpUrl || `https://robohash.org/${uid}`,
      },
      relations: {},
      friends: [],
      groups: [],
      incomingFriendRequests: [],
      outgoingFriendRequests: [],
      mutedUsers: [],
      mutedGroups: [],
      transactions: [],
      notifications: [],
    },
    async push() {},
    async fetchData() {},
    async documentExists() {
      return true;
    },
  };
}

export default function Login({ navigation }) {
  const { setCurrentUserManager } = useContext(CurrentUserContext);
  const [showSpinner, setShowSpinner] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await completeSso(cancelled);
      } catch (err) {
        if (!cancelled) {
          console.error("SSO auto sign-in failed:", err);
          setError(err?.message || "Sign-in failed");
          setShowSpinner(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function completeSso(cancelled = false) {
    setShowSpinner(true);
    setError(null);
    const body = await signInWithJoedSso();
    if (cancelled) return;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("citrus:accessToken", body.accessToken);
    }
    setCurrentUserManager(makeWebUserManager(body.user));
    navigation.navigate("dashboard");
  }

  async function handleGoogleClick() {
    try {
      await completeSso();
    } catch (err) {
      console.error("SSO sign-in failed:", err);
      setError(err?.message || "Sign-in failed");
      setShowSpinner(false);
    }
  }

  return (
    <PageWrapper>
      <View
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={require("../assets/images/LogoShadow.png")}
          style={{ width: 250, height: 250, marginLeft: 20 }}
        />
        <CenteredTitle text="Citrus" fontSize={30} />
        {error ? (
          <Text style={{ color: "#c62828", marginTop: 12, paddingHorizontal: 24, textAlign: "center" }}>
            {error}
          </Text>
        ) : null}
        {!showSpinner && <GoogleButton onClick={handleGoogleClick} />}
        {showSpinner && <ActivityIndicator size="large" />}
        {isWebSso() ? (
          <Text style={{ marginTop: 12, opacity: 0.7 }}>Uses your joed.dev Google SSO session</Text>
        ) : null}
      </View>
    </PageWrapper>
  );
}
