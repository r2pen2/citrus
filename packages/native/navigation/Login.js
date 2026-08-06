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
import { googleAuth } from "../api/auth";

/**
 * Component for handing user sign in. User is automatically taken to dashboard if they're already signed in.
 * Native mobile: Google Sign-In + Firebase Auth (Firestore uid continuity).
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
    const signedIn = await googleAuth.isSignedIn();
    setShowSpinner(false);
    if (signedIn) {
      handleGoogleClick();
    }
  }
  
  async function handleGoogleClick() {
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
