/**
 * Formats a UTC date string so that it's easier to read
 * @param {String} date string representing a UTC date
 * @returns {String} date formatted as a string in the format "Month day, year"
 */
export function getDateString(date) {
    // Create a date object that we can parse
    // Sometimes dates will come in as just an object with seconds and milliseconds
    // In that case, we just create a new Date() object with tie timestamp stored in that data
    const d = date.seconds ? new Date(date.seconds * 1000 + date.nanoseconds/1000000) : new Date(date);

    // Break down date into its' parts
    const day = d.getUTCDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    // Get the name of the month
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

    // Format and return string
    return `${monthString} ${day}, ${year}`;
}

/**
 * Formats a UTC date string so that it's easier to read
 * @param {String} date string representing a UTC date
 * @returns {String} date formatted as a string in the format "month/day/year"
 */
 export function getSlashDateString(date) {
    // Make sure we have a valid date object
    const d = date.toDate();
    
    // Break it down into its' parts
    const day = d.getUTCDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    // Format and return string
    return `${month + 1}/${day}/${year}`
}

/**
 * Remove all non-numeric characters from a string via regex
 * @param {string} string string to remove all non-numeric chars
 * @returns string w/ only numbers
 */
export function makeNumeric(string) {
    return string.replace(/\D+/g, '');
}

/**
 * Capitalize the first letter of a string
 * @param {string} string string to capitalize
 * @returns string with first letter capitalized
 */
export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}