// Library Imports
import { useContext, useEffect, useState, } from "react";
import { Image, Pressable, Text, View, } from "react-native";

// Context Imports
import { CurrentUserContext, DarkContext, } from "../Context";

// Style Imports
import { darkTheme, globalColors, lightTheme, } from "../assets/styles";

// Enum Imports
import { emojiCurrencies, } from "../api/enum";

/**
 * Basic centered text component that ignoes touch
 * @param {string} text text to display in title
 * @param {string} color color or color key (ex. "secondary")
 * @param {number} marginTop top margin 
 * @param {number} marginBottom bottom margin 
 * @param {number} marginLeft left margin 
 * @param {number} marginRight right margin 
 * @param {string} fontWeight font weight ("bold", etc.)
 * @param {number} fonSize font weight 
 * @default
 * color = "primary";
 * fontWeight = "bold";
 * fontSize = 16;
 * marginTop = 10;
 * marginBottom = 10;
 * marginLeft = 0;
 * marginRight = 0;
 */
export function CenteredTitle(props) {

  // Get context
  const { dark } = useContext(DarkContext);

  /**
   * Get the correct text color based on params. If no params, return primary
   * @returns text color string
   */
  function getColor() {
    if (props.color) {
      if (props.color === "secondary") {
        return dark ? darkTheme.textSecondary : lightTheme.textSecondary;
      }
      return props.color;
    }
    return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  }

  return (
    <View 
      style={{
        display: 'flex', 
        direction: "row", 
        alignItems: "center"
      }} 
      pointerEvents="none"
    >
      <Text 
        style={{ 
          fontSize: props.fontSize ? props.fontSize : 16, 
          fontWeight: props.fontWeight ? props.fontWeight : 'bold', 
          color: getColor(), 
          marginTop: props.marginTop ? props.marginTop : 10,
          marginBottom: props.marginBottom ? props.marginBottom : 10,
          marginLeft: props.marginLeft ? props.marginLeft : 0,
          marginRight: props.marginRight ? props.marginRight : 0,
        }}
      >
        {props.text}
      </Text>
    </View>
  )
}

/**
 * Basic styled text component with onClick function
 * @param {string} text text to display
 * @param {Function} onClick function to call on click
 * @param {string} color text color
 * @param {number} marginTop top margin 
 * @param {number} marginBottom bottom margin 
 * @param {number} marginLeft left margin 
 * @param {number} marginRight right margin 
 * @param {string} fontWeight font weight ("bold", etc.)
 * @param {number} fonSize font weight 
 * @default
 * color = "primary";
 * fontWeight = "bold";
 * fontSize = 16;
 * marginTop = 0;
 * marginBottom = 0;
 * marginLeft = 0;
 * marginRight = 0;
 * onClick = null;
 */
export function StyledText(props) {

  // Get context
  const { dark } = useContext(DarkContext);

  /**
   * Get the correct text color based on params. If no params, return primary
   * @returns text color string
   */
  function getColor() {
    if (props.color) {
      if (props.color === "secondary") {
        return dark ? darkTheme.textSecondary : lightTheme.textSecondary;
      }
      return props.color;
    }
    return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  }

  return (
    <Pressable
      onPress={props.onClick} 
      pointerEvents="none" 
      display="flex" 
      flexDirection="row" 
      alignItems="center" 
      textAlign="center" 
      style={{
        height: props.height, 
        marginTop: props.marginTop ? props.marginTop : 0,
        marginBottom: props.marginBottom ? props.marginBottom : 0,
        marginLeft: props.marginLeft ? props.marginLeft : 0,
        marginRight: props.marginRight ? props.marginRight : 0,
      }}
    >
      <Text 
        pointerEvents="none"
        style={{ 
          zIndex: props.zIndex ? props.zIndex : 1,
          fontSize: props.fontSize ? props.fontSize : 16, 
          fontWeight: props.fontWeight ? props.fontWeight : 'bold', 
          color: getColor(), 
          textAlign: 'center'
        }}
      >
        {props.text}
      </Text>
    </Pressable>
  )
}

