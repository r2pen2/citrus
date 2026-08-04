// Library Imports
import { useContext, } from "react";
import { View, } from "react-native";

// Component Imports
import { AvatarIcon, } from "../components/Avatar";
import { DarkModeButton, EditButton, StyledButton, } from "../components/Button";
import { CenteredTitle, } from "../components/Text";
import { PageWrapper, } from "../components/Wrapper";

// Context Imports
import { 
  CurrentUserContext, 
  GroupsContext, 
  ListenedGroupsContext, 
  ListenedTransactionsContext, 
  ListenedUsersContext, 
  TransactionsContext, 
  UnsubscribeCurrentUserContext, 
  UsersContext,
} from "../Context";

// API Imports
import { googleAuth, } from "../api/auth";

/**
 * Component for showing current user data and settings. Has an option to sign-out which whipes the 
 * app's local data.
 * @param {ReactNavigation} navigation navigation object from main app shell
 */
export default function Settings({navigation}) {

  // Get contexts (super annoying because we really just need the setters lol)
  const { currentUserManager, setCurrentUserManager } = useContext(CurrentUserContext);
  const { usersData, setUsersData } = useContext(UsersContext);
  const { listenedUsers, setListenedUsers } = useContext(ListenedUsersContext);
  const { listenedGroups, setListenedGroups } = useContext(ListenedGroupsContext);
  const { groupsData, setGroupsData } = useContext(GroupsContext);
  const { transactionsData, setTransactionsData } = useContext(TransactionsContext);
  const { listenedTransactions, setListenedTransactions } = useContext(ListenedTransactionsContext);
  const { unsubscribeCurrentUser } = useContext(UnsubscribeCurrentUserContext);

  /**
   * Sign out the current user and wipe all context
   * @async
   */
  async function handleLogout() {
    await googleAuth.signOut();   // Sign out user from Google Authenticaion session
    setUsersData({});             // Wipe users data
    setListenedUsers([]);         // Wipe listened users array
    setGroupsData({});            // Wipe groups data
    setListenedGroups([]);        // Wipe listened groups array
    setTransactionsData({});      // Wipe transaction data
    setListenedTransactions([]);  // Wipe listened transcations array
    unsubscribeCurrentUser();     // Unsubscribe the current user manager from updates! (jesus christ this took me forever to figure out)
    setCurrentUserManager(null);  // Set the current user manager to null so that we can login again
  }

  // Render the settings page so long as there is a currentUserManager
  return currentUserManager && (
    <PageWrapper justifyContent="center">
      <View 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center"
        style={{
          width: "100%", 
          height: "80%", 
          elevation: 2,
          paddingBottom: 50,
          paddingTop: 10,
        }}
      >
        <AvatarIcon src={currentUserManager.data.personalData.pfpUrl} size={200} />
        <View 
          display="flex" 
          flexDirection="row" 
          justifyContent="space-between" 
          alignItems="center" 
          style={{
            width: "50%",
            margin: 20
          }}
        >
          <EditButton />
          <DarkModeButton />
        </View>
        <CenteredTitle text={currentUserManager.data.personalData.displayName} />
        <CenteredTitle text={"Email: " + (currentUserManager.data.personalData.email ? currentUserManager.data.personalData.email : "?")} alignment="left" />
        <CenteredTitle text={"Phone: " + (currentUserManager.data.personalData.phoneNumber ? currentUserManager.data.personalData.phoneNumber : "?")} alignment="left" />
        <StyledButton text="Logout" color="red" onClick={handleLogout}/>
      </View>
    </PageWrapper>
  );
}
