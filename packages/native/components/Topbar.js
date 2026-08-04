// Library Imports
import { useContext } from 'react';
import { Image, Linking, Pressable, View, } from 'react-native';

// Context Imports
import { DarkContext, CurrentUserContext } from "../Context";

// Component Imports
import { AvatarIcon, } from './Avatar';
import { StyledText, } from './Text';

// Style Imports
import { globalColors, } from '../assets/styles';

/**
 * URL for general feedback Google Form
 * @const
 */
const generalFeedbackURL = "https://forms.gle/G7cRjRoEksHjxsp17";

/**
 * URL for feature request Google Form
 * @const
 */
const featureRequestURL = "https://forms.gle/8ShwZBJHMiPv3cyn8";

/**
 * Component for displaying the topbar with buttons to visit settings page and to open the notification tray
 * @param {ReactNavigation} nav navigation from main screen 
 * @param {Function} onNotificationClick function to be called when notification icon is clicked 
 */
export default function Topbar({nav, onNotificationClick}) {

  // Get contexts
  const { dark } = useContext(DarkContext);
  const { currentUserManager } = useContext(CurrentUserContext);

  /**
   * Component for displaying a little red dot on top of the notification button
   * if there are unread notifications on the current user
   */
  function NotificationDot() {
    return (
      <View
        style={{
          backgroundColor: globalColors.red,
          borderRadius: 100,
          right: 2,
          top: 0,
          width: 10,
          height: 10,
          position: 'absolute',
        }} 
      />
    );
  }

  /**
   * Find out whether or not the current user has any unread notifications
   * @returns bool whether or not user has notifs
   */
  function hasUnreadNotifications() {
    for (const notificationType of Object.keys(currentUserManager.data.notifications)) {
      for (const notif of Object.values(notificationType)) {
        if (!notif.seen) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Open the bug report Google Form
   * @async
   */
  async function onBugReportClick() {
    // Make sure we can open this link
    const supported = await Linking.canOpenURL(generalFeedbackURL);
    if (!supported) { return; } // Link unsupported somehow

    await Linking.openURL(generalFeedbackURL);
  }
  
  // As long as there is a currentUserManager, return the topbar
  return currentUserManager && (
    <View display="flex" flexDirection="row" justifyContent="space-between" alignItems="center" style={{paddingTop: 10, paddingLeft: 20, paddingRight: 20}}>
      <Pressable onPress={() => nav.navigate("settings")} display="flex" flexDirection="row" alignItems="center">
        <AvatarIcon src={currentUserManager.data.personalData.pfpUrl} onClick={() => nav.navigate("settings")} />
        <StyledText text={currentUserManager.data.personalData.displayName} alignItems="flex-start" marginLeft={10}/>
      </Pressable>
      <View display="flex" flexDirection="row" justifyContent="center">
        <Pressable onPress={onBugReportClick} marginRight={10}>
          <Image source={dark ? require('../assets/images/BugReportDark.png') : require('../assets/images/BugReportLight.png')} style={{width: 32, height: 32}} />
        </Pressable>
        <Pressable onPress={onNotificationClick}>
          <Image source={dark ? require('../assets/images/NotificationIcon.png') : require('../assets/images/NotificationIconLight.png')} style={{width: 32, height: 32}} />
          { hasUnreadNotifications() && <NotificationDot /> }
        </Pressable>
      </View>
    </View>
  )
}

