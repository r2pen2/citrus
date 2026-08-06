// Library Imports
import { useContext, useEffect, useState, } from "react";
import { ActivityIndicator, Image, View, } from "react-native";
import auth from "@react-native-firebase/auth";

// Component Imports
import { GoogleButton, } from "../components/Button";
import { CenteredTitle } from "../components/Text";
import { PageWrapper } from "../components/Wrapper";

// Context Imports
import { CurrentUserContext } from "../Context";

// API Imports
import { DBManager } from "../api/dbManager";
import { googleAuth, isWebSso, signInWithJoedSso } from "../api/auth";

/**
 * Component for handing user sign in. User is automatically taken to dashboard if they're already signed in.
 * Web export uses joed.dev Traefik SSO → POST /auth/sso.
 * Native mobile keeps Google Sign-In + Firebase (legacy).
 * @param {ReactNavigation} navigation navigation object from main app shell
 */
export default function Login({navigation}) {

  // Get contexts
  const { currentUserManager, setCurrentUserManager } = useContext(CurrentUserContext);
  const [ showSpinner, setShowSpinner ] = useState(true);
  
  useEffect(() => { checkSignIn(); }, [])

  useEffect(flashSpinner, [currentUserManager]);

  function flashSpinner() {
    setShowSpinner(!currentUserManager);
    setTimeout(() => { 
      setShowSpinner(false); 
    }, 500);
  }

  async function checkSignIn() {
    if (isWebSso()) {
      setShowSpinner(true);
      try {
        await handleWebSso();
      } catch (error) {
        console.error("SSO auto sign-in failed:", error);
        setShowSpinner(false);
      }
      return;
    }

    const signedIn = await googleAuth.isSignedIn();
    setShowSpinner(false);
    if (signedIn) {
      handleGoogleClick();
    }
  }

  /**
   * joed.dev SSO (web export): exchange proxy identity for Citrus user session.
   */
  async function handleWebSso() {
    setShowSpinner(true);
    const body = await signInWithJoedSso();
    const user = body.user;
    const pd = user.personalData || {};
    const uid = user.id;

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("citrus:accessToken", body.accessToken);
    }

    const userManager = DBManager.getUserManager(uid);
    const userAlreadyExists = await userManager.documentExists();
    if (userAlreadyExists) {
      await userManager.fetchData();
      setCurrentUserManager(userManager);
      navigation.navigate("dashboard");
      return;
    }

    userManager.setCreatedAt(new Date());
    userManager.setDisplayName(pd.displayName || uid);
    userManager.setEmail(pd.email || uid);
    userManager.setPfpUrl(pd.pfpUrl || `https://robohash.org/${uid}`);
    await userManager.push();
    setCurrentUserManager(userManager);
    navigation.navigate("dashboard");
  }
  
  async function handleGoogleClick() {
    if (isWebSso()) {
      try {
        await handleWebSso();
      } catch (error) {
        console.error("SSO sign-in failed:", error);
        setShowSpinner(false);
      }
      return;
    }

      let hasPlay = await googleAuth.hasPlayServices({ showPlayServicesUpdateDialog: true });
      void hasPlay;
      const { idToken } = await googleAuth.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      auth().signInWithCredential(googleCredential).then(async (userCredentail) => {
        setShowSpinner(true);
        const userManager = DBManager.getUserManager(userCredentail.user.uid);
        const userAlreadyExists = await userManager.documentExists();
        if (userAlreadyExists) {
          await userManager.fetchData();
          setCurrentUserManager(userManager);
          navigation.navigate("dashboard");
        } else {
          userManager.setCreatedAt(new Date());
          userManager.setDisplayName(userCredentail.user.displayName);
          userManager.setEmail(userCredentail.user.email);
          userManager.setPfpUrl(userCredentail.user.photoURL);
          await userManager.push();
          setCurrentUserManager(userManager);
          navigation.navigate("dashboard");
        }
      });
    }

    return (
    <PageWrapper>
      <View 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center"
        style={{
          width: "100%", 
          height: "100%",
        }}
      >
        <Image 
          source={require("../assets/images/LogoShadow.png")}
          style={{
            width: 250,
            height: 250,
            marginLeft: 20,
          }}
        />
        <CenteredTitle text="Citrus" fontSize={30} />
        { !showSpinner && <GoogleButton onClick={handleGoogleClick} />}
        { showSpinner && <ActivityIndicator size={"large"}/> }
      </View>
    </PageWrapper>
  );
}
