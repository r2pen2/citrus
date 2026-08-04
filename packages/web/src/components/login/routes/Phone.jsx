// Library imports
import * as React from 'react';
import { useState } from 'react';
import MuiPhoneNumber from 'material-ui-phone-number';
import { Typography, Button, Stack } from "@mui/material";
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '../../../api/firebase';

// Component imports
import AuthCodeInput from './AuthCodeInput';

// API imports
import { Debugger } from "../../../api/debugger";

/**
 * Removes all special characters from phone number string and adds leading "+"
 * @param {String} num number string to be formatted
 * @returns formatted phone string to be used in DB
 */
function formatPhoneNumber(num) {
    return "+" + num.replace(/\D/g, '');
}

/**
 * Page for users to sign in with their phone number
 */
export default function Phone() {

    // Define constants
    const [submitEnable, setSubmitEnable] = useState(true);                         // Whether or not the submit button is enabled
    const [phoneNumber, setPhoneNumber] = useState("");                             // Current value of the phone number textfield
    const [confirmationResult, setConfirmationResult] = useState();                 // Firebase confirmation

    /**
     * Updates state to reflext phone input value
     * @param {String} value phone string value from input box
     */
    function handleOnChange(value) {
        setPhoneNumber(formatPhoneNumber(value));
    }

    /**
     * Decides if a phone number is valid
     * @param {String} num 
     * @returns {Boolean} whether or not the phone number is valid
     */
    function numberValid(num) {
        return num.length === 12;
    }

    function generateRecapcha() {
        Debugger.log(auth)
        window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
          }, auth);
    }

    /**
     * Asks the server to send an authentication code to the inputted phone number
     * @param {String} num phone number to send auth code to
     */
    function textMe(num) {

        // First, generate captcha
        generateRecapcha();
        let appVerifier = window.recaptchaVerifier;
        signInWithPhoneNumber(auth, num, appVerifier).then((res) => {
            setConfirmationResult(res);
        }).catch((error) => {
            Debugger.log(error);
        });
    }

    /**
     * Handles enter keypress in textfields. Sends verification
     * code if number is valid.
     * @param {Event} e event that triggered function
     */
    function handleEnter(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            textMe(phoneNumber)
        }
    }

    /**
     * Enables submit button if phone number is valid
     */
    function enableSubmit() {
        setSubmitEnable(numberValid(phoneNumber));
    }

    if (confirmationResult) {
        return <AuthCodeInput phoneNumber={phoneNumber} confirmationResult={confirmationResult} resendCode={textMe}/>;
    } else {
        return (
            <div data-testid="phone-input-container" className="phone-page-wrapper">  
                <Typography variant="h5" component="div" align="center" sx={{ flexGrow: 1 }}>
                    Enter your phone number:
                </Typography>
                <div className="phone-input-container">
                    <MuiPhoneNumber autoFocus defaultCountry={'us'} onChange={handleOnChange} onKeyDown={(e) => {handleEnter(e)}} onKeyUp={enableSubmit} onBlur={enableSubmit} data-testid="mui-phone-input"/>
                </div>
                <div className="login-next-button-container">
                    <Stack direction="column">
                        <Button variant="contained" component="div" onClick={() => textMe(phoneNumber)} disabled={!submitEnable} data-testid="text-me-button">Text Me</Button>
                    </Stack>
                </div>
            </div>
        );
    }
}
