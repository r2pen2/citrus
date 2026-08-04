import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import MessageIcon from '@mui/icons-material/Message';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import AlarmIcon from '@mui/icons-material/Alarm';
import { getPfpUrlById, getDisplayNameById } from './dbManager';
import { Avatar } from '@mui/material';

/**
 * Parse a notification into a human-readable string
 * @param {Object} notification notification object
 * @returns string representation of notification
 */
export function getNotificationString(notification) {

    function getFriendInviteString() {
        return "New friend request from " + notification.user.name + ".";
    }

    function getFriendAcceptString() {
        return notification.user.name + " accepted your friend request.";
    }

    function getNudgeString() {
        return notification.user.name + " nudged you about a transaction.";
    }

    function getPaidString() {
        return notification.user.name + " paid you " + notification.transcation.amount + " for " + notification.transcation.title + ".";
    }

    function getRequestedString() {
        return notification.user.name + " requested " + notification.transcation.amount + " for " + notification.transcation.title + ".";
    }

    function getGroupInviteString() {
        return 'You were invited to join the group "' + notification.group.name + '".';
    }

    function getGroupJoinString() {
        return notification.user.name + ' joined "' + notification.group.name + '".';
    }

    function getGroupLeaveString() {
        return notification.user.name + ' left "' + notification.group.name + '".';
    }

    function getTransactionMessageString() {
        return notification.user.name + ' sent a message about the transcation "' + notification.transcation.title + '".';
    }

    function getTransactionDisputeString() {
        return notification.user.name + ' is disputing the transaction "' + notification.transcation.title + '".';
    }

    switch (notification.type) {
        case "friend-invite":
            return getFriendInviteString();
        case "friend-accept":
            return getFriendAcceptString();
        case "nudge":
            return getNudgeString();
        case "paid":
            return getPaidString();
        case "requested":
            return getRequestedString();
        case "group-invite":
            return getGroupInviteString();
        case "group-join":
            return getGroupJoinString();
        case "group-leave":
            return getGroupLeaveString();
        case "transaction-message":
            return getTransactionMessageString();
        case "transaction-dispute":
            return getTransactionDisputeString();
        default:
            return "Error: invalid notification type!";
    }
}

/**
 * Returns an icon for a given notification
 * @param {Object} notification notification object
 * @returns component to be used as icon for notification
 */
export function getNotificationIcon(notification) {

    const iconSize = "medium";

    function getErrorIcon() {
        return (
            <div className="notification-icon error">
                <ErrorOutlineIcon fontSize={iconSize} />
            </div>
        )
    }
    
    function getDisputeIcon() {
        return (
            <div className="notification-icon dispute">
                <SportsMmaIcon fontSize={iconSize} />
            </div>
        )
    }

    function getMessageIcon() {
        return (
            <div className="notification-icon message">
                <MessageIcon fontSize={iconSize} />
            </div>
        )
    }

    function getGroupIcon() {
        return (
            <div className="notification-icon group">
                <GroupsIcon fontSize={iconSize} />
            </div>
        )
    }

    function getMoneyIcon() {
        return (
            <div className="notification-icon money">
                <LocalAtmIcon fontSize={iconSize} />
            </div>
        )
    }

    function getPokeIcon() {
        return (
            <div className="notification-icon poke">
                <AlarmIcon fontSize={iconSize} />
            </div>
        )
    }

    function getFriendIcon() {
        return (
            <div className="notification-icon friend">
                <Avatar src={notification.user.pfpUrl} alt={notification.user.name} />
            </div>
        )
    }

    switch (notification.type) {
        case "friend-invite":
        case "friend-accept":
            return getFriendIcon();
        case "nudge":
            return getPokeIcon();
        case "paid":
        case "requested":
            return getMoneyIcon();
        case "group-invite":
        case "group-join":
        case "group-leave":
            return getGroupIcon();
        case "transaction-message":
            return getMessageIcon();
        case "transaction-dispute":
            return getDisputeIcon();
        default:
            return getErrorIcon();
    }
}