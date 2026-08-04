// Library Imports
import { useContext } from "react";
import { Image, TextInput, View, } from "react-native";

// Context Imports
import { DarkContext } from "../Context";

// Style Imports
import { darkTheme, lightTheme, measurements, textStyles, } from "../assets/styles";

/**
 * General text entry component for CitrusNative
 * @param {Function} onChange function to be called when text is changes 
 * @param {number} marginLeft left margin
 * @param {number} marginRight right margin
 * @param {number} marginTop top margin
 * @param {number} marginBottom bottom margin
 * @param {number} height entry box height
 */
export function Entry(props) {
    
    const { dark } = useContext(DarkContext);

    return (
      <View 
        display="flex" 
        flexDirection="row" 
        alignItems="center" 
        style={{
          backgroundColor: (dark ? darkTheme.textFieldFill : lightTheme.textFieldFill), 
          width: props.width ? props.width : "100%", 
          borderBottomColor: dark ? darkTheme.textFieldBorderColor : lightTheme.textFieldBorderColor,
          borderBottomWidth: 1,
          height: props.height ? props.height : measurements.entryHeight, 
          borderRadius: 10,
          elevation: 2,
          marginTop: props.marginTop ? props.marginTop : 0,
          marginBottom: props.marginBottom ? props.marginBottom : 0,
          marginLeft: props.marginLeft ? props.marginLeft : 0,
          marginRight: props.marginRight ? props.marginRight : 0,
        }}
      >
        <TextInput 
          placeholder={props.placeholderText ? props.placeholderText : ""}
          placeholderTextColor={dark ? darkTheme.textSecondary : lightTheme.textSecondary}
          onChangeText={props.onChange}
          onBlur={props.onBlur}
          inputMode={props.numeric ? "decimal" : "text"}
          keyboardType={props.numeric ? "numeric" : "default"}
          value={props.value ? props.value : ""}
          style={{
            textAlign: "center",
            color: dark ? darkTheme.textPrimary : lightTheme.textPrimary, 
            width: "100%",
            fontSize: textStyles.entryFontSize
          }}
        />
      </View>
    )
}

/**
 * General search bar component for CitrusNative
 * @private
 * @param {boolean} halfWidth display search bar at 50% width? 
 * @param {boolean} fullWidth display search bar at 50% width? 
 * @param {Function} setSearch function to be called on text change
 * @param {Function} onEnter function to be called on enter key press
 * @param {string} placeholder placeholder text
 * @default
 * width = "80%";
 * placeholder = "Search";
 */
function SearchBar(props) {
    
    const { dark } = useContext(DarkContext);
    
    return (
      <View 
        display="flex" 
        flexDirection="row" 
        alignItems="center" 
        style={{
            backgroundColor: (dark ? darkTheme.searchFill : lightTheme.searchFill), 
            width: props.fullWidth ? "100%" : (props.halfWidth ? "50%" : "80%"), 
            height: 40,
            borderRadius: 100,
            elevation: 5
        }}
      >
        <Image source={dark ? require("../assets/images/SearchIcon.png") : require("../assets/images/SearchIconLight.png")} style={{height: 32, width: 32, marginLeft: 10}} />
        <TextInput 
          placeholder={props.placeholder ? props.placeholder : "Search"}
          placeholderTextColor={dark ? "#FCFCFC" : "#0A1930"}
          onChangeText={props.setSearch}
          onSubmitEditing={props.onEnter}
          style={{
            marginLeft: 10, 
            color: dark ? "#FCFCFC" : "#0A1930", 
            width: "100%"
          }}
        />
      </View>
    )
}

/**
 * Full width CitrusNative search bar component
 * @param {Function} setSearch function to be called on text change
 * @param {Function} onEnter function to be called on enter key press
 * @param {string} placeholder placeholder text
 * @default
 * placeholder = "Search";
 */
export function SearchBarFull(props) {
    return <SearchBar setSearch={props.setSearch} onEnter={props.onEnter} placeholder={props.placeholder} fullWidth={true} />
}

/**
 * Half width CitrusNative search bar component
 * @param {Function} setSearch function to be called on text change
 * @param {Function} onEnter function to be called on enter key press
 * @param {string} placeholder placeholder text
 * @default
 * placeholder = "Search";
 */
export function SearchBarHalf(props) {
    return <SearchBar setSearch={props.setSearch} onEnter={props.onEnter} placeholder={props.placeholder} halfWidth={true} />
}

/**
 * 80% width CitrusNative search bar component
 * @param {Function} setSearch function to be called on text change
 * @param {Function} onEnter function to be called on enter key press
 * @param {string} placeholder placeholder text
 * @default
 * placeholder = "Search";
 */
export function SearchBarShort(props) {
    return <SearchBar setSearch={props.setSearch} onEnter={props.onEnter} placeholder={props.placeholder}/>
}