/**
 * Component for showing a styled label aligned to a certain position inside of a flexRow
 * @deprecated since 2/27/2023: use {@link StyledText} or {@link CenteredTitle} instead
 * @param {string} alignment row alignment ("center", "flex-start", "flex-end", etc.) 
 * @param {number} fontSize font size of text 
 * @param {string} fontWeight font weight of text ("bold", "italic", etc.) 
 * @param {string} color hex value of text color 
 * @param {number} marginTop top margin 
 * @param {number} marginBottom bottom margin 
 * @param {number} marginLeft left margin 
 * @param {number} marginRight right margin
 * @default
 * alignment = "center";
 * fontSize = 16;
 * fontWeight = "bold";
 * marginTop = 0;
 * marginBottom = 0;
 * marginLeft = 0;
 * marginRight = 0;
 * color = "primary";
 */
export function AlignedText(props) {

  // Get context
  const { dark } = useContext(DarkContext);

  /**
   * Get the correct text color based on params. If no params, return primary
   * @returns text color string
   */
  function getColor() {
    if (props.color) {
      if (props.color === "secondary") {
        return dark ? darkTheme.textSecondary : lightTheme.textSecondary;
      }
      return props.color;
    }
    return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  }

  return (
    <View 
      style={{
        display: 'flex', 
        direction: "row", 
        alignItems: props.alignment ? props.alignItems : 'center'
      }}
    >
      <Text 
        style={{ 
          fontSize: props.fontSize ? props.fontSize : 16, 
          fontWeight: props.fontWeight ? props.fontWeight : 'bold', 
          color: getColor(), 
          marginTop: props.marginTop ? props.marginTop : 0,
          marginBottom: props.marginBottom ? props.marginBottom : 0,
          marginLeft: props.marginLeft ? props.marginLeft : 0,
          marginRight: props.marginRight ? props.marginRight : 0,
        }}
      >
        {props.text}
      </Text>
    </View>
  )
}

/**
 * Render styled label for a UserRelation's USD balance
 * @param {UserRelation} relation a UserRelation 
 * @param {Function} onClick function to call on click
 * @param {number} fontSize font size
 * @param {string} fontWeight font weight
 * @param {number} marginTop top margin
 * @param {number} marginBottom bottom margin
 * @param {number} marginLeft left margin
 * @param {number} marginRight right margin
 * @default
 * fontSize = 16;
 * fontWeight = "bold";
 * marginTop = 0;
 * marginBottom = 0;
 * marginLeft = 0;
 * marginRight = 0;
 * onClick = null;
 */
export function RelationLabel(props) {

  // Get context
  const { dark } = useContext(DarkContext);

  /**
   * Get the color of this relation label based on the USD amount.
   * > 0 = green,
   * < 0 = red,
   * and 0 = primary
   * @returns color string
   */
  function getColor() {
    if (props.relation.balances["USD"].toFixed(2) > 0) {
      return globalColors.green;
    }
    if (props.relation.balances["USD"].toFixed(2) < 0) {
      return globalColors.red;
    }
    return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  }

  /**
   * Get a "+$" or "-$" depending on balance sign 
   * @returns operator string
   */
  function getOperator() {
    if (props.relation.balances["USD"].toFixed(2) > 0) {
      return "+ $";
    }
    if (props.relation.balances["USD"].toFixed(2) < 0) {
      return "- $";
    }
    return "$";
  }

  return (
    <Pressable onPress={props.onClick} pointerEvents="none" >
      <Text 
        style={{ 
          fontSize: props.fontSize ? props.fontSize : 24, 
          fontWeight: props.fontWeight ? props.fontWeight : 'bold', 
          color: getColor(), 
          marginTop: props.marginTop ? props.marginTop : 0,
          marginBottom: props.marginBottom ? props.marginBottom : 0,
          marginLeft: props.marginLeft ? props.marginLeft : 0,
          marginRight: props.marginRight ? props.marginRight : 0,
        }}
      >
        { getOperator() + Math.abs(props.relation.balances["USD"]).toFixed(2) }
      </Text>
    </Pressable>
  )
}

