import { SessionManager } from "./sessionManager";

/**
 * Sorts a list by date
 * @param {[Object]} array list to be sorted
 * @returns {[Object]} sorted list
 */
export function sortByDate(array) {
    if (!array) {
        return null;
    }
    array.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    })
    return array;
}

/**
 * Sorts a list by UT date
 * @param {[Object]} array list to be sorted
 * @returns {[Object]} sorted list
 */
 export function sortByUTDate(array) {
    if (!array) {
        return null;
    }
    array.sort((a, b) => {
        return b.date.toDate() - a.date.toDate();
    })
    return array;
}

/**
 * Sorts a list by createdAt
 * @param {[Object]} array list to be sorted
 * @returns {[Object]} sorted list
 */
 export function sortByCreatedAt(array) {
    array.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    })
    return array;
}

/**
 * Sorts a list by data.createdAt
 * @param {[Object]} array list to be sorted
 * @returns {[Object]} sorted list
 */
 export function sortByDataCreatedAt(array) {
    array.sort((a, b) => {
        return b.data.createdAt.toDate() - a.data.createdAt.toDate();
    })
    return array;
}

/**
 * Sorts a list by displayName
 * @param {[Object]} array list to be sorted
 * @returns {[Object]} sorted list
 */
 export function sortByDisplayName(array) {
    array.sort((a, b) => {
        if (a.displayName < b.displayName) {
            return -1;
        }
        if (a.displayName > b.displayName) {
            return 1;
        }
        return 0;
    });
    return array;
}

/**
 * Sorts a list alphabetically
 * @param {[Object]} array list to be sorted
 * @returns {[Object]} sorted list
 */
 export function sortAlphabetical(array) {
    array.sort((a, b) => {
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    });
    return array;
}

/**
 * Places the current user first in a list (by UID)
 * @param {[Object]} array list to be sorted
 * @returns {[Object]} sorted list with current user at top 
 */
export function placeCurrentUserFirst(array) {
    return placeUserFirst(array, SessionManager.getUserId());
}

/**
 * Places selected user first in a list
 * @param {[Object]} array list to be sorted
 * @returns {[Object]} sorted list with selected user at top 
 */
export function placeUserFirst(array, uid) {
    let selectedUser = null;
    let newArray = [];
    for (const u of array) {
        if (u.id === uid) {
            selectedUser = u;
        } else {
            newArray.push(u);
        }
    }
    newArray.unshift(selectedUser);
    return newArray;
}