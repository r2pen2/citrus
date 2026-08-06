// API Imports
import { signOutUser } from "./firebase";
import { RouteManager } from "./routeManager";
import { DBManager } from "./db/dbManager";
import { Debugger } from "./debugger";

const sessionManagerDebugger = new Debugger(Debugger.controllerObjects.SESSIONMANAGER);

/**
 * SessionManager is a tool for interfacing with the browser's localStorage.
 * Keeps page data consistent even after a redirect
 * Allows us to limit DB calls
 */
export class SessionManager {

    /**
     * Get user object saved in localStorage
     * @returns user object or null
     */
    static getCurrentUser() {
        return JSON.parse(localStorage.getItem("citrus:currentUser"));
    }

    /**
     * Set user object saved in localStorage
     */
    static setCurrentUser(user) {
        localStorage.setItem("citrus:currentUser", JSON.stringify(user));
    }

    static getCurrentUserGroups() {
        const man = this.getCurrentUserManager();
        return man.data.groups;
    }

    static getCurrentUserFriends() {
        const man = this.getCurrentUserManager();
        return man.data.friends;
    }

    /**
     * Get UserManager for current user
     * @returns UserManager for current user in LocalStorage
     */
    static getCurrentUserManager() {
        const id = this.getUserId(); // Get user ID from LS
        const savedUsers = this.getUserData();
        if (Object.keys(savedUsers).includes(id)) {
            return DBManager.createUserManagerFromLocalStorage(id, savedUsers[id]);
        }
        if (id) {
            return DBManager.getUserManager(id);
        }
        sessionManagerDebugger.logWithPrefix("Couldn't find a current user Id. Redirecting to /login!'");
        return null;
    }

    /**
     * Get user id from user in localstorage
     * @returns user id or null
     */
    static getUserId() {
        const user = JSON.parse(localStorage.getItem("citrus:currentUser"));
        return user ? user.uid : null;
    }

    /**
     * Get profile picture URL saved in localStorage
     * @returns profile picture URL or empty string
     */
    static getPfpUrl() {
        return localStorage.getItem("citrus:currentUser") ? JSON.parse(localStorage.getItem("citrus:currentUser")).photoURL : "";
    }

    /**
     * Get display name saved in localStorage
     * @returns display name or empty string
     */
    static getDisplayName() {
        return localStorage.getItem("citrus:currentUser") ? JSON.parse(localStorage.getItem("citrus:currentUser")).displayName : "";
    }

    /**
     * Get phone number saved in localStorage
     * @returns phone number or empty string
     */
    static getPhoneNumber() {
        return localStorage.getItem("citrus:phoneNumber") ? localStorage.getItem("citrus:phoneNumber") : "";
    }

    /**
     * Set phone number saved in localStorage
     */
    static setPhoneNumber(phoneNumber) {
        localStorage.setItem("citrus:phoneNumber", phoneNumber);
    }

    /**
    * Get debug mode setting saved in localStorage
    * @returns debug mode setting
    */
    static getDebugMode() {
        return JSON.parse(localStorage.getItem("citrus:debug"));
    }

    /**
    * Set debug mode setting saved in localStorage
    */
    static setDebugMode(debugMode) {
        localStorage.setItem("citrus:debug", JSON.stringify(debugMode));
    }

    /**
     * Check whether or not a user is saved in LS
     * @returns whether or not there is a user stored in LS
     */
    static userInLS() {
        return localStorage.getItem("citrus:currentUser") ? true : false;
    }

    /**
     * Checks whether a user is completely signed in based on whether or not they have a display name
     * @returns whether or not the user has completed signin process
     */
    static userFullySignedIn() {
        const user = SessionManager.getCurrentUser();
        if (user) {
            if (user.displayName === null) {
              return false;
            } else {
              return true;
            }
          } else {
            return false;
        }
    }

    /**
     * Clear all citrus related localstorage keys
     */
    static clearLS() {
        localStorage.removeItem("citrus:currentUser");
        localStorage.removeItem("citrus:debug");
        localStorage.removeItem("citrus:pfpUrl");
        localStorage.removeItem("citrus:displayName");
        localStorage.removeItem("citrus:userData");
        localStorage.removeItem("citrus:groupsData"); 
        localStorage.removeItem("citrus:transactionsData"); 
    }

    /**
     * Get a JSON representation of current citrus localStorage.
     * This is for debugging
     * @returns JSON representation of localStorage
     */
    static getJSON() {
        return {
            user: this.getUser(),
            pfpUrl: this.getPfpUrl(),
            displayName: this.getDisplayName(),
            debugMode: this.getDebugMode(),
            userId: this.getUserId(),
            userData: this.getUserData(),
            transactionsData: this.getTransactionsData(),
            groupsData: this.getGroupsData(),
        }
    }

    /**
     * Completely sign out user with firebase and redirect to /home
     */
    static signOut() {
        signOutUser().then(() => {
            RouteManager.redirect("/home");
        });
    }
    
    static getTransactionsData() {
        return localStorage.getItem("citrus:transactionsData") ? JSON.parse(localStorage.getItem("citrus:transactionsData")) : {};
    }
    
    static getGroupsData() {
        return localStorage.getItem("citrus:groupsData") ? JSON.parse(localStorage.getItem("citrus:groupsData")) : {};
    }

    static getUserData() {
        return localStorage.getItem("citrus:userData") ? JSON.parse(localStorage.getItem("citrus:userData")) : {};
    }

    static saveUserData(userManager) {
        // We have to be a little more careful about what kind of user data we're saving to LS becuase users can see everything if they dig :(
        const userId = userManager.documentId;
        const userData = userManager.data;
        const map = this.getUserData();
        if (userId === this.getUserId()) {
            map[userId] = userData;
        } else {
            // This isn't current user, so we should remove some (most) information
            console.log(userData);
            const obfuscatedUserData = {
                personalData: {
                    displayName: userData.personalData.displayName,
                    pfpUrl: userData.personalData.pfpUrl ? userData.personalData.pfpUrl : "https://robohash.org/" + userId,
                }
            }
            map[userId] = obfuscatedUserData;
        }
        const string = JSON.stringify(map);
        localStorage.setItem("citrus:userData", string);
    }

    static saveGroupData(groupManager) {
        const groupId = groupManager.documentId;
        const groupData = groupManager.data;
        const map = this.getGroupsData();
        map[groupId] = groupData;
        const string = JSON.stringify(map);
        localStorage.setItem("citrus:groupsData", string); 
    }

    static getGroupData(groupId) {
        const map = this.getGroupsData();
        return map[groupId] ? map[groupId] : null;
    }

    static saveTransactionData(transactionManager) {
        const transactionId = transactionManager.documentId;
        const transactionData = transactionManager.data;
        const map = this.getTransactionsData();
        map[transactionId] = transactionData;
        const string = JSON.stringify(map);
        localStorage.setItem("citrus:transactionsData", string); 
    }

    static getTransactionData(transactionId) {
        const map = this.getTransactionsData();
        return map[transactionId] ? map[transactionId] : null;
    }

    static getSavedUser(id) {
        return Object.keys(this.getUserData()).includes(id) ? this.getUserData()[id] : null;
    }

    static getSavedGroup(id) {
        return Object.keys(this.getGroupsData()).includes(id) ? this.getGroupsData()[id] : null;
    }

    static getSavedTransaction(id) {
        return Object.keys(this.getTransactionsData()).includes(id) ? this.getTransactionsData()[id] : null;
    }
}