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
 * @param {ReactNavigation} navigation navigation object from main app shell
 */
export default function Login({navigation}) {

  // Get contexts
  const { currentUserManager, setCurrentUserManager } = useContext(CurrentUserContext);
  const [ showSpinner, setShowSpinner ] = useState(true);   // Whether or not we're showing the little spinner icon (mutually exclusive with Google button)
  
  // Check if the user already has an active authentication session on component mount
  useEffect(() => { checkSignIn(); }, [])

  // When the currentUserManager changes, show the spinner if we're logged in
  useEffect(flashSpinner, [currentUserManager]);

  /**
   * Show the ActivityIndicator for 500ms if there is a currentUserManager
   */
  function flashSpinner() {
    setShowSpinner(!currentUserManager);
    setTimeout(() => { 
      setShowSpinner(false); 
    }, 500);
  }

  /**
   * Query Google Authentication Client to decide if the user is signed in or not.
   * If they are signed in, take them to the dashboard.
   * @async
   */
  async function checkSignIn() {
    const signedIn = await googleAuth.isSignedIn();
    setShowSpinner(false);
    if (signedIn) {
      handleGoogleClick();
    }
  }
  
  /**
   * Contact Google Authentication Client to sign in the user.
   * If the user has an account, fetch their document and set the CurrentUserContext.
   * If the user doesn't have an account, create their document and set CurrentUserContext.
   * Redirect the user to dashboard after sign-in success.
   * @async
   */
  async function handleGoogleClick() {
      // Check if your device supports Google Play (I'm not actually using this)
      let hasPlay = await googleAuth.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Get the users GoogleAuth ID token
      const { idToken } = await googleAuth.signIn();
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      auth().signInWithCredential(googleCredential).then(async (userCredentail) => {
        // Show the spinner while we fetch the user's data
        setShowSpinner(true);
        // Get a userManager for this user. Authentication Usercredentials have their ID stored in the user object.
        const userManager = DBManager.getUserManager(userCredentail.user.uid);
        // Check if we've seen this user before
        const userAlreadyExists = await userManager.documentExists();
        if (userAlreadyExists) {
          // We know this person! Get their data, set context, and go to dashboard.
          await userManager.fetchData();
          setCurrentUserManager(userManager);
          navigation.navigate("dashboard");
        } else {
          // This is a new person! Create their document, push it to the databse, and bring them to the dashboard.
          userManager.setCreatedAt(new Date());
          userManager.setDisplayName(userCredentail.user.displayName);
          userManager.setEmail(userCredentail.user.email);
          userManager.setPfpUrl(userCredentail.user.photoURL);
          await userManager.push(); // We might not actually have to await this but I don't feel like fucking with it
          setCurrentUserManager(userManager);
          navigation.navigate("dashboard");
        }
      });
    }

    // Render the Login Page
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
