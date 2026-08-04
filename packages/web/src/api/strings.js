/**
 * Formats a UTC date string so that it's easier to read
 * @param {String} date string representing a UTC date
 * @returns {String} date formatted as a string
 */
 export function getDateString(date) {
    const d = date.seconds ? new Date(date.seconds * 1000 + date.nanoseconds/1000000) : new Date(date);
    const day = d.getUTCDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    var monthString = ""
    switch (month) {
        case 0:
            monthString = "January";
            break;
        case 1:
            monthString = "February";
            break;
        case 2:
            monthString = "March";
            break;
        case 3:
            monthString = "April";
            break;
        case 4:
            monthString = "May";
            break;
        case 5:
            monthString = "June";
            break;
        case 6:
            monthString = "July";
            break;
        case 7:
            monthString = "August";
            break;
        case 8:
            monthString = "September";
            break;
        case 9:
            monthString = "October";
            break;
        case 10:
            monthString = "November";
            break;
        case 11:
            monthString = "December";
            break;
        default:
            monthString = "";
            break;
    }

    return day + " " + monthString + ", " + year;
}

/**
 * Formats a UTC date string so that it's easier to read
 * @param {String} date string representing a UTC date
 * @returns {String} date formatted as a string
 */
 export function getSlashDateString(date) {
    const d = date.toDate();
    const day = d.getUTCDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    var monthString = ""
    switch (month) {
        case 0:
            monthString = "January";
            break;
        case 1:
            monthString = "February";
            break;
        case 2:
            monthString = "March";
            break;
        case 3:
            monthString = "April";
            break;
        case 4:
            monthString = "May";
            break;
        case 5:
            monthString = "June";
            break;
        case 6:
            monthString = "July";
            break;
        case 7:
            monthString = "August";
            break;
        case 8:
            monthString = "September";
            break;
        case 9:
            monthString = "October";
            break;
        case 10:
            monthString = "November";
            break;
        case 11:
            monthString = "December";
            break;
        default:
            monthString = "";
            break;
    }

    return (month + 1) + "/" + day + "/" + year;
}

/**
 * Cuts a string at an index and places an ellipsis
 * @param {String} string input string to cut
 * @param {Number} index last index to show 
 */
export function cutAtIndex(string, index) {
    if (string) {
        return string.slice(0, index) + "...";
    }
}

/**
 * Remove all non-numeric characters from a string
 * @param {string} string string to remove all non-numeric chars
 * @returns string w/ only numbers
 */
export function makeNumeric(string) {
    return string.replace(/\D+/g, '');
}

/**
 * Return everything in a string up until the first space
 * @param {string} string string to cut
 * @returns string cut at first space
 */
export function cutAtSpace(string) {
    return string.substring(0, string.indexOf(" "))
}

/**
 * Capitalize the first letter of a string
 * @param {string} string string to capitalize
 * @returns string with first letter caps
 */
export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function showDollars(string) {
    return `$${string}`;
}