/**
 * Emoji bar component, displaying all emojis for either a single relation or a group
 * @param {string} group groupId (if applicable)
 * @param {UserRelation} relation user relation (if applicable)
 * @param {string} size "large"?
 * @param {number} marginTop top margin
 * @param {number} marginBottom bottom margin
 * @default
 * size = "default" / <- it'll be 20px;
 * marginTop = 0;
 * marginBottom = 0;
 */
export function EmojiBar(props) {

  // Geet context
  const { dark } = useContext(DarkContext);
  const { currentUserManager } = useContext(CurrentUserContext);
  const [ groupEmojiAmounts, setGroupEmojiAmounts ] = useState(null);
  
  // Get group totals when group changes
  useEffect(getGroupAmounts, [props.group])

  /**
   * Loop through user's relations for each emoji's group balances and updates
   * the {@link groupEmojiAmounts} state accordingly
   */
  function getGroupAmounts() {
    // Guard clauses
    if (!props.group)         { return; } // props.group somehow got set to null??
    if (!currentUserManager)  { return; } // No current user manager??

    // Create a map of emoji amounts
    const emojiAmounts = {};
    for (const userId of Object.keys(currentUserManager.data.relations)) {
      // For each relation that the user has...
      if (currentUserManager.data.relations[userId].groupBalances[props.group.id]) {
        // User has a bal with this person in this group
        for (const balType of Object.keys(currentUserManager.data.relations[userId].groupBalances[props.group.id])) {
          // Get amount of this emoji in this group
          const amt = currentUserManager.data.relations[userId].groupBalances[props.group.id][balType];
          // Make sure map has a key for this emoji
          if (!emojiAmounts[balType]) { emojiAmounts[balType] = 0 };
          // Add it to the map
          emojiAmounts[balType] += amt;
        }
      }
    }
    // Update state
    setGroupEmojiAmounts(emojiAmounts);
  }

  /**
   * Get the emoji image height and width based on the size prop
   * @returns image height and width
   */
  function getImgSize() {
    if (props.size) {
      if (props.size === "large") {
        return 24;
      }
    }
    return 20;
  }

  /**
   * The emoji's badge has to be moved further from the left if it's "large".
   * Find the left displacement of the badge by the size prop.
   * @returns badge left translation
   */
  function getBadgeLeft() {
    if (props.size) {
      if (props.size === "large") {
        return 12;
      }
    }
    return 10;
  }

  /**
   * Get the size of the badge based on the size prop
   * @returns size of badge
   */
  function getBadgeSize() {
    if (props.size) {
      if (props.size === "large") {
        return 18;
      }
    }
    return 16;
  }

  /**
   * Get the font size of the number in the badge based on the size prop
   * @returns font size
   */
  function getBadgeFontSize() {
    if (props.size) {
      if (props.size === "large") {
        return 12;
      }
    }
    return 12;
  }

  /**
   * Renders components for each of the emojis in a relation (independent of groups)
   */
  function renderRelationEmojis() {
    return Object.keys(props.relation.balances).map((bal, index) => {
      // Guard clauses:
      if (bal === "USD") { return ; }                     // This isn't an emoji balance
      if (props.relation.balances[bal] === 0) { return; } // Balance is zero, so no need to show it

      /**
       * Get the color of the badge by the balance's sign
       * @returns color string
       */
      function getColor() {
        if (props.relation.balances[bal] > 0) {
          return globalColors.green;
        }
        if (props.relation.balances[bal] < 0) {
          return globalColors.red;
        }
      }    

      /**
       * Get the source of the emoji image by balance type
       * @returns img source
       */
      function getEmojiSource() {
        switch (bal) {
          case emojiCurrencies.BEER:
            return require("../assets/images/emojis/beer.png");
          case emojiCurrencies.COFFEE:
            return require("../assets/images/emojis/coffee.png");
          case emojiCurrencies.PIZZA:
            return require("../assets/images/emojis/pizza.png");
          default:
            return "";
        }
      }

      // Render the image
      return (
        <View key={index}>
          <Image source={getEmojiSource()} style={{width: getImgSize(), height: getImgSize()}}/>
          <Text
            style={{
              color: dark ? darkTheme.badgeText : lightTheme.badgeText,
              backgroundColor: getColor(),
              textAlign: 'center',
              fontWeight: 'bold',
              borderRadius: 100,
              borderColor: dark ? darkTheme.badgeBorder : lightTheme.badgeBorder,
              borderWidth: 1,
              width: getBadgeSize(),
              height: getBadgeSize(),
              fontSize: getBadgeFontSize(),
              left: getBadgeLeft(),
              top: -8,
              position: 'absolute',
            }}
          >
            { Math.abs(props.relation.balances[bal]) }
          </Text>
        </View> 
      )
    })
  }

  /**
   * Render components for each of the emojis from the context of a group
   */
  function renderGroupEmojis() {
    // Guard clauses:
    if (!groupEmojiAmounts) { return; } // We don't have any data on the group's emoji balances

    return Object.keys(groupEmojiAmounts).map((bal, index) => {
      // Guard clauses:
      if (bal === "USD") { return; }                // This is not an emoji balance
      if (groupEmojiAmounts[bal] === 0) { return; } // Balance is zero. Don't show it

      /**
       * Get the color of the badge by the balance's sign
       * @returns color string
       */
      function getColor() {
        if (groupEmojiAmounts[bal] > 0) {
          return globalColors.green;
        }
        if (groupEmojiAmounts[bal] < 0) {
          return globalColors.red;
        }
      }    

      /**
       * Get the source of the emoji image by balance type
       * @returns img source
       */
      function getEmojiSource() {
        switch (bal) {
          case emojiCurrencies.BEER:
            return require("../assets/images/emojis/beer.png");
          case emojiCurrencies.COFFEE:
            return require("../assets/images/emojis/coffee.png");
          case emojiCurrencies.PIZZA:
            return require("../assets/images/emojis/pizza.png");
          default:
            return "";
        }
      }

      // Rethrn the badge
      return (
        <View key={index}>
          <Image source={getEmojiSource()} style={{width: getImgSize(), height: getImgSize()}}/>
          <Text
            style={{
              color: dark ? darkTheme.badgeText : lightTheme.badgeText,
              backgroundColor: getColor(),
              textAlign: 'center',
              fontWeight: 'bold',
              borderRadius: 100,
              borderColor: dark ? darkTheme.badgeBorder : lightTheme.badgeBorder,
              borderWidth: 1,
              width: getBadgeSize(),
              height: getBadgeSize(),
              fontSize: getBadgeFontSize(),
              left: getBadgeLeft(),
              top: -8,
              position: 'absolute',
            }}
          >
            { Math.abs(groupEmojiAmounts ? groupEmojiAmounts[bal] : 0) }
          </Text>
        </View> 
      )
    })
  }

  return (
    <Pressable 
      pointerEvents="none"
      onPress={props.onClick} 
      style={{
        marginTop: props.marginTop ? props.marginTop : 0, 
        marginBottom: props.marginBottom ? props.marginBottom : 0, 
        display: "flex", 
        flexDirection: "row", 
        alignItems: "center",
        paddingHorizontal: 10, 
        justifyContent: props.justifyContent ? props.justifyContent : "flex-start",
        transform: props.transform ? props.transform : []
      }}
    >
      { props.relation && renderRelationEmojis() /* If we have a relation, render for relation */ }
      { props.group && renderGroupEmojis() /* If we have a group, render for group */ }
    </Pressable>
  )
}

