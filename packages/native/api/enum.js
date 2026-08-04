/**
 * Enum for legal currency types
 * @example
 * legalCurrencies.USD = "USD";
 * @readonly
 * @enum {string}
 */
export const legalCurrencies = {
    USD: "USD",
}

/**
 * Enum for emoji currency types
 * @example
 * emojiCurrencies.BEER = "beer";
 * emojiCurrencies.COFFEE = "coffee";
 * emojiCurrencies.PIZZA = "pizza";
 * @readonly
 * @enum {string}
 */
export const emojiCurrencies = {
    BEER: "beer",
    COFFEE: "coffee",
    PIZZA: "pizza",
}

/**
 * Enum for notification types
 * @example
 * notificationTypes.INCOMINGFRIENDREQUEST = "incomingFriendRequest";
 * notificationTypes.FRIENDREQUESTACCEPTED = "friendRequestAccepted";
 * notificationTypes.INCOMINGGROUPINVITE = "incomingGroupInvite";
 * @readonly
 * @enum {string}
 */
export const notificationTypes = {
    INCOMINGFRIENDREQUEST: "incomingFriendRequest",
    FRIENDREQUESTACCEPTED: "friendRequestAccepted",
    INCOMINGGROUPINVITE: "incomingGroupInvite",
    USERJOINEDGROUP: "userJoinedGroup",
    USERLEFTGROUP: "userLeftGroup",
    NEWTRANSACTION: "newTransaction",
    TRANSACTIONDELETED: "transactionDeleted",
}