// Library Imports
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useState } from 'react'
import { Image, Pressable, View } from 'react-native';

// API Imports
import { DBManager } from '../api/dbManager';

// Context Imports
import { UsersContext, CurrentUserContext, FocusContext, TransactionsContext } from '../Context';

// Style Imports
import { globalColors } from '../assets/styles';
import { RelationHistoryLabel, TransactionLabel } from './Text';

/**
 * Component for displaying a user's profile picture consistent with the app's styling
 * @see {@link AvatarList} to render several avatars in a line
 * @param {string} id id of the user to render pfp for
 * @param {Function} onClick function to be called when avatar is tapped
 * @param {number} size height and width of profile picture
 * @param {number} borderWidth width of gradient border on icon
 * @param {number} marginLeft left side margin
 * @param {number} marginRight right side margin
 * @default
 * onClick = null;
 * size = 50;
 * borderWidth = size / 20;
 * marginLeft = 0;
 * marginRight = 0;
 */
export function AvatarIcon(props) {
    
    // Get all necessary context
    const { usersData, setUsersData } = useContext(UsersContext);
    const { focus } = useContext(FocusContext);
    const { currentUserManager } = useContext(CurrentUserContext);

    // Create a state for the user's profile picture
    const [ imgSrc, setImgSrc ] = useState(props.src ? {uri: props.src} : null);
    
    // Fetch the user's pfpUrl whenever the usersData, focus, or props change
    // Lol apparently I can't just do useEffect(fetchSource, []) because then it tries to return the promise and just breaks everything
    useEffect(() => { fetchSource(); }, [usersData, focus, props]);

    /**
     * Retrieve user's profile picture url from usersData or, if that isn't available,
     * create a UserManager and query the database. Save any information fetched from the 
     * database into the usersData Context.
     * @async
     */
    async function fetchSource() {
        // Guard clauses:
        if (!props.id) { return; } // No user id?? That's fucked. Don't even try.

        if (props.id === currentUserManager.documentId) {
            // If the userId belongs to the currentUser, get the pfpUrl from currentUserManager
            setImgSrc({uri: currentUserManager.data.personalData.pfpUrl});
        } else if (usersData[props.id]) {
            // If we have data for this user in context, just pull that and don't bother the database
            setImgSrc({uri: usersData[props.id].personalData.pfpUrl});
        } else {
            // This is a user that we haven't seen yet. Query the databse for their profile picture
            const userManager = DBManager.getUserManager(props.id);
            await userManager.fetchData();
            setImgSrc({uri: userManager.data.personalData.pfpUrl});

            // Then update usersData so we don't have to ask the database next time
            const newData = {...usersData};
            newData[props.id] = userManager.data;
            setUsersData(newData);
        }
    }

    /**
     * Component for rendering the profile picture inside of the avatar's frame
     */
    function AvatarImage() {
        // Guard caluses:
        if (!imgSrc) { return; }    // We have no source! Don't bother.

        // Return the image
        return (
            <Image 
              source={imgSrc} 
              style={{
                width: props.size ? (props.size - (props.borderWidth ? props.borderWidth / 2 : (props.size / 20))) : 45, 
                height: props.size ? (props.size - (props.borderWidth ? props.borderWidth / 2 : (props.size / 20))) : 45,
                borderRadius: props.size ? (props.size / 2) : 25
              }}
            />
        )
    }

    // Return the Avatar Image
    return (
        <Pressable
          onPress={props.onClick}
          pointerEvents="none" // Do not block parent component's onClick
          android_ripple={{color: globalColors.greenAlpha, radius: 10}}
        >
            <LinearGradient // The "border" on an avatarIcon is actually just a LinearGradient with padding equal to the borderWidth
              start={[0, 0]}
              end={[1, 1]}
              colors={globalColors.selectedGradient}
              pointerEvents="none" // Do not block Pressable's onClick
              style={{
                borderRadius: props.size ? props.size / 2 : 25,
                width: props.size ? props.size : 50,
                height: props.size ? props.size : 50,
                marginRight: props.marginRight ? props.marginRight : 0,
                marginLeft: props.marginLeft ? props.marginLeft : 0,
                }}
            >
                <View 
                  style={{
                    width: props.size ? props.size : 50, 
                    height: props.size ? props.size : 50,
                  }} 
                  display="flex" 
                  flexDirection="column" 
                  justifyContent="center" 
                  alignItems="center"
                  pointerEvents="none"
                >
                    <AvatarImage />
                </View>
            </LinearGradient>
        </Pressable>
    )
}

/**
 * Component for rendering a line of avatars and allowing them to overlap.
 * Avatars are organized alphabetically be userId (lol)
 * @param {List<string>} users IDs of every user to display in list 
 * @param {number} size height and width of avatars 
 * @param {number} marginLeft left overlap 
 * @param {number} marginRight right overlap 
 * @param {number} marginTop top margin
 * @param {number} marginBottom bottom margin
 * @param {string} justifyContent align on flex-start, center, flex-end, space-between, etc.
 * @param {Function} onClick function to call when avatars are clicked
 * @default
 * onClick = null;
 * size = 30;
 * marginLeft = 0;
 * marginRight = 0;
 * marginTop = 0;
 * marginBottom = 0;
 * justifyContent = "center";
 */