/**
 * Component to show the value of a userRelation history
 * @param {UserRelationHistory} history UserRelationHistory to render label for 
 * @param {string} group group id to render in context if needed 
 * @param {number} fontSize font size of text 
 * @param {string} fontWeight font weight of text ("bold", "italic", etc.) 
 * @param {string} color hex value of text color 
 * @param {number} marginTop top margin 
 * @param {number} marginBottom bottom margin 
 * @param {number} marginLeft left margin 
 * @param {number} marginRight right margin
 * @default
 * fontSize = 24;
 * fontWeight = "bold";
 * marginTop = 0;
 * marginBottom = 0;
 * marginLeft = 0;
 * marginRight = 0;
 */
export function RelationHistoryLabel(props) {

  // Get context
  const { dark } = useContext(DarkContext);

  /**
   * Get color of label based on sign of history amount
   * @returns color string
   */
  function getColor() {
    if (props.history.amount.toFixed(2) > 0) {
      return globalColors.green;
    }
    if (props.history.amount.toFixed(2) < 0) {
      return globalColors.red;
    }
    return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  }

  /**
   * Get operator of label based on sign of history amount
   * @returns operator string
   */
  function getOperator() {
    if (props.history.amount.toFixed(2) > 0) {
      return "+ ";
    }
    if (props.history.amount.toFixed(2) < 0) {
      return "- ";
    }
    return "";
  }

  /**
   * Style applied to all types UserRelationHistory labels
   */
  const titleStyle = { 
    fontSize: props.fontSize ? props.fontSize : 24, 
    fontWeight: props.fontWeight ? props.fontWeight : 'bold', 
    color: getColor(), 
    marginTop: props.marginTop ? props.marginTop : 0,
    marginBottom: props.marginBottom ? props.marginBottom : 0,
    marginLeft: props.marginLeft ? props.marginLeft : 0,
    marginRight: props.marginRight ? props.marginRight : 0,
  };

  /**
   * Get the image associated with an emoji currency
   * @returns img source
   */
  function getEmojiSource() {
    switch (props.history.currency.type) {
      case emojiCurrencies.BEER:
        return require("../assets/images/emojis/beer.png");
      case emojiCurrencies.COFFEE:
        return require("../assets/images/emojis/coffee.png");
      case emojiCurrencies.PIZZA:
        return require("../assets/images/emojis/pizza.png");
      default:
        return "";
    }
    }

  /**
   * Get the value of a history, whether from group context or overall
   * @returns value of history
   */
  function getAmt() {
    if (!props.group) {
      // If no group, just get total
      return props.history.amount;
    }
    // If there's a group, get the total that this history impacted this group
    return props.history.settleGroups[props.group]
  }

  return ( 
    (props.history.currency.legal) ? // If we're using legal tendor, render a USD representation
    <Pressable onPress={props.onClick} display="flex" flexDirection="row" pointerEvents="none" >
      <Text style={titleStyle}>
        { getOperator() + "$" +  Math.abs(getAmt()).toFixed(2) }
      </Text>
    </Pressable> 
    : // Otherwise, render the emojis
    <Pressable onPress={props.onClick} display="flex" flexDirection="row" alignItems="center">
      <Text style={titleStyle}>
        { getOperator() }
      </Text>
      <Image source={getEmojiSource()} style={{width: 20, height: 20}}/>
      <Text style={titleStyle}>
        { " x " +  Math.abs(getAmt()) }
      </Text>
    </Pressable>
  )
}

