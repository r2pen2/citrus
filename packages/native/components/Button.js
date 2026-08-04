// Library Imports
import CheckBox from "expo-checkbox";
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, } from 'react';
import { Keyboard, Image, Pressable, Text, View, } from "react-native";
import DropDownPicker from "react-native-dropdown-picker"
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';

// context Imports
import { DarkContext, NewTransactionContext } from '../Context';

// Style Imports
import { buttonStyles, darkTheme, lightTheme, globalColors, measurements, } from '../assets/styles';

// API Imports
import { emojiCurrencies, legalCurrencies } from '../api/enum';

/**
 * Simple round + button for display next to search bars
 * @param {Function} onClick function to be called on click\
 */
export function AddButton(props) {

  const { dark } = useContext(DarkContext);

  return (
    <Pressable display="flex" flexDirection="column" alignItems="center" justifyContent="center" onPress={props.onClick}>
        <Image source={dark ? require("../assets/images/AddButton.png") : require("../assets/images/AddButtonLight.png")} style={{width: 40, height: 40, backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), borderRadius: 20}}/>
    </Pressable>
  )
}

/**
 * Simple darkmode toggle button. Changes {@link DarkContext} on click.
 */
export function DarkModeButton() {

  const { dark, setDark } = useContext(DarkContext);

  return (
    <Pressable onPress={() => setDark(!dark)}>
      <View display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <Image source={dark ? require("../assets/images/LightMode.png") : require("../assets/images/DarkMode.png")} style={{width: 40, height: 40, backgroundColor: "transparent"}}/>
      </View>
    </Pressable>
  )
}

/**
 * Simple edit button for settings pages
 * @param {Function} onClick function to be called on click
 */
export function EditButton(props) {

  const { dark } = useContext(DarkContext);

  return (
    <Pressable onPress={props.onClick}>
      <View display="flex" flexDirection="column" alignItems="center" justifyContent="center">
        <Image source={dark ? require("../assets/images/EditDark.png") : require("../assets/images/EditLight.png")} style={{width: 40, height: 40, backgroundColor: "transparent"}}/>
      </View>
    </Pressable>
  )
}

/**
 * General button with text component for CitrusNative
 * @param {Function} onClick function to be called onClick
 * @param {string} color hex value or color key (ex. "red", "green", "venmo")
 * @param {boolean} disabled whether or not to show this button as disabled
 * @param {string} buttonBorder color for button border
 * @param {boolean} buttonBorderDisabled whether to hide the border or not
 * @param {number} width width of button
 * @param {number} height height of button
 * @param {number} marginTop top margin
 * @param {number} marginBottom bottom margin
 * @param {boolean} selected whether or not to display button as selected 
 * @default
 * marginTop = 10;
 * marginBottom = 0;
 */
