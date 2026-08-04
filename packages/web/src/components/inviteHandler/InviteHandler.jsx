// Library Imports
import {useState, useEffect} from 'react'
import { CircularProgress } from '@mui/material';

// API Imports
import { DBManager } from '../../api/db/dbManager';
import { InviteType } from '../../api/db/objectManagers/invitationManager';
import { RouteManager } from '../../api/routeManager';
import { SessionManager } from '../../api/sessionManager';

// Get user manager from LS
const currentUserManager = SessionManager.getCurrentUserManager();

export default function InviteHandler() {


    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("id");
    const inviteType = params.get("type");
    const inviteMethod = params.get("method"); // TODO: take note of inviteMethod in DB

    useEffect(() => {
        async function applyInvite() {
            let redirectUri = null;
            let targetManager = null;
            if (inviteType === InviteType.types.FRIEND) {
                currentUserManager.addFriend(targetId);
                targetManager = DBManager.getUserManager(targetId);
                targetManager.addFriend(SessionManager.getUserId());
                redirectUri = `/dashboard/friends?id=${targetId}`;
            } else if (inviteType === InviteType.types.GROUP) {
                currentUserManager.addGroup(targetId);
                targetManager = DBManager.getGroupManager(targetId);
                targetManager.addUser(SessionManager.getUserId());
                redirectUri = `/dashboard/groups?id=${targetId}`;
            }
            await currentUserManager.push();
            await targetManager.push();
            // Assuming all went well, we redirect the user
            RouteManager.redirect(redirectUri);
        }

        applyInvite();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div>
            <CircularProgress />
        </div>
    )
}
