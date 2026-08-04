// Library Imports
import { useContext, useEffect, useState, } from "react";
import { Alert, Image, View, } from "react-native";

// Context Imports
import { CurrentUserContext, DarkContext, FocusContext, TransactionsContext, UsersContext, } from "../Context";

// Component Imports
import { AvatarIcon, } from "../components/Avatar";
import { DeletePill, GroupPill, } from "../components/Button";
import { GradientCard, } from "../components/Card";
import { CenteredTitle, TransactionLabel, } from "../components/Text";
import { CardWrapper, ScrollPage, TrayWrapper, } from "../components/Wrapper";


// API Imports
import { DBManager, UserRelation, } from "../api/dbManager";
import { getDateString, } from "../api/strings";

// Style Imports
import { darkTheme, lightTheme, } from "../assets/styles";

/**
 * A component for displaying detailed information on a transaction
 * @param {ReactNavigation} navigation navigation object from mainTabs 
 */
export default function TransactionDetail({navigation}) {

  // Get context
  const { focus, setFocus } = useContext(FocusContext);
  const { transactionsData } = useContext(TransactionsContext);
  const { dark } = useContext(DarkContext);
  const { currentUserManager } = useContext(CurrentUserContext);

  // Store a state for the current transaction
  const [ currentTranscationData, setCurrentTransactionData ] = useState(null);

  // When the transactionData changes, update the currentTransactionData state
  useEffect(getCurrentTransactionData, [transactionsData]);

  /**
   * Get data on the focused transaction and update the {@link currentTransactionData} state
   */
  function getCurrentTransactionData() {
    // Guard clauses:
    if (!transactionsData[focus.transaction]) { return; } // We don't have data on this transaction

    setCurrentTransactionData(transactionsData[focus.transaction]);
  }

  /** Size of small avatars on transaction detail page */
  const avatarSize = 40;
  /** Overlap for small avatars on transcation detail page */
  const avatarMargin = -5;

  /**
   * Render AvatarIcons for each user that paid in this transaction
   */
  function renderPaidBy() {
    // Guard clauses:
    if (!currentUserManager)      { return; } // No current user manager!
    if (!currentTranscationData)  { return; } // We don't have any data on this transction (yet)

    // Map users to AvatarIcons
    return Object.keys(currentTranscationData.balances).map((userId, index) => {
      // Guard clauses:
      if (currentTranscationData.balances[userId] < 0) { return; } // This user didn't pay in this transaction

      /**
       * Redirect to a user's detail page when they're clicked
       */
      function goToUser() {
        // Guard clauses:
        if (userId === currentUserManager.documentId) { return; } // Current user is tapped, which is a funky case. Maybe go to settings???
        // Update focus
        const newFocus = {...focus};
        focus.user = userId;
        setFocus(newFocus);
        // And navigate to user's page
        navigation.navigate("People", {screen: "detail"});
      }

      // Render AvatarIcon
      return <AvatarIcon key={index} id={userId} size={avatarSize} marginLeft={avatarMargin} marginRight={avatarMargin} onClick={goToUser}/>;
    })
  }

  /**
   * Render AvatarIcons for everyone who is in debt because of this transcation
   */
  function renderInDebt() {
    // Guard clauses:
    if (!currentUserManager)      { return; } // There's no current user!
    if (!currentTranscationData)  { return; } // There's not transcation data (yet)

    // Map users to AvatarIcons
    return Object.keys(currentTranscationData.balances).map((userId, index) => {
      // Guard clauses:
      if (currentTranscationData.balances[userId] > 0) { return; } // This user isn't in debt

      /**
       * Redirect to user's detail page on click
       */
      function goToUser() {
        // Guard clauses:
        if (userId === currentUserManager.documentId) { return; } // Current user was tapped
        // Update focus
        const newFocus = {...focus};
        focus.user = userId;
        setFocus(newFocus);
        // And navigate
        navigation.navigate("People", {screen: "detail"});
      }

      // Render AvatarIcon
      return <AvatarIcon key={index} id={userId} size={avatarSize} marginLeft={avatarMargin} marginRight={avatarMargin} onClick={goToUser}/>;
    })
  }

  /**
   * Look through transaction balances and figure out who paid who and how much
   * @returns List of relations
   */
  function getRelations() {
    let relations = [];
    // Get total amount paid (wtf joe isn't this just the currenTransactionData.amount???)
    // Why did I write it like this what the hell
    // I'm too tired to figure it out
    // todo: ok what happened here (3/4/23)
    let totalPaid = 0;
    for (const amt of Object.values(currentTranscationData.balances)) {
      if (amt > 0) {
        totalPaid += amt;
      }
    }

    // Loop through all users and create relations
    for (const fromId of Object.keys(currentTranscationData.balances)) {
      const fromBal = currentTranscationData.balances[fromId];
      if (fromBal < 0) {
        // This user owes money
        for (const toId of Object.keys(currentTranscationData.balances)) {
          const toBal = currentTranscationData.balances[toId];
          if (toBal > 0) {
            // This user is owed money
            const multiplier = toBal / totalPaid;
            // This is how much
            relations.push({
              to: toId,
              from: fromId,
              amount: fromBal * multiplier,
            });
          }
        }
      }
    }

    return relations;
  }

  /**
   * Render all relations between users from this transaction who aren't current user
   */
  function renderRelations() {
    // First, we have to figure out how much everyone paid each other in this transcation
    let relations = getRelations();

    // Create Cards for each Relation
    return relations.map((relation, index) => {
      // Guard clauses:
      if (relation.to === currentUserManager.documentId)    { return; } // This is current user. Don't show without colors
      if (relation.from === currentUserManager.documentId)  { return; } // This is current user. Don't show without colors

      // Render card
      return <RelationCard to={relation.to} from={relation.from} amt={relation.amount} key={index} />;
    })
  }

  /**
   * Render relations relating to current user.
   * @see {@link renderRelations}
   */
  function renderSelfRelations() {
    // Figure out who owes what
    let relations =  getRelations();
    
    // Return current user's relations
    return relations.map((relation, index) => {
      // Guard clauses:
      if (relation.to !== currentUserManager.documentId && relation.from !== currentUserManager.documentId) { return; } // Current user is not in this transaction
      
      // Render cards
      return <RelationCard to={relation.to} from={relation.from} amt={relation.amount} key={index + 2} />;
    })
  }

  /**
   * A component to render a transaction relation in a GradientCard
   * @param {string} to ID of user the money is going to
   * @param {string} from ID of user the money is coming from
   * @param {number} amt value of transaction relation 
   * @returns 
   */
  function RelationCard({to, from, amt}) {
    
    /**
     * If this is the current user, get red or green gradient. Otherwise, return white.
     * @returns gradient key
     */
    function getGradient() {
      if (to === currentUserManager.documentId) {
        // To current user! Negative amt is green
        return (amt < 0) ? "green" : "red";
      }
      if (from === currentUserManager.documentId) {
        // From current user! Negative amt is red
        return (amt > 0) ? "green" : "red";
      }
      // Not current user
      return "white";
    }

    // Render card
    return (
      <GradientCard gradient={getGradient()}>
        <View display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start">        
          <AvatarIcon id={from} marginRight={10}/>
          <Image source={dark ? require("../assets/images/ArrowDark.png") : require("../assets/images/ArrowLight.png")} style={{width: 40, height: 40}}/>
          <AvatarIcon id={to} marginLeft={10}/>
        </View>
        <TransactionLabel transaction={transactionsData[focus.transaction]} amtOverride={amt} invert={to === currentUserManager.documentId} current={to === currentUserManager.documentId || from === currentUserManager.documentId}/>
      </GradientCard>
      )
  }

  /**
   * Delete this transaction from the database and remove it from all users
   * @async
   */
  async function deleteTransaction() {

    // For all balances, get the user manager
    for (const user of Object.keys(currentTranscationData.balances)) {
      // Loop through the user's relations for histories that have this transaction
      const transactionUserManager = DBManager.getUserManager(user);
      const relations = await transactionUserManager.getRelations();
      // Get a UserManager for every user who has a relation and remove the transaction from history
      for (const relationKey of Object.entries(relations)) {
        const relation = new UserRelation(relationKey[1]);
        relation.removeHistory(focus.transaction);
        transactionUserManager.updateRelation(relationKey[0], relation);
      }
      // Remove transaction and push
      transactionUserManager.removeTransaction(focus.transaction);
      transactionUserManager.push();
    }

    // Get transaction manager and delete the document
    const transactionManager = DBManager.getTransactionManager(focus.transaction);
    transactionManager.deleteDocument();

    // Handle transaction's group, too
    if (currentTranscationData.group) {
        const groupManager = DBManager.getGroupManager(currentTranscationData.group);
        groupManager.removeTransaction(focus.transaction);
        groupManager.push();
    }
    
    // Go back to previous navigation page
    navigation.goBack();
  }

  /**
   * Navigate to the current transaction's group page
   */
  function navigateToGroup() {
    // Update focus
    const newFocus = {...focus};
    newFocus.group = currentTranscationData.group;
    setFocus(newFocus);
    // And navigate
    navigation.navigate("Groups", {screen: "detail"});
  }

  /**
   * Find out if there are relations in this transcation that do not include the current user
   * @returns boolean whether or not other people traded money without including current user
   */
  function thereAreOthers() {
    // Same relation finding logic as above (this is redundant!)
    // todo: maybe abstract this? somehow?
    let relations = [];
    let totalPaid = 0;
    for (const amt of Object.values(currentTranscationData.balances)) {
      if (amt > 0) {
        totalPaid += amt;
      }
    }
    for (const fromId of Object.keys(currentTranscationData.balances)) {
      const fromBal = currentTranscationData.balances[fromId];
      if (fromBal < 0) {
        // This user owes money
        for (const toId of Object.keys(currentTranscationData.balances)) {
          const toBal = currentTranscationData.balances[toId];
          if (toBal > 0) {
            // This user is owed money
            const multiplier = toBal / totalPaid;
            relations.push({
              to: toId,
              from: fromId,
              amount: fromBal * multiplier,
            });
          }
        }
      }
    }
    for (const r of relations) {
      if (r.to !== currentUserManager.documentId && r.from !== currentUserManager.documentId) {
        // If this relation doesn't include current user, return true
        return true;
      }
    }
    // Otherwise, we're the main character 🔥
    return false;
  }

  // So long as there is a currentTransactionData and a currentUserManager, render the detail page
  return ( currentTranscationData && currentUserManager && 
    <ScrollPage>
      <CardWrapper paddingBottom={20} marginBottom={10}>
        <CenteredTitle text={currentTranscationData ? `"${currentTranscationData.title}"` : ""} fontSize={24} />
        <View display="flex" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center">
          <TransactionLabel current={false} amtOverride={currentTranscationData ? currentTranscationData.amount : null} transaction={currentTranscationData ? currentTranscationData : null} marginTop={-5} color={dark ? darkTheme.textSecondary : lightTheme.textSecondary}/>
          <CenteredTitle text={currentTranscationData ? ` on ${getDateString(currentTranscationData.date)}` : ""} color={dark ? darkTheme.textSecondary : lightTheme.textSecondary} marginTop={5}/>
        </View>
        <TransactionLabel current={true} transaction={currentTranscationData ? currentTranscationData : null} marginTop={10} fontSize={32}/>
        <View display="flex" flexDirection="row" justifyContent="space-around">
          <View display="flex" flexDirection="column" justifyContent="space-between" style={{flex: 1}}>
            <CenteredTitle text="Paid By" />
            <View display="flex" flexDirection="row" alignItems="center" justifyContent="center">
              { renderPaidBy() }
            </View>
          </View>
          <View display="flex" flexDirection="column" justifyContent="space-between" style={{flex: 1}}>
            <CenteredTitle text="In Debt" />
            <View display="flex" flexDirection="row" alignItems="center" justifyContent="center">
              { renderInDebt() }
            </View>
          </View>
        </View>
      </CardWrapper>

      <TrayWrapper width="50%" center={!currentTranscationData.group}>
        { currentTranscationData.group && <GroupPill onClick={() => navigateToGroup()} /> }
        <DeletePill onClick={() => 
          Alert.alert(
            "Delete Transaction?", 
            `Delete "${currentTranscationData.title}"?`, 
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Delete Transaction',
                onPress: () => deleteTransaction(),
                style: 'destructive',
              },
            ],)}/>
      </TrayWrapper>

      <View width="100%">
        { renderSelfRelations() }
        { thereAreOthers() && <CenteredTitle text="Other Participants" color="secondary" /> }
        { renderRelations() }
      </View>

    </ScrollPage>
  )
}