export function StyledButton(props) {

  const { dark } = useContext(DarkContext);

    /**
   * Get the correct border color from props or default to buttonBorder based on DarkContext
   * @returns string for border color
   */
  function getBorderColor() {
    if (props.color) {
      if (props.color === "red") {
        return globalColors.red;
      }
      if (props.color === "green") {
        return globalColors.green;
      }
      if (props.color === "venmo") {
        return globalColors.venmo;
      }
    }
    if (props.disabled) {
      return dark ? darkTheme.buttonBorderDisabled : lightTheme.buttonBorderDisabled;
    }
    return dark ? darkTheme.buttonBorder : lightTheme.buttonBorder;
  }

  /**
   * Get the correct text color from props or default to textPrimary based on DarkContext
   * @returns string for text color
   */
  function getTextColor() {
    if (props.color) {
      if (props.color === "red") {
        return globalColors.red;
      }
      if (props.color === "green") {
        return globalColors.green;
      }
    }
    if (props.disabled) {
      return dark ? darkTheme.textSecondary : lightTheme.textSecondary;
    }
    return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  }

  // If the button is "selected", render it with a gradient
  if (props.selected) {
    return (
      <LinearGradient 
        start={[0, 0.5]}
        end={[1, 0.5]}
        colors={dark ? darkTheme.selectedFill : lightTheme.selectedFill}
        style={{
          display: 'flex', 
          flexDirection: "row", 
          width: props.width ? props.width : buttonStyles.buttonWidth, 
          height: props.height ? props.height : buttonStyles.buttonHeight,
          marginTop: props.marginTop ? props.marginTop : 10,
          marginBottom: props.marginBottom ? props.marginBottom : 0,
          borderRadius: 10,
          backgroundColor: dark ? darkTheme.buttonFill : lightTheme.buttonFill,
          elevation: buttonStyles.buttonElevation
        }}
      >
        <Pressable
          onPress={props.onClick}
          disabled={props.disabled}
          style={{
            height: "100%",
            width: "100%",
            borderRadius: 10,
            borderWidth: buttonStyles.buttonBorderWidth,
            borderColor: getBorderColor(),
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text 
            style={{
              color: (getTextColor()), 
              fontSize: 20
              }}
            >
              {props.text}
          </Text>
        </Pressable>
      </LinearGradient>
    );
  }

  // Button is unselected. Render without gradient
  return (
    <View 
      style={{
        display: 'flex', 
        flexDirection: "row", 
        width: props.width ? props.width : buttonStyles.buttonWidth, 
        height: props.height ? props.height : buttonStyles.buttonHeight,
        marginTop: props.marginTop ? props.marginTop : 10,
        marginBottom: props.marginBottom ? props.marginBottom : 0,
        borderRadius: 10,
        backgroundColor: dark ? darkTheme.buttonFill : lightTheme.buttonFill,
        elevation: buttonStyles.buttonElevation
      }}
    >
      <Pressable
        onPress={props.onClick}
        disabled={props.disabled}
        android_ripple={props.onClick ? {color: globalColors.greenAlpha} : {}}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: 10,
          borderWidth: buttonStyles.buttonBorderWidth,
          borderColor: getBorderColor(),
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text 
          style={{
            color: (getTextColor()), fontSize: 20
            }}
          >
          {props.text}
        </Text>
      </Pressable>
    </View>
  )
}

export function StyledCheckbox(props) {
  return (
    <CheckBox 
    value={props.checked} 
    color={props.checked ? "#fcfcfc" : "#767676"}
    onValueChange={props.onChange}/>
  )
}

/**
 * Google Sign-In button for Login Screen
 * @param {Function} onClick function to be called on click 
 */
export function GoogleButton({onClick}) {

  return (
    <View 
      style={{
        display: 'flex', 
        flexDirection: "row", 
        width: buttonStyles.buttonWidth, 
        height: buttonStyles.buttonHeight,
        marginTop: 10,
        marginBottom:  0,
        borderRadius: 10,
        elevation: buttonStyles.buttonElevation
      }}
    >
      <Pressable
        onPress={onClick}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: 10,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GoogleSigninButton />
      </Pressable>
    </View>
  );
}

/**
 * Button that toggles whether or not newTransactionData currency is set to legal
 */
export function CurrencyLegalButton() {

  // Get contexts
  const { dark } = useContext(DarkContext);
  const { newTransactionData, setNewTransactionData } = useContext(NewTransactionContext);

  /**
   * Update the {@link newTransactionData} state to toggled currencyLegal
   */
  function handleCurrencyLegalChange() {
    const update = {...newTransactionData};
    update.currencyLegal = !newTransactionData.currencyLegal;
    update.currencyMenuOpen = false;
    setNewTransactionData(update); 
  }  

  /**
   * Get the right image for the current currencyLegal value
   * @returns image source
   */
  function getSource() {
    if (newTransactionData.currencyLegal) {
      return dark ? require("../assets/images/PaymentDark.png") : require("../assets/images/PaymentLight.png");
    }
    return dark ? require("../assets/images/SmileDark.png") : require("../assets/images/SmileLight.png")
  }
  
  return (
    <Pressable onPress={handleCurrencyLegalChange}>
      <View 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        style={{
          height: measurements.entryHeight, 
          width: measurements.entryHeight, 
          backgroundColor: dark ? darkTheme.textFieldFill : lightTheme.textFieldFill, 
          borderColor: dark ? darkTheme.textFieldBorderColor : lightTheme.textFieldBorderColor, 
          borderWidth: 1, 
          borderRadius: 5
        }}
      >
        <Image source={getSource()} style={{width: measurements.entryHeight - 20, height: measurements.entryHeight - 20}}/>
      </View>
    </Pressable>
  );
}

/**
 * Button for opening the currency type dropdown menu and setting the newTransactionData state once an option is selected
 */
export function CurrencyTypeButton() {

  // Get context
  const { dark } = useContext(DarkContext);
  const { newTransactionData, setNewTransactionData } = useContext(NewTransactionContext);
  
  /**
   * Get the correct image for the current currency
   * @param {string} itemName name of the item we're getting an image for 
   * @returns image path
   */
  function getSource(itemName) {
    if (newTransactionData.currencyLegal) {
      switch (newTransactionData.legalType) {
        case legalCurrencies.USD:
          return dark ? require("../assets/images/currencies/USDDark.png") : require("../assets/images/currencies/USDLight.png");
        default:
          return "";
      }
    } else {
      switch (itemName) {
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
  }

  /**
   * Set the {@link newTransactionData} state to have a new currencyType
   */
  function updateCurrencyType(item) {
    const newData = {...newTransactionData};
    if (newTransactionData.currencyLegal) {
      newData.legalType = item.value;
    } else {
      newData.emojiType = item.value;
    }
    newData.currencyMenuOpen = false;
    setNewTransactionData(newData);
  }

  /**
   * Set the {@link newTransactionData} state to toggle whether or not the dropdown menu is open
   */
  function toggleOpen() {
    const newData = {...newTransactionData};
    newData.currencyMenuOpen = !newTransactionData.currencyMenuOpen;
    Keyboard.dismiss();
    setNewTransactionData(newData);
  }


  /**
   * Parent component that acts as a wrapper for dropdown items
   */
  function DropDownItem(props) {
    return (
      <View 
        style={{
          height: measurements.entryHeight,
          width: measurements.entryHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: -10,
        }}
      >
        {props.children}
      </View>
    )
  }
  
  /**
   * Items to display in the dropdown menu
   * @const
   */
  const items = newTransactionData.currencyLegal ? [
    {value: legalCurrencies.USD, icon: () => (<DropDownItem><Image source={getSource(emojiCurrencies.BEER)} style={{width: measurements.entryHeight - 20, height: measurements.entryHeight - 20}}/></DropDownItem>)},
  ] : [
    {value: emojiCurrencies.BEER, icon: () => (<DropDownItem><Image source={getSource(emojiCurrencies.BEER)} style={{width: measurements.entryHeight - 20, height: measurements.entryHeight - 20}}/></DropDownItem>)},
    {value: emojiCurrencies.COFFEE, icon: () => (<DropDownItem><Image source={getSource(emojiCurrencies.COFFEE)} style={{width: measurements.entryHeight - 20, height: measurements.entryHeight - 20}}/></DropDownItem>)},
    {value: emojiCurrencies.PIZZA, icon: () => (<DropDownItem><Image source={getSource(emojiCurrencies.PIZZA)} style={{width: measurements.entryHeight - 20, height: measurements.entryHeight - 20}}/></DropDownItem>)},
  ]

  return (
    <DropDownPicker
      open={newTransactionData.currencyMenuOpen}
      value={newTransactionData.currencyLegal ? newTransactionData.legalType : newTransactionData.emojiType}
      items={items}
      onPress={toggleOpen}
      onSelectItem={(item) => updateCurrencyType(item)}
      showArrowIcon={false}
      searchable={false}
      containerStyle={{
        width: measurements.entryHeight,
        height: measurements.entryHeight,
      }}
      dropDownContainerStyle={{
        backgroundColor: dark ? darkTheme.textFieldFill : lightTheme.textFieldFill,
        borderColor: dark ? darkTheme.textFieldBorderColor : lightTheme.textFieldBorderColor,
        width: measurements.entryHeight,
      }}
      style={{
        width: measurements.entryHeight,
        height: measurements.entryHeight,
        backgroundColor: dark ? darkTheme.textFieldFill : lightTheme.textFieldFill,
        borderColor: dark ? darkTheme.textFieldBorderColor : lightTheme.textFieldBorderColor,
        borderRadius: 5,
      }}
    />
  );
}

/**
 * A {@link StyledButton} with a cute little arrow glyph to signify that it will open some sort of menu
 * @param {Function} onClick function to be called onClick
 * @param {string} color hex value or color key (ex. "red", "green", "venmo")
 * @param {boolean} disabled whether or not to show this button as disabled
 * @param {string} buttonBorder color for button border
 * @param {boolean} buttonBorderDisabled whether to hide the border or not
 * @param {number} width width of button
 * @param {number} height height of button
 * @param {number} marginTop top margin
 * @param {number} marginBottom bottom margin
 * @param {boolean} selected whether or not to display button as selected 
 * @default
 * marginTop = 10;
 * marginBottom = 0;
 */
export function DropDownButton(props) {

  const { dark } = useContext(DarkContext);

  /**
   * Get the correct border color from props or default to buttonBorder based on DarkContext
   * @returns string for border color
   */
  function getBorderColor() {
    if (props.color) {
      if (props.color === "red" || props.red) {
        return globalColors.red;
      }
      if (props.color === "green") {
        return globalColors.green;
      }
    }
    if (props.disabled) {
      return dark ? darkTheme.buttonBorderDisabled : lightTheme.buttonBorderDisabled;
    }
    if (props.red) {
      return globalColors.red;
    }
    return dark ? darkTheme.buttonBorder : lightTheme.buttonBorder;
  }

  /**
   * Get the correct text color from props or default to textPrimary based on DarkContext
   * @returns string for text color
   */
  function getTextColor() {
    if (props.color) {
      if (props.color === "red") {
        return globalColors.red;
      }
      if (props.color === "green") {
        return globalColors.green;
      }
    }
    if (props.disabled) {
      return dark ? darkTheme.textSecondary : lightTheme.textSecondary;
    }
    if (props.red) {
      return globalColors.red;
    }
    return dark ? darkTheme.textPrimary : lightTheme.textPrimary;
  }

  /**
   * Get the right arrow based on DarkContext
   * @returns image path
   */
  function getArrow() {
    if (props.disabled) {
      return dark ? require("../assets/images/ArrowDownDarkDisabled.png") : require("../assets/images/ArrowDownLightDisabled.png")
    }
    if (props.red) {
      return require("../assets/images/ArrowDownRed.png");
    }
    return dark ? require("../assets/images/ArrowDownDark.png") : require("../assets/images/ArrowDownLight.png")
  }

  return (
    <View 
      style={{ 
        alignSelf: "center",
        height: buttonStyles.dropDownButtonHeight,
        marginLeft: 10,
        marginBottom: props.marginBottom ? props.marginBottom : 0,
        borderRadius: 10,
        backgroundColor: dark ? darkTheme.buttonFill : lightTheme.buttonFill,
        elevation: buttonStyles.buttonElevation
      }}
    >
      <Pressable
        onPress={props.onClick}
        disabled={props.disabled}
        android_ripple={{color: globalColors.greenAlpha}}
        style={{
          height: "100%",
          paddingLeft: 10,
          paddingRight: 10,
          borderRadius: 10,
          borderWidth: buttonStyles.buttonBorderWidth,
          borderColor: getBorderColor(),
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{color: (getTextColor()), fontSize: 20}}>
          {props.text}
        </Text>
        <Image source={getArrow()} style={{marginLeft: 5, height: 20, width: 20}}/>
      </Pressable>
    </View>
  )
}

/**
 * Component for a compact new transaction button
 * @param {Function} onClick function to be called on click
 */
export function NewTransactionPill(props) {
  const { dark } = useContext(DarkContext);
  return (
    <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha, radius: 25}} flexDirection="column" alignItems="center" justifyContent="center" onPress={props.onClick} style={{backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}>
        <Image source={dark ? require("../assets/images/NewTransactionUnselected.png") : require("../assets/images/NewTransactionUnselectedLight.png")} style={{width: 20, height: 20}}/>
    </Pressable>
  )
}

/**
 * Component for a compact settings button
 * @param {Function} onClick function to be called on click
 */
export function SettingsPill(props) {
  const { dark } = useContext(DarkContext);
  return (
    <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha, radius: 25}} flexDirection="column" alignItems="center" justifyContent="center" onPress={props.onClick} style={{backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}>
        <Image source={dark ? require("../assets/images/SettingsDark.png") : require("../assets/images/SettingsLight.png")} style={{width: 20, height: 20}}/>
    </Pressable>
  )
}

/**
 * Component for a compact handoff button
 * @param {Function} onClick function to be called on click
 */
export function HandoffPill(props) {
  const { dark } = useContext(DarkContext);
  return (
    <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha, radius: 25}} flexDirection="column" alignItems="center" justifyContent="center" onPress={props.onClick} style={{backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}>
        <Image source={dark ? require("../assets/images/HandoffDark.png") : require("../assets/images/HandoffLight.png")} style={{width: 20, height: 20}}/>
    </Pressable>
  )
}

/**
 * Component for a compact group+ button
 * @param {Function} onClick function to be called on click
 */
export function GroupAddPill(props) {
  const { dark } = useContext(DarkContext);
  return (
    <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha, radius: 25}} flexDirection="column" alignItems="center" justifyContent="center" onPress={props.onClick} style={{backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}>
        <Image source={dark ? require("../assets/images/GroupAddDark.png") : require("../assets/images/GroupAddLight.png")} style={{width: 20, height: 20}}/>
    </Pressable>
  )
}

/**
 * Component for a compact person+ button
 * @param {Function} onClick function to be called on click
 */
export function PersonAddPill(props) {
  const { dark } = useContext(DarkContext);
  return (
    <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha, radius: 25}} flexDirection="column" alignItems="center" justifyContent="center" onPress={props.onClick} style={{backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}>
        <Image source={dark ? require("../assets/images/PersonAddDark.png") : require("../assets/images/PersonAddLight.png")} style={{width: 20, height: 20}}/>
    </Pressable>
  )
}

