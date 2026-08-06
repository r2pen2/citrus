/**
 * Expo web export login — Firebase Google popup (citrus-v3), same uids as packages/web.
 */
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";

import { GoogleButton } from "../components/Button";
import { CenteredTitle } from "../components/Text";
import { PageWrapper } from "../components/Wrapper";
import { CurrentUserContext } from "../Context";
import { signInWithGoogle, waitForAuthUser } from "../api/auth";

function makeWebUserManager(user) {
  const uid = user.uid;
  return {
    documentId: uid,
    data: {
      personalData: {
        displayName: user.displayName || uid,
        email: user.email || uid,
        phoneNumber: user.phoneNumber || null,
        pfpUrl: user.photoURL || `https://robohash.org/${uid}`,
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
        const user = await waitForAuthUser();
        if (cancelled) return;
        if (user) {
          setCurrentUserManager(makeWebUserManager(user));
          navigation.navigate("dashboard");
          return;
        }
      } catch (err) {
        console.error("Auth restore failed:", err);
      }
      if (!cancelled) {
        setShowSpinner(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGoogleClick() {
    setShowSpinner(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      setCurrentUserManager(makeWebUserManager(user));
      navigation.navigate("dashboard");
    } catch (err) {
      console.error("Google sign-in failed:", err);
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        setError(err?.message || "Sign-in failed");
      }
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
        <Text style={{ marginTop: 12, opacity: 0.7 }}>Sign in with Google (Firebase)</Text>
      </View>
    </PageWrapper>
  );
}
