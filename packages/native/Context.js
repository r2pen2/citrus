// Library Imports
import { createContext } from "react";

/**
 * @type {React.Context<Map<string, Object>>}
 * @static Passes a map of user data to the entire application
 * @listens FirestoreUpdate to any userId in {@link ListenedUsersContext}
 */
export const UsersContext = createContext();

/**
 * @type {React.Context<Map<string, Object>>}
 * @static Passes a map of group data to the entire application
 * @listens FirestoreUpdate to any groupId in {@link ListenedGroupsContext}
 */
export const GroupsContext = createContext();

/**
 * @type {React.Context<Map<string, Object>>}
 * @static Passes a map of transaction data to the entire application
 * @listens FirestoreUpdate to any transactionId in {@link ListenedTransactionsContext}
 */
export const TransactionsContext = createContext();

/**
 * @type {React.Context<boolean>}
 * @static Tells the entire application whether or not we're in darkmode
 */
export const DarkContext = createContext();

/**
 * @type {React.Context<UserManager>}
 * @static Provides the current UserManager to the entire application
 * @listens FirestoreUpdate to the current user's document
 */
export const CurrentUserContext = createContext();

/**
 * @type {React.Context<Map<string, Object>>}
 * @static Tells the entire application the state of the new transction page
 * so that any page may start a transcation with whatever data it wants
 */
export const NewTransactionContext = createContext();

/**
 * @type {React.Context<Map<string, string>>}
 * @static Tells the entire application which group, user, and transcation
 * are currently focused so that, when a detail page is visited, the focused
 * object is displayed.
 */
export const FocusContext = createContext();

/**
 * @type {React.Context<Function>}
 * @static Tells the entire application how to stop listening to the {@link CurrentUserContext}.
 * Creating this context solved a nightmare problem where, after signing in as another user, any
 * updates to the previously signed-in user's document would hijack the {@link CurrentUserContext}
 * and sign you in as the old person lol. Only used in the TopBar to sign out the current user.
 */
export const UnsubscribeCurrentUserContext = createContext();

/**
 * @type {React.Context<List<string>>}
 * @static Tells the entire application which user documents are currently being listened to
 */
export const ListenedUsersContext = createContext();

/**
 * @type {React.Context<List<string>>}
 * @static Tells the entire application which group documents are currently being listened to
 */
export const ListenedGroupsContext = createContext();

/**
 * @type {React.Context<List<string>>}
 * @static Tells the entire application which transaction documents are currently being listened to
 */
export const ListenedTransactionsContext = createContext();