/**
 * Component for a compact leave group button
 * @param {Function} onClick function to be called on click
 */
export function LeaveGroupPill(props) {
  const { dark } = useContext(DarkContext);
  return (
    <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha, radius: 25}} flexDirection="column" alignItems="center" justifyContent="center" onPress={props.onClick} style={{backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}>
        <Image source={dark ? require("../assets/images/LeaveDark.png") : require("../assets/images/LeaveLight.png")} style={{width: 20, height: 20}}/>
    </Pressable>
  )
}

/**
 * Component for a compact delete button
 * @param {Function} onClick function to be called on click
 */
export function DeletePill(props) {
  const { dark } = useContext(DarkContext);
  return (
    <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha, radius: 25}} flexDirection="column" alignItems="center" justifyContent="center" onPress={props.onClick} style={{backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}>
        <Image source={dark ? require("../assets/images/TrashDark.png") : require("../assets/images/TrashLight.png")} style={{width: 20, height: 20}}/>
    </Pressable>
  )
}

/**
 * Component for a compact edit button
 * @param {Function} onClick function to be called on click
 */
export function EditPill(props) {
  const { dark } = useContext(DarkContext);
  return (
    <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha, radius: 25}} flexDirection="column" alignItems="center" justifyContent="center" onPress={props.onClick} style={{backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}>
        <Image source={dark ? require("../assets/images/EditDark.png") : require("../assets/images/EditLight.png")} style={{width: 20, height: 20}}/>
    </Pressable>
  )
}

/**
 * Component for a compact group button
 * @param {Function} onClick function to be called on click
 */
export function GroupPill(props) {
  const { dark } = useContext(DarkContext);
  return (
    <Pressable display="flex" android_ripple={{color: globalColors.greenAlpha, radius: 25}} flexDirection="column" alignItems="center" justifyContent="center" onPress={props.onClick} style={{backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), borderRadius: 20, paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: dark ? darkTheme.buttonBorder : lightTheme.buttonBorder}}>
        <Image source={dark ? require("../assets/images/GroupsUnselected.png") : require("../assets/images/GroupsUnselectedLight.png")} style={{width: 20, height: 20}}/>
    </Pressable>
  )
}