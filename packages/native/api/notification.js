// API Imports
import { notificationTypes } from "./enum";

// Style Imports
import { globalColors } from "../assets/styles";

/**
 * @class Class for creating notifications of all types
 * @static
 */
export class NotificationFactory {
    /**
     * Create a notification object representing a new friend invitation
     * @static method belonging to {@link NotificationFactory}
     * @param {string} displayName displayName of user sending friend request 
     * @param {string} userId ID of user sending friend request 
     * @returns friend invitation notification
     */
    static createFriendInvitation(displayName, userId) {
        return {
            type: notificationTypes.INCOMINGFRIENDREQUEST,
            message: `${displayName} sent a friend request`,
            target: userId,
            color: globalColors.green,
            seen: false,
            currencyType: null,
            currencyLegal: null,
            value: null,
        }
    }

    /**
     * Create a notification object representing a new accepted friend request
     * @static method belonging to {@link NotificationFactory}
     * @param {string} displayName displayName of user that accepted friend request 
     * @param {string} userId ID of user that accepted friend request 
     * @returns friend accepted notification
     */
    static createFriendRequestAccepted(displayName, userId) {
        return {
            type: notificationTypes.FRIENDREQUESTACCEPTED,
            message: `${displayName} accepted your friend request`,
            target: userId,
            color: globalColors.green,
            seen: false,
            currencyType: null,
            currencyLegal: null,
            value: null,
        }
    }

    /**
     * Create a notification object representing a new group invitation
     * @static method belonging to {@link NotificationFactory}
     * @param {string} groupName name of group that user has been invited to 
     * @param {string} groupId ID of group that user has been invited to 
     * @param {string} senderID ID of user that sent the group invitation
     * @returns group invitation notification
     */
    static createIncomingGroupInvite(groupName, groupId, senderId) {
        return {
            type: notificationTypes.INCOMINGGROUPINVITE,
            message: `You've been invited to join the group "${groupName}"`,
            target: groupId,
            color: globalColors.green,
            seen: false,
            currencyType: null,
            currencyLegal: null,
            value: senderId,
        }
    }

    /**
     * Create a notification object for when a user joins one of your groups
     * @static method belonging to {@link NotificationFactory}
     * @param {string} displayName displayName of user that joined group 
     * @param {string} groupName name of group that user joined
     * @param {string} groupID ID of group that user joined
     * @returns user joined group notification
     */
    static createUserJoinedGroup(displayName, groupName, groupId) {
        return {
            type: notificationTypes.USERJOINEDGROUP,
            message: `${displayName} joined the group "${groupName}"`,
            target: groupId,
            color: globalColors.green,
            seen: false,
            currencyType: null,
            currencyLegal: null,
            value: null,
        }
    }

    /**
     * Create a notification object for when a user leaves one of your groups
     * @static method belonging to {@link NotificationFactory}
     * @param {string} displayName displayName of user that left group 
     * @param {string} groupName name of group that user left
     * @param {string} groupID ID of group that user left
     * @returns user left group notification
     */
    static createUserLeftGroup(displayName, groupName, groupId) {
        return {
            type: notificationTypes.USERLEFTGROUP,
            message: `${displayName} left the group "${groupName}"`,
            target: groupId,
            color: globalColors.red,
            seen: false,
            currencyType: null,
            currencyLegal: null,
            value: null,
        }
    }

    /**
     * Create a notification object for when someone creates a new transaction with you in it
     * @static method belonging to {@link NotificationFactory}
     * @param {string} displayName displayName of user that created the transaction
     * @param {string} transactionName name of the new transaction
     * @param {string} transactionId ID of the new transaction
     * @param {number} transactionAmount value of the new transaction (for determining color)
     * @param {Enumerator} transactionCurrencyType currency type enum
     * @param {boolean} transactionCurrencyLegal whether or not legal currency was used in new transaction
     * @returns new transaction notification
     */
    static createNewTransaction(displayName, transactionName, transactionId, transactionAmount, transactionCurrencyType, transactionCurrencyLegal) {
        return {
            type: notificationTypes.NEWTRANSACTION,
            message: `${displayName} added "${transactionName}"`,
            target: transactionId,
            color: transactionAmount > 0 ? globalColors.green : globalColors.red,
            seen: false,
            currencyType: transactionCurrencyType,
            currencyLegal: transactionCurrencyLegal,
            value: transactionAmount,
        }
    }

    /**
     * Create a notification object for when someone deletes a new transaction with you in it
     * @static method belonging to {@link NotificationFactory}
     * @param {string} displayName displayName of user that deleted the transaction
     * @param {string} transactionName name of the deleted transaction
     * @param {number} transactionAmount value of the deleted transaction (for determining color)
     * @param {Enumerator} transactionCurrencyType currency type enum
     * @param {boolean} transactionCurrencyLegal whether or not legal currency was used in deleted transaction
     * @returns deleted transaction notification
     */
    static createTranscationDeleted(displayName, transactionName, transactionAmount, transactionCurrencyType, transactionCurrencyLegal) {
        return {
            type: notificationTypes.TRANSACTIONDELETED,
            message: `${displayName} deleted "${transactionName}"`,
            target: null,
            color: transactionAmount > 0 ? globalColors.red : globalColors.green,
            seen: false,
            currencyType: transactionCurrencyType,
            currencyLegal: transactionCurrencyLegal,
            value: transactionAmount,
        }
    }
}