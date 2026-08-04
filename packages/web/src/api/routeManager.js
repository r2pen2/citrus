// API Imports
import { Debugger } from "./debugger";
import { SessionManager } from "./sessionManager";
import { BrowserManager } from "./browserManager";

// Init debugger with RouteManager prefix
const routeDebugger = new Debugger(Debugger.controllerObjects.ROUTEMANAGER);

/**
 * RouteManager is a tool for redirecting the user. Includes several abstractions like logging redirects and 
 * handling login status redirects.
 */
export class RouteManager {

    /**
     * Redirect user and log in debugger
     * @param {string} destination window.location to send user to
     */
    static redirect(destination) {
        // routeDebugger.logWithPrefix("Redirecting user to " + destination);
        window.location = destination;
    }

    /**
     * Redirect user with hash and log in debugger
     * @param {string} destination window.location to send user to
     * @param {string} hash hash to add to end of redirect
     */
    static redirectWithHash(destination, hash) {
        // routeDebugger.logWithPrefix("Redirecting user to " + destination + "#" + hash);
        window.location = destination + "#" + hash;
    }

    /**
     * Check if user is logged in and send them to login if not
     * @param {string} title document title
     */
    static setTitleOrRedirectToLogin(title) {
        const user = SessionManager.getCurrentUser();
        if (!user) {
            RouteManager.redirect("/login");
        } else {
            BrowserManager.setTitle(title);
        }
    } 

    /**
     * Check if user is logged in and send them to dashboard if so
     * @param {string} title document title
     */
    static setTitleOrRedirectToDashboard(title) {
        const user = SessionManager.getCurrentUser();
        if (user) {
            RouteManager.redirect("/dashboard");
        } else {
            BrowserManager.setTitle(title);
        }
    } 

    /**
     * Get the hash from end of a window.location
     * @returns hash or null
     */
    static getHash() {
        const hash = window.location.hash;
        if (hash.length > 0) {
            return hash.substring(1);
        }
        return null;
    }

    /**
     * Purely cosmetic- set hash in url without redirect
     * @param {string} hash hash to set
     */
    static setHash(hash) {
        window.location.assign("#" + hash);
    }

    // Redirect to some common routes
    /**
     * Redirect user to a transaction's detail page by ID
     * @param {string} transactionId id of transaction to redirect to
     */
    static redirectToTransaction(transactionId) {
        RouteManager.redirect(`/dashboard/transactions?id=${transactionId}`);
    }
    
    /**
     * Redirect user to a group's invite page by ID
     * @param {string} groupId id of group to redirect to invite page of
     */
    static redirectToGroupInvite(groupId) {
        RouteManager.redirect(`/dashboard/group/invite?id=${groupId}`);
    }

    /**
     * Redirect user to a group's dashboard page by ID
     * @param {string} groupId id of group to redirect to invite page of
     */
    static redirectToGroupDashboard(groupId) {
        RouteManager.redirect(`/dashboard/group?id=${groupId}`);
    }

    /**
     * Redirect user to a user's relation with another user by ID
     * @param {string} userId id of user to view history of
     */
    static redirectToUser(userId) {
        if (userId) {
            RouteManager.redirect(`/dashboard/user?id=${userId}`);
        }
    }

    /**
     * Get current hostname for Citrus Financial
     */
    static getHostName() {
        return "http://localhost:3000"
    }
}