/**
 * Component for rendering a relation in the notification tray
 * @param {Notification} notification notification from user's document
 * @param {number} fontSize font size of text 
 * @param {string} fontWeight font weight of text ("bold", "italic", etc.) 
 * @param {string} color hex value of text color 
 * @param {number} marginTop top margin 
 * @param {number} marginBottom bottom margin 
 * @param {number} marginLeft left margin 
 * @param {number} marginRight right margin
 * @default
 * fontSize = 24;
 * fontWeight = "bold";
 * marginTop = 0;
 * marginBottom = 0;
 * marginLeft = 0;
 * marginRight = 0; 
 */
export function NotificationAmountLabel(props) {

  // Get context
  const { dark } = useContext(DarkContext);

  /**
   * Get color or notification by amount sign 
   * @returns color string
   */
  function getColor() {
    if (props.notification.value.toFixed(2) > 0) {
      return globalColors.green;
    }
    if (props.notification.value.toFixed(2) < 0) {
      return globalColors.red;
    }
    return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  }

  /** 
   * Get operator string by amount sign
   * @returns operator string
   */
  function getOperator() {
    if (props.notification.value.toFixed(2) > 0) {
      return "+ ";
    }
    if (props.notification.value.toFixed(2) < 0) {
      return "- ";
    }
    return "";
  }

  /**
   * Title style for all types of notification label
   */
  const titleStyle = { 
    fontSize: props.fontSize ? props.fontSize : 24, 
    fontWeight: props.fontWeight ? props.fontWeight : 'bold', 
    color: getColor(), 
    marginTop: props.marginTop ? props.marginTop : 0,
    marginBottom: props.marginBottom ? props.marginBottom : 0,
    marginLeft: props.marginLeft ? props.marginLeft : 0,
    marginRight: props.marginRight ? props.marginRight : 0,
  };

  /**
   * Get the image path for emoji currencies
   * @returns img path
   */
  function getEmojiSource() {
    switch (props.notification.currency.type) {
      case emojiCurrencies.BEER:
        return require("../assets/images/emojis/beer.png");
      case emojiCurrencies.COFFEE:
        return require("../assets/images/emojis/coffee.png");
      case emojiCurrencies.PIZZA:
        return require("../assets/images/emojis/pizza.png");
      default:
        return "";
    }
  }

  return ( 
    (props.notification.currency.legal) ? // We're using legal currency so render like USD
    <Pressable onPress={props.onClick} display="flex" flexDirection="row">
      <Text style={titleStyle}>
        { getOperator() + "$" +  Math.abs(props.notification.amount).toFixed(2) }
      </Text>
    </Pressable> 
    : // We're using emojis
    <Pressable onPress={props.onClick} display="flex" flexDirection="row" alignItems="center">
      <Text style={titleStyle}>
        { getOperator() }
      </Text>
      <Image source={getEmojiSource()} style={{width: 20, height: 20}}/>
      <Text style={titleStyle}>
        { " x " +  Math.abs(props.notification.amount) }
      </Text>
    </Pressable>
  )
}

