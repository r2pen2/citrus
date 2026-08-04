// Library imports
import { Stack, TextField, Typography, Box, Button } from "@mui/material";
import { useState } from 'react';

// API Imports
import { SessionManager } from "../../../api/sessionManager";
import { RouteManager } from "../../../api/routeManager";

// A set of welcome messages to be displayed on the account creation page
// Please feel free to edit these lol
const helloMessages = [
  {
    header: "Hi, there!",
    sub: "I'm not sure we know each other."
  },
  {
    header: "I'm not sure I recognize you.",
    sub: "Let's get you set up with an account!"
  },
  {
    header: "Welcome to the Citrus family!",
    sub: "Let's get you set up with an account."
  },
  {
    header: "Thank's for choosing Citrus!",
    sub: "You're gonna love it."
  },
  {
    header: "Hello? Is there anybody in there?",
    sub: "Just nod if you can hear me."
  },
  {
    header: "All my live I've been waiting for someone like you.",
    sub: "Come on in!"
  },
  {
    header: "And well I, I won't go down by myself",
    sub: "But I'll go down with my friends, yeah!"
  }
]

// Set the hello message to a random one from the array above
// This has to be kept outside of the main function to stop it from changing every time
// the page state is updated for any reason
const helloMsg = helloMessages[Math.floor(Math.random()*helloMessages.length)]

// Get user data from localStorage (if it exists, that is)
const currentUserManager = SessionManager.getCurrentUserManager();

/**
 * Form for new users to create their accounts
 */
export default function NewUserForm() {

  // Define constants
  const [firstName, setFirstName] = useState("");                         // The current user's first name (for account creation)
  const [lastName, setLastName] = useState("");                           // The current user's last name (for account creation)'
  const [submitEnable, setSubmitEnable] = useState(false);                // Whether or not the submit button is enabled

  /**
   * Renders a message at the top of the screen welcoming new users
   * @returns {Component} HTML representing the welcome message
   */
  function renderHelloMessage() {
    return (
      <div data-testid="new-user-message">
        <Typography variant="h5" component="div" align="center" sx={{ flexGrow: 1 }}>
          {helloMsg.header}
        </Typography>
        <Typography variant="subtitle2" component="div" align="center" paddingTop="5px" paddingBottom="10px" sx={{ flexGrow: 1, color: "gray" }}>
          {helloMsg.sub}
        </Typography>
      </div>
    )
  }

  /**
   * Enables the submit button if passwords are valid
   * Otherwise sets submit button opacity based on the number of failures
   */
  function enableSubmit() {
    if ((firstName.length > 0) && (lastName.length > 0)) {
      setSubmitEnable(true)
    } else {
      setSubmitEnable(false)
    }
  }

  /**
   * Submits new user data to server for account creation
   */
  function handleSubmit() {
    currentUserManager.setDisplayName(firstName + " " + lastName);
    currentUserManager.push().then(() => {
      // Apply changes to UserManager in localstorage and redirect to dashboard
      RouteManager.redirect("/dashboard");
    })
  }

  /**
   * Handle enter keypress in new user creation textfield. Submit new user if inputs are valid.
   * @param {Event} e the event that triggered this function
   */
  function handleEnter(e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default action of enter keypress
      if (submitEnable) {
        handleSubmit();
      }
    }
  }

  return (
      <Stack component="form" sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }} noValidate autoComplete="off" alignItems="center" display="flex" justifyContent="center" data-testid="new-user-form-wrapper">
        { renderHelloMessage() }
        <Box>
          <TextField autoFocus required id="first-name" label="First Name" onChange={e => setFirstName(e.target.value)} onKeyUp={enableSubmit} onBlur={enableSubmit} data-testid="first-name-input" onKeyDown={(e) => handleEnter(e)}/>
          <TextField required id="last-name" label="Last Name" onChange={e => setLastName(e.target.value)} onKeyUp={enableSubmit} onBlur={enableSubmit} data-testid="last-name-input" onKeyDown={(e) => handleEnter(e)}/>
        </Box>
        <Button variant="contained" component="div" onClick={() => handleSubmit()} disabled={!submitEnable} data-testid="submit-button">
          Create my Account!
        </Button>
      </Stack>
  );
}