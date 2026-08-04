// Library Imports
import { LinearGradient, } from "expo-linear-gradient";
import { useContext, useRef, } from "react";
import { Pressable, } from "react-native";
import Swipeable from 'react-native-gesture-handler/Swipeable';

// Context Imports
import { DarkContext } from "../Context";

// API Imports
import { cardStyles, darkTheme, globalColors, lightTheme } from "../assets/styles";

/**
 * Component for rendering an elevated surface with linear gradient border
 * @param {boolean} selected whether or not to display card as selected
 * @param {Function} onClick function to be called on card click
 * @param {boolean} disabled whether or not to display card as disabled
 * @param {string} gradient gradient key for border ("white", "red", or "green")
 * @param {React.Component} leftSwipeComponent component to render under card on left swipe
 * @param {React.Component} rightSwipeComponent component to render under card on right swipe
 * @param {Function} onLeftSwipe function to call on left swipe
 * @param {Function} onRightSwipe function to call on right swipe
 */
export function GradientCard(props) {

  // Get context
  const { dark } = useContext(DarkContext);

  /**
   * Get the correct gradient stops given card props
   * @returns array of string for gradient stops
   */
  function getGradientColors() {
    if (props.selected) {
      return globalColors.selectedGradient;
    }
    if (props.disabled) {
      return globalColors.disabledGradient;
    }
    if (props.gradient === "white" || !props.gradient) {
      return globalColors.whiteGradient;
    }
    if (props.gradient === "red" || props.gradient === globalColors.red) {
      return globalColors.redGradient;
    }
    if (props.gradient === "green" || props.gradient === globalColors.green) {
      return globalColors.greenGradient;
    }
  }

  /**
   * Render the view component inside of the LinearGradient that makes up the border
   */
  function renderView() {
    if (!props.selected) {
      return (
        <Pressable
          display="flex"
          onPress={props.onClick}
          android_ripple={props.onClick ? {color: globalColors.greenAlpha} : {}}
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between" 
          style={{
            borderRadius: cardStyles.cardBorderRadius, 
            width: '100%', 
            padding: 16, 
            height: "100%", 
            backgroundColor: dark ? darkTheme.cardFill : lightTheme.cardFill,
          }}
        >
          { props.children }
        </Pressable>
      )
    } else {
      return (
        <LinearGradient 
          start={[0, 0.5]}
          end={[1, 0.5]}
          colors={dark ? darkTheme.selectedFill : lightTheme.selectedFill}
          style={{
              borderRadius:  cardStyles.cardInnerBorderRadius, 
              width: '100%', 
              height: "100%", 
          }}
        >
          <Pressable 
            onPress={props.onClick} 
            android_ripple={props.onClick ? {color: globalColors.greenAlpha} : {}} 
            style={{
              display: 'flex', 
              flexDirection: "row", 
              padding: 16, 
              justifyContent: "space-between",
              alignItems: "center", 
              overflow: "hidden",
            }}
          >
            { props.children }
          </Pressable>
        </LinearGradient>     
      );
    }
  }
    
  // Create a ref to the swipeable so that we can use it in functions
  const swipeableRef = useRef(null);
   
  /**
   * Render any leftSwipeComponent under the card
   * @param {number} progress swipe progress 
   * @param {number} dragX horizontal displacement
   */
  function renderLeftActions(progress, dragX) {
    // Guard clauses:
    if (!props.leftSwipeComponent) { return; } // No component to render

    const trans = dragX.interpolate({
      inputRange: [0, 50, 100, 101],
      outputRange: [-20, 0, 0, 1],
    });
    return props.leftSwipeComponent;
  }   

  /**
   * Render any rightSwipeComponent under the card
   * @param {number} progress swipe progress 
   * @param {number} dragX horizontal displacement
   */
  function renderRightActions(progress, dragX) {
    // Guard clauses:
    if (!props.rightSwipeComponent) { return; } // No component to render
    
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100, 101],
      outputRange: [-20, 0, 0, 1],
    });
    return props.rightSwipeComponent;
  }   

  /**
   * Call the correct onSwipe function for the direction
   * @param {string} direction direction of swipe 
   */
  function handleSwipeOpen(direction) {
    if (direction === "left") {
      if (props.onLeftSwipe) {
        swipeableRef.current.close();
        props.onLeftSwipe();
      }
    }
    if (direction === "right") {
      if (props.onRightSwipe) {
          swipeableRef.current.close();
          props.onRightSwipe();
      }
    }
  }

  // Wrap the card in a Swipeable and render contents
  return (
    <Swipeable 
      ref={swipeableRef}
      containerStyle={{
          opacity: props.disabled ? 0.5 : 1, 
          flex: 1
      }}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={handleSwipeOpen}
    >
      <LinearGradient 
        start={props.selected ? [0, 0] : [0, 0.5]}
        end={props.selected ? [1, 1] : [0.3, 0.5]}
        colors={getGradientColors()}
        style={{
            maxWidth: props.width ? props.width: '100%',
            borderRadius:  cardStyles.cardBorderRadius, 
            height: "100%", 
            marginBottom: cardStyles.cardMarginBottom, 
            elevation: cardStyles.cardElevation,
            flex: 1,
            padding: 1,
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
        }}
      >
        { renderView() }
      </LinearGradient>
    </Swipeable>
  )
}