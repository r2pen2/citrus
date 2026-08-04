// Library imports
import { useState, useEffect } from "react";
import { Typography, CircularProgress } from "@mui/material";

// API imports
import { SessionManager } from "../../api/sessionManager";
import { DBManager } from "../../api/db/dbManager";
import { AvatarIcon } from "./Avatars";

// Get user manager from LS
const currentUserManager = SessionManager.getCurrentUserManager();

export function HomeFriendsList() {

    const [friendsData, setFriendsData] = useState({
        fetched: false,
        friends: [],
    });

    useEffect(() => {
        async function fetchFriendData() {
            const friendIds = await currentUserManager.getFriends();
            let friendsList = [];
            for (const friendId of friendIds) {
                const friendManager = DBManager.getUserManager(friendId);
                const pfpUrl = await friendManager.getPfpUrl();
                const displayName = await friendManager.getDisplayName();
                friendsList.push({
                    id: friendId,
                    pfpUrl: pfpUrl,
                    displayName: displayName 
                });
            }
            setFriendsData({
                fetched: true,
                friends: friendsList
            });
            setTimeout(() => {
                fetchFriendData();
            }, 1000);
        }

        fetchFriendData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function renderFriendsList() {
        if (friendsData.friends.length > 0) {
            return friendsData.friends.map((friend, index) => {
                return <AvatarIcon key={index} size={80} displayName={friend.displayName} showTooltip={true} src={friend.pfpUrl} />;
            })
        } 
        if (friendsData.fetched) {
            return (
                <div className="d-flex flex-row justify-content-center w-100">
                    <Typography >User has no friends.</Typography>
                </div>
            )
        }
        return (
            <div className="d-flex flex-row justify-content-center w-100">
                <CircularProgress/>
            </div>
        )
    }

    return (
        <div className="d-flex flex-row mh-100 align-items-center gap-10">
            {renderFriendsList()}
        </div>
    )
}