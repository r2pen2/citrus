/**
 * Expo web login — Firebase Google popup + real Firestore user managers
 * (same citrusnative project / listeners as native and packages/web).
 */
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";

import { GoogleButton } from "../components/Button";
import { CenteredTitle } from "../components/Text";
import { PageWrapper } from "../components/Wrapper";
import { CurrentUserContext } from "../Context";
import { signInWithGoogle, waitForAuthUser } from "../api/auth";
import { DBManager } from "../api/dbManager";

async function bootstrapUserManager(user) {
  // Attach Auth ID token before first Firestore call (avoids permission-denied race).
  await user.getIdToken();

  const userManager = DBManager.getUserManager(user.uid);
  const userAlreadyExists = await userManager.documentExists();
  if (userAlreadyExists) {
    await userManager.fetchData();
  } else {
    userManager.setCreatedAt(new Date());
    userManager.setDisplayName(user.displayName);
    userManager.setEmail(user.email);
    userManager.setPfpUrl(user.photoURL || `https://robohash.org/${user.uid}`);
    await userManager.push();
  }
  return userManager;
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
          const userManager = await bootstrapUserManager(user);
          if (cancelled) return;
          setCurrentUserManager(userManager);
          navigation.reset({ index: 0, routes: [{ name: "dashboard" }] });
          return;
        }
      } catch (err) {
        console.error("Auth restore failed:", err);
        if (!cancelled) {
          setError(err?.message || "Failed to restore session");
        }
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
      const userManager = await bootstrapUserManager(user);
      setCurrentUserManager(userManager);
      navigation.reset({ index: 0, routes: [{ name: "dashboard" }] });
    } catch (err) {
      console.error("Google sign-in failed:", err);
      if (
        err?.code !== "auth/popup-closed-by-user" &&
        err?.code !== "auth/cancelled-popup-request"
      ) {
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
          <Text
            style={{
              color: "#c62828",
              marginTop: 12,
              paddingHorizontal: 24,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        ) : null}
        {!showSpinner && <GoogleButton onClick={handleGoogleClick} />}
        {showSpinner && <ActivityIndicator size="large" />}
      </View>
    </PageWrapper>
  );
}
