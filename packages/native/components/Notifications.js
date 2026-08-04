// Library Imports
import { useContext, } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, View, } from "react-native"
import { GestureHandlerRootView, } from "react-native-gesture-handler";

// Context Imports
import { CurrentUserContext, DarkContext, GroupsContext, UsersContext, } from "../Context";

// Component Imports
import { GradientCard, } from "./Card";
import { CenteredTitle, NotificationAmountLabel, StyledText, } from "./Text";
import { StyledModalContent, } from "./Wrapper";

// API Imports
import { DBManager, UserRelation, } from "../api/dbManager";
import { notificationTypes, } from "../api/enum";
import { NotificationFactory, } from "../api/notification";

// Style Imports
import { globalColors, } from "../assets/styles";

/**
 * Compoonent for rending a modal with the current user's notifications overtop the entire application
 * @param {boolean} open whether or not to display the notification modal
 * @param {Function} setOpen function to set value of {@link open} 
 */
export function NotificationModal({open, setOpen}) {

  // Get Context
  const { currentUserManager } = useContext(CurrentUserContext);
  const { groupsData, setGroupsData } = useContext(GroupsContext);
  const { dark } = useContext(DarkContext);
  
  /**
   * A cute little component that's just a little red dotto be displayed on the topbar notification icon
   */
  function UnreadDot() {
    return (
      <View
        style={{
          backgroundColor: globalColors.red,
          borderRadius: 100,
          width: 10,
          height: 10,
          elevation: 5,
          marginRight: 20,
        }}
      />
    ) 
  }

  /**
   * Render components for each notification on the current user
   * @param {boolean} showSeen whether or not to show notifications that have already been read
   */
  function renderNotifications(showSeen) {
    // Guard clauses:
    if (!currentUserManager) { return; } // No current user!

    // Render note if there are no notifications
    let notificationCount = 0;
    for (const notificationType of Object.keys(currentUserManager.data.notifications)) {
      notificationCount += Object.keys(notificationType).length;
    }
    if (notificationCount === 0) {
      return <CenteredTitle text="Nothing to see here!" />;
    }

    // Else, map notifications to GradientCards!
    return currentUserManager.data.notifications.map((notification, index) => {
      // Guard clauses:
      if (!showSeen && notification.seen) { return; } // We're only showing unseen notifications. This one has been seen. Don't render. 

      /** 
       * size of the notification's image
       * @const  
       **/
      const imgSize = 30;

      /**
       * Get the image or amount label to display on the right of a notification card` 
       * @returns image path or anmount label
       */
      function getRightContent() {
        switch (notification.type) {
          case notificationTypes.INCOMINGFRIENDREQUEST:
            return <Image source={require("../assets/images/notifications/FriendRequest.png")} style={{height: imgSize, width: imgSize}} />;
          case notificationTypes.FRIENDREQUESTACCEPTED:
            return <Image source={require("../assets/images/notifications/FriendAccepted.png")} style={{height: imgSize, width: imgSize}} />;
          case notificationTypes.INCOMINGGROUPINVITE:
            return <Image source={require("../assets/images/notifications/GroupInvite.png")} style={{height: imgSize, width: imgSize}} />;
          case notificationTypes.USERJOINEDGROUP:
            return <Image source={require("../assets/images/notifications/FriendAccepted.png")} style={{height: imgSize, width: imgSize}} />;
          case notificationTypes.USERLEFTGROUP:
            return <Image source={require("../assets/images/notifications/FriendAccepted.png")} style={{height: imgSize, width: imgSize}} />;
          case notificationTypes.NEWTRANSACTION:
          case notificationTypes.TRANSACTIONDELETED:
            return <NotificationAmountLabel notification={notification} />;
          default:
            return;
        }
      }

      /**
       * Accept an incoming friend request on DB
       * @async
       */
      async function acceptIncomingFriendRequest() {
        const incomingFriendRequestSenderManager = DBManager.getUserManager(notification.target);
        const incomingFriendRequestSenderNotif = NotificationFactory.createFriendRequestAccepted(currentUserManager.data.personalData.displayName, currentUserManager.documentId);
        currentUserManager.addFriend(notification.target);
        currentUserManager.removeIncomingFriendRequest(notification.target);
        currentUserManager.updateRelation(notification.target, new UserRelation());
        currentUserManager.removeNotification(notification);
        incomingFriendRequestSenderManager.addNotification(incomingFriendRequestSenderNotif);
        incomingFriendRequestSenderManager.addFriend(currentUserManager.documentId);
        incomingFriendRequestSenderManager.removeOutgoingFriendRequest(currentUserManager.documentId);
        incomingFriendRequestSenderManager.updateRelation(currentUserManager.documentId, new UserRelation());
        incomingFriendRequestSenderManager.push();
        currentUserManager.push();
      }

      /**
       * Accept an incoming group inivte on DB
       * @async
       */
      async function acceptIncomingGroupInvite() {
        const incomingGroupInviteSenderManager = DBManager.getUserManager(notification.value);
        const invitedGroupManager = DBManager.getGroupManager(notification.target);
        const groupName = await invitedGroupManager.getName();
        const incomingGroupInviteSenderNotif = NotificationFactory.createUserJoinedGroup(currentUserManager.data.personalData.displayName, groupName, notification.target);
        incomingGroupInviteSenderManager.addNotification(incomingGroupInviteSenderNotif);
        incomingGroupInviteSenderManager.push();
        invitedGroupManager.removeInvitedUser(currentUserManager.documentId);
        invitedGroupManager.addUser(currentUserManager.documentId);
        await invitedGroupManager.push();
        currentUserManager.removeGroupInvitation(notification.target);
        currentUserManager.addGroup(notification.target);
        currentUserManager.removeNotification(notification);
        currentUserManager.push();
        const incomingGroupInviteUpdate = {...groupsData};
        incomingGroupInviteUpdate[notification.target] = invitedGroupManager.data;
        setGroupsData(incomingGroupInviteUpdate);
      }

      /**
       * Handle any actions necessary when a notification is clicked. (Adding friends, adding groups, etc.)
       * @async
       */
      async function handleClick() {
        switch (notification.type) {
          case notificationTypes.INCOMINGFRIENDREQUEST:
            Alert.alert(notification.message, "Accept friend request?", [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Add Friend',
                onPress: () => acceptIncomingFriendRequest(),
                style: 'default',
              },
            ],)
            break;
          case notificationTypes.FRIENDREQUESTACCEPTED:
          case notificationTypes.INCOMINGGROUPINVITE:
            Alert.alert(notification.message, "Accept group invitation?", [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Add Group',
                onPress: () => acceptIncomingGroupInvite(),
                style: 'default',
              },
            ],)
            break;
          case notificationTypes.USERJOINEDGROUP:
          case notificationTypes.USERLEFTGROUP:
          case notificationTypes.NEWTRANSACTION:
          case notificationTypes.TRANSACTIONDELETED:
          default:
            break;
        }
      }

      /**
       * Delete the notification on this card
       */
      function deleteNotification() {
        currentUserManager.removeNotification(notification);
        currentUserManager.push();
      }
      
      /**
       * A component for rendering the delete hint under a notification
       * @const
       */
      const deleteSwipeIndicator = (
        <View display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start" style={{width: "100%", paddingLeft: 20 }}>
          <Image source={dark ? require("../assets/images/TrashDark.png") : require("../assets/images/TrashLight.png")} style={{width: 20, height: 20}}/>
          <StyledText text="Delete Notification" marginLeft={10} />
        </View>
      )

      // Render the notification on a Gradient card with left swipe for deletion
      return (
        <GestureHandlerRootView key={index} display="flex" flexDirection="row" alignItems="center" style={{flex: 1}}>
          { !notification.seen && <UnreadDot/> /* Render notification dot if this is a new notification */ }
          <GradientCard key={index} gradient={notification.color} onClick={handleClick} leftSwipeComponent={deleteSwipeIndicator} onLeftSwipe={deleteNotification}>
            <View style={{flex: 6}} >
              <StyledText text={notification.message} onClick={handleClick} fontSize={14}/>
            </View>
            <View style={{flex: 4}} display="flex" flexDirection="row" justifyContent="flex-end" alignItems="center">
              { getRightContent() }
            </View>
          </GradientCard>
        </GestureHandlerRootView>
      )
    });
  }

  /**
   * Set all notification on the currentUserManager to read and push changes
   */
  function setNotificationsRead() {
    let newNotifs = {...currentUserManager.data.notifications};
    for (const notificationType of Object.keys(newNotifs)) {
      for (const notifTarget of Object.keys(notificationType)) {
        newNotifs[notificationType][notifTarget].seen = true;
      }
    }
    currentUserManager.setNotifications(newNotifs);
    currentUserManager.push();
  }

  /**
   * Display an alert that allows the user to delete all of their notifications.
   */
  function clearNotifications() {

    /**
     * Delete all notifications on "confirm" click
     */
    function confirmClear() {
      currentUserManager.setNotifications({});
      currentUserManager.push();
    }

    // Display alert
    Alert.alert("Clear Notifications?", "Are you sure you want to clear all of your notifications?", 
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Clear Notifications',
        onPress: () => confirmClear(),
        style: 'destructive',
      },
    ],)
  }

  // Render notifications modal
  return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={open}
        onRequestClose={() => {
          setOpen(!open);
          setNotificationsRead();
        }}
      >
        <StyledModalContent>
          <CenteredTitle text="Notifications" fontSize={20} />
          <ScrollView style={{width: '100%', paddingHorizontal: 20, marginTop: 10}}>
            { renderNotifications(true) }
          </ScrollView>
          <Pressable style={{position: 'absolute', top: 30, left: 30, padding: 5}} onPress={clearNotifications}>
            <Image source={dark ? require("../assets/images/TrashDark.png") : require("../assets/images/TrashLight.png")} style={{width: 20, height: 20}}/>
          </Pressable>
        </StyledModalContent>
      </Modal>
    )
}