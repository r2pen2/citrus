// Library imports
import { Typography, TextField, Avatar, Button, IconButton } from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useState, useEffect } from 'react'

// API imports
import { SessionManager } from "../../api/sessionManager";

// Create UserManager
const currentUserManager = SessionManager.getCurrentUserManager();

/**
 * Settings page account tab
 */
export function AccountTab() {

    const [userDetails, setUserDetails] = useState({
        displayName: SessionManager.getDisplayName(),
        photoUrl: SessionManager.getPfpUrl(),
        phoneNumber: SessionManager.getPhoneNumber(),
        initials: ""
    });

    // Fetch user details on mount
    useEffect(() => {
         /**
        * Get user details from DB and replace blank values
        */
        async function fetchUserDetails() {
            const name = await currentUserManager.getDisplayName();
            const number = await currentUserManager.getPhoneNumber();
            const photo = await currentUserManager.getPfpUrl();
            const initials = await currentUserManager.getInitials();
            setUserDetails({
                displayName: name ? name : "",
                phoneNumber: number ? number : "",
                photoUrl: photo ? photo : "",
                initials: initials ? initials : "",
            });
        }

        fetchUserDetails();
    }, [])

    return (
    <div className="d-flex flex-column w-100 align-items-center gap-10">
        <Typography variant="h5" className="page-title">
            Account Settings ❯
        </Typography>
        <div className="avatar-container">
            <div className="col"></div>
            <IconButton className="col avatar-button" aria-label="account of current user" data-testid="settings-avatar">
                <Avatar src={userDetails.photoUrl} className="avatar" alt={userDetails.displayName} size="large">
                    <Typography variant="h3">
                        {userDetails.initials}
                    </Typography>
                </Avatar>
            </IconButton>
            <div className="col edit-pfp">
                <Button className="upload-button" variant="outlined" color="primary">
                    <CloudUploadIcon/>
                </Button>
            </div>
        </div>
        <div className="d-flex flex-column align-items-center w-75 gap-10">
            <div className="d-flex w-100 justify-content-center">
                <TextField className="w-100" id="display-name" label="Display Name" data-testid="display-name-input" value={userDetails.displayName}/>
            </div>
            <div className="d-flex w-100 justify-content-center">
                <TextField className="w-100" id="phone-number" label="Phone Number" data-testid="phone-number-input" value={userDetails.phoneNumber}/>
            </div>
            <div className="d-flex w-100 justify-content-center">
                <TextField className="w-100" id="address" label="Address" data-testid="address-input" value="1600 Pennsylvania Avenue NW"/>
            </div>
            <div className="d-flex w-100 justify-content-center gap-10">
                <div className="left">
                    <TextField className="w-100" id="city" label="City" data-testid="city-input" value="Washington, DC"/>
                </div>
                <div className="right">
                    <TextField className="w-100" id="state" label="State" data-testid="state-input" value="District of Columbia"/>
                </div>
            </div>
            <div className="d-flex w-100 justify-content-center gap-10">
                <div className="left">
                    <TextField className="w-100" id="zip-code" label="Zip Code" data-testid="zip-code-input" value="20500"/>
                </div>
                <div className="right">
                    <TextField className="w-100" id="country" label="Country" data-testid="country-input" value="United States"/>
                </div>
            </div>
            <div className="save-button">
                <Button type="submit-button" variant="contained">Save</Button>
            </div>
        </div>
    </div>
  )
}