/**
 * An honestly disgusting component for rendering group totals
 * @param {Group} group notification from user's document
 * @param {number} fontSize font size of text 
 * @param {string} fontWeight font weight of text ("bold", "italic", etc.) 
 * @param {string} color hex value of text color 
 * @param {number} marginTop top margin 
 * @param {number} marginBottom bottom margin 
 * @param {number} marginLeft left margin 
 * @param {number} marginRight right margin
 * @default
 * fontSize = 24;
 * fontWeight = "bold";
 * marginTop = 0;
 * marginBottom = 0;
 * marginLeft = 0;
 * marginRight = 0; 
 */
export function GroupLabel(props) {

  // Get context
  const { dark } = useContext(DarkContext);
  const { currentUserManager } = useContext(CurrentUserContext);

  // Start counting balance at 0
  let bal = 0;

  if (currentUserManager) {
    // So long as we have a currentUserManager...
    for (const userId of Object.keys(currentUserManager.data.relations)) {
      // For every relation
      if (currentUserManager.data.relations[userId].groupBalances[props.group.id]) {
        // User has a bal with this person in this group
        if (currentUserManager.data.relations[userId].groupBalances[props.group.id]["USD"]) {
          // And they have a USD balance! Add the balance to the balance total
          bal += currentUserManager.data.relations[userId].groupBalances[props.group.id]["USD"];
        }
      }
    }
  }

  /**
   * Get color of label by balance sign
   * @returns color string
   */
  function getColor() {
    if (bal > 0) {
      return globalColors.green;
    }
    if (bal < 0) {
      return globalColors.red;
    }
    return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  }

  /**
   * Get operator for label by balance sign
   * @returns operator string
   */
  function getOperator() {
    if (bal > 0) {
      return "+ $";
    }
    if (bal < 0) {
      return "- $";
    }
    return " $";
  }

  return ( 
    <Pressable onPress={props.onClick} pointerEvents="none" >
      <Text 
        style={{ 
          fontSize: props.fontSize ? props.fontSize : 24, 
          fontWeight: props.fontWeight ? props.fontWeight : 'bold', 
          color: getColor(), 
          marginTop: props.marginTop ? props.marginTop : 0,
          marginBottom: props.marginBottom ? props.marginBottom : 0,
          marginLeft: props.marginLeft ? props.marginLeft : 0,
          marginRight: props.marginRight ? props.marginRight : 0,
        }}
      >
        { getOperator() + Math.abs(bal ? bal : 0).toFixed(2) }
      </Text>
    </Pressable>
  )
}