export function AvatarList(props) {

  // Get Context
  const { currentUserManager } = useContext(CurrentUserContext);

  // Sort IDs and move currentUser to the front
  const currentUserIncluded = currentUserManager ? props.users.includes(currentUserManager.documentId) : false;
  let sortedIds = props.users.sort((a, b) => { return a > b; });
  if (currentUserIncluded) {
    // If the current user is included, remove them and then put them at index 0
    sortedIds = sortedIds.filter(id => id !== currentUserManager.documentId);
    sortedIds.unshift(currentUserManager.documentId);
  }

  /**
   * Render a styled AvatarIcon component for each sortedUser
   */
  function renderAvatars() {
    return sortedIds.map((userId, index) => {
      return <AvatarIcon id={userId} key={index} size={props.size ? props.size: 30} marginRight={props.marginRight ? props.marginRight : 0} marginLeft={props.marginLeft ? props.marginLeft : 0} onClick={props.onClick}/>
    });
  }

  // Render the list
  return (
    <View 
      pointerEvents="none" 
      display="flex" 
      flexDirection="row" 
      alignItems="center" 
      justifyContent={props.justifyContent ? props.justifyContent : "center"} 
      style={{
        marginTop: props.marginTop ? props.marginTop : 0,
        marginBottom: props.marginBottom ? props.marginBottom : 0,
        marginLeft: props.marginLeft ? (props.marginLeft * -1) : 0,     // Offset any marginLeft by shifting view right
        marginRight: props.marginRight ? (props.marginRight * -1) : 0,  // Offset any marginRight by shifting view left
      }}
    >
      { renderAvatars() }
    </View>
  )
}

/**
 * Render an {@link AvatarList}, but specifically for a relation in group
 * @param {string} transcation ID of group relation's transaction
 * @param {Function} onClick function to call when avatars are clicked
 * @default
 * onClick = null;
 */
export function GroupRelationAvatars(props) {

  // Get Context
  const { transactionsData } = useContext(TransactionsContext);

  // Set up a state to hold data for all users in this transaction
  const [transactionUsers, setTransactionUsers] = useState([]);
  
  // Fetch list of users whenever transcationData changes
  useEffect(getUsers, [transactionsData])

  /**
   * Update {@link transactionUsers} state to the list of users in the given transaction
   */
  function getUsers() {
    // Guard clauses:
    if (!transactionsData[props.transaction]) { return; } // We don't have data on this transaction! How did we get here???
    
    // Users is just the ID of everyone from the balances field
    setTransactionUsers(Object.keys(transactionsData[props.transaction].balances));
  }

  // Render the list
  return <AvatarList users={transactionUsers} onClick={props.onClick} justifyContent="flex-end" marginRight={-5} />
}

/**
 * Render an {@link AvatarList}, but specifically for a relation in group
 * @param {string} transcation ID of group relation's transaction
 * @param {Function} onClick function to call when avatars are clicked
 * @default
 * onClick = null;
 */
export function GroupRelationAmounts(props) {

  // Get Context
  const { transactionsData } = useContext(TransactionsContext);
  const { currentUserManager } = useContext(CurrentUserContext);

  /**
   * Update {@link transactionUsers} state to the list of users in the given transaction
   */
  function renderAmounts() {
    // Guard clauses:
    if (!transactionsData[props.transaction]) { return; } // We don't have data on this transaction! How did we get here???
    
    // Map users
    return Object.keys(transactionsData[props.transaction].balances).map((userId, index) => {

      let transactionHistory = null;

      // Guard clauses:
      if (userId === currentUserManager.documentId)   { return; } // This is the current user
      if (!currentUserManager.data.relations[userId]) { return; } // No relation with this user
      if (!hasRelationWithThisTransaction())          { return; } // We have a relation with this user, but not for this transaction

      /**
       * Decide if the current user has a relatinHistory for this transaction with this user
       * @returns bool whether or not user has a history with this transaction in relation
       */
      function hasRelationWithThisTransaction() {
        for (const history of currentUserManager.data.relations[userId].history) {
          if (history.transaction === props.transaction) {
            transactionHistory = history;
            return true;
          }
        }
        return false;
      }

      // Render the row
      return (
        <View key={index} display="flex" flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom={5}>
          <TransactionLabel 
            transaction={transactionsData[props.transaction]} 
            amtOverride={transactionHistory.amount}
            current={true}
            fontSize={16}
          />
          <AvatarIcon id={userId} size={30} marginLeft={10} />
        </View>
      )
    })
  }

  // Render
  return (
    <View display="flex" flexDirections="column" alignItems="center" justifyContent="center">
      { renderAmounts() }
    </View>
  )
}