/**
 * A component for rendering the value of a transation from current user's perspective
 * @param {Transaction} transaction transaction to render
 * @param {string} perspective ID of user to render this transaction for
 * @param {number} amtOverride prop to override transaction balance if needed
 * @param {boolean} current whether or not this should be rendered with color
 * @param {boolean} invert whether or not to multiply balance by -1
 * @param {number} fontSize font size of text 
 * @param {string} fontWeight font weight of text ("bold", "italic", etc.) 
 * @param {string} color hex value of text color 
 * @param {number} marginTop top margin 
 * @param {number} marginBottom bottom margin 
 * @param {number} marginLeft left margin 
 * @param {number} marginRight right margin
 * @default
 * perspective = currentUserManager.documentId;
 * fontSize = 24;
 * fontWeight = "bold";
 * marginTop = 0;
 * marginBottom = 0;
 * marginLeft = 0;
 * marginRight = 0; 
 * current = true;
 */
export function TransactionLabel(props) {
  // Guard clauses:
  if (!props.transaction) { return; } // Lol there's no transaction

  // Get context
  const { dark } = useContext(DarkContext);
  const { currentUserManager } = useContext(CurrentUserContext);

  // Determine balance by userId and invert props
  const userId = props.perspective ? props.perspective : currentUserManager.documentId;
  let bal = props.amtOverride ? props.amtOverride : props.transaction.balances[userId].toFixed(2);
  if(props.invert) {
    bal = bal * -1;
  }
  
  /**
   * Get color by props or by balance sign
   * @returns color string
   */
  function getColor() {
    if (props.color) {
      return props.color;
    }
    if (props.current) {
      if (bal) {
        if (bal > 0) {
          return globalColors.green;
        }
        if (bal < 0) {
          return globalColors.red;
        }
      }
    }
    return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  }

  /**
   * So long as we're the current user, get an operator string
   * @returns operator string
   */
  function getOperator() {
    if (bal && props.current) {
      if (bal > 0) {
        return "+ ";
      }
      if (bal < 0) {
        return "- ";
      }
    }
    return " ";
  }

  /**
   * Style for all types of transaction labels
   */
  const titleStyle = { 
    fontSize: props.fontSize ? props.fontSize : 24, 
    fontWeight: props.fontWeight ? props.fontWeight : 'bold', 
    color: getColor(), 
    marginTop: props.marginTop ? props.marginTop : 0,
    marginBottom: props.marginBottom ? props.marginBottom : 0,
    marginLeft: props.marginLeft ? props.marginLeft : 0,
    marginRight: props.marginRight ? props.marginRight : 0,
    zIndex: -10,
  };
  
  /**
   * Get image source for emoji currency types
   * @returns img source
   */
  function getEmojiSource() {
    switch (props.transaction.currency.type) {
      case emojiCurrencies.BEER:
        return require("../assets/images/emojis/beer.png");
      case emojiCurrencies.COFFEE:
        return require("../assets/images/emojis/coffee.png");
      case emojiCurrencies.PIZZA:
        return require("../assets/images/emojis/pizza.png");
      default:
        return "";
    }
  }

  return ( 
    (props.transaction.currency.legal) ? // This is a legal currency. Render like USD
    <Pressable onPress={props.onClick} display="flex" flexDirection="row" pointerEvents="none" >
      <Text style={titleStyle}>
        { getOperator() + "$" + Math.abs(bal ? bal : 0).toFixed(2) }
      </Text>
    </Pressable> 
    :  // This is an emoji currency
    <Pressable onPress={props.onClick} display="flex" flexDirection="row" alignItems="center">
      <Text style={titleStyle}>
        { getOperator() }
      </Text>
      <Image source={getEmojiSource()} style={{width: props.fontSize ? props.fontSize : 20, height: props.fontSize ? props.fontSize : 20}}/>
      <Text style={titleStyle}>
        { " x " +  Math.abs(bal) }
      </Text>
    </Pressable>
  )
}
