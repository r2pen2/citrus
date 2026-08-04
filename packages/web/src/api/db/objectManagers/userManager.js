import { DBManager, Add, Remove, Set, Update } from "../dbManager";
import { ObjectManager } from "./objectManager";
import { SessionManager } from "../../sessionManager";
import { sortByDate } from "../../sorting";

/**
 * Object Manager for users
 */
export class UserManager extends ObjectManager {
    
    // Optional data param for loading currentUserManager from localstorage
    constructor(_id, _data) {
        super(DBManager.objectTypes.USER, _id);
        if (_data) {
            this.data = _data;
            this.fetched = true;
        }
    }
    
    fields = {
        FRIENDS: "friends",
        GROUPS: "groups",
        RELATIONS: "relations",
        CREATEDAT: "createdAt",
        EMAILVERIFIED: "emailVerified",
        LASTLOGINAT: "lastLoginAt",
        DISPLAYNAME: "displayName",
        EMAIL: "email",
        PHONENUMBER: "phoneNumber",
        PFPURL: "pfpUrl",
    }

    getEmptyData() {
        const empty = {
            friends: [],                    // {array} IDs of friends the user has added
            groups: [],                     // {array} IDs of groups the user is in
            relations: {},                  // {map} Map of userIds and their respective relations
            metadata: {                     // {map} Metadata associated with user
                createdAt: null,            // --- {date} When the user was created
                emailVerified: null,        // --- {boolean} Whether or not the user is email verified
                lastLoginAt: null,          // --- {date} Timestamp of last login
            },  
            personalData: {                 // {map} Personal data associated with user
                displayName: null,          // --- {string} User's display name
                email: null,                // --- {string} User's email address
                phoneNumber: null,          // --- {PhoneNumber} User's phone number
                pfpUrl: null,    // --- {string} URL of user's profile photo
            },
        }
        return empty;
    }

    handleUpdate(change, data) {
        switch(change.field) {
            case this.fields.RELATIONS:
                data.relations[change.key] = change.value;
                return data;
            case this.fields.FRIENDS:
            case this.fields.GROUPS:
            case this.fields.CREATEDAT:
            case this.fields.EMAILVERIFIED:
            case this.fields.LASTLOGINAT:
            case this.fields.DISPLAYNAME:
            case this.fields.EMAIL:
            case this.fields.PHONENUMBER:
            case this.fields.PFPURL:
                super.logInvalidChangeType(change);
                return data;
            default:
                super.logInvalidChangeField(change);
                return data;
        }
    }

    handleAdd(change, data) {
        switch(change.field) {
            case this.fields.FRIENDS:
                if (!data.friends.includes(change.value)) {    
                    data.friends.push(change.value);
                }
                return data;
            case this.fields.GROUPS:
                if (!data.groups.includes(change.value)) {    
                    data.groups.push(change.value);
                }
                return data;
            case this.fields.RELATIONS:
            case this.fields.CREATEDAT:
            case this.fields.EMAILVERIFIED:
            case this.fields.LASTLOGINAT:
            case this.fields.DISPLAYNAME:
            case this.fields.EMAIL:
            case this.fields.PHONENUMBER:
            case this.fields.PFPURL:
                super.logInvalidChangeType(change);
                return data;
            default:
                super.logInvalidChangeField(change);
                return data;
        }
    }

    handleRemove(change, data) {
        switch(change.field) {
            case this.fields.FRIENDS:
                data.friends = data.friends.filter(friend => friend !== change.value);
                return data;
            case this.fields.GROUPS:
                data.groups = data.groups.filter(group => group !== change.value);
                return data;
            case this.fields.RELATIONS:
                delete data.relations[change.value];
                return data;
            case this.fields.CREATEDAT:
            case this.fields.EMAILVERIFIED:
            case this.fields.LASTLOGINAT:
            case this.fields.DISPLAYNAME:
            case this.fields.EMAIL:
            case this.fields.PHONENUMBER:
            case this.fields.PFPURL:
                super.logInvalidChangeType(change);
                return data;
            default:
                super.logInvalidChangeField(change);
                return data;
        }
    }

    handleSet(change, data) {
        switch(change.field) {
            case this.fields.CREATEDAT:
                data.metadata.createdAt = change.value;
                return data;
            case this.fields.EMAILVERIFIED:
                data.metadata.emailVerified = change.value;
                return data;
            case this.fields.LASTLOGINAT:
                data.metadata.lastLoginAt = change.value;
                return data;
            case this.fields.DISPLAYNAME:
                data.personalData.displayName = change.value;
                return data;
            case this.fields.EMAIL:
                data.personalData.email = change.value;
                return data;
            case this.fields.PHONENUMBER:
                data.personalData.phoneNumber = change.value;
                return data;
            case this.fields.PFPURL:
                data.personalData.pfpUrl = change.value;
                return data;
            case this.fields.FRIENDS:
            case this.fields.GROUPS:
            case this.fields.RELATIONS:
                super.logInvalidChangeType(change);
                return data;
            default:
                super.logInvalidChangeField(change);
                return data;
        }
    }

    async handleGet(field) {
        return new Promise(async (resolve, reject) => {
            if (!this.fetched || !this.data) {
                await super.fetchData();
            }
            switch(field) {
                case this.fields.CREATEDAT:
                    resolve(this.data.metadata.createdAt);
                    break;
                case this.fields.EMAILVERIFIED:
                    resolve(this.data.metadata.emailVerified);
                    break;
                case this.fields.LASTLOGINAT:
                    resolve(this.data.metadata.lastLoginAt);
                    break;
                case this.fields.DISPLAYNAME:
                    resolve(this.data.personalData.displayName);
                    break;
                case this.fields.EMAIL:
                    resolve(this.data.personalData.email);
                    break;
                case this.fields.PHONENUMBER:
                    resolve(this.data.personalData.phoneNumber);
                    break;
                case this.fields.PFPURL:
                    if (this.data.personalData.pfpUrl) {
                        resolve(this.data.personalData.pfpUrl);
                        break;
                    } else {
                        resolve("https://robohash.org/" + this.documentId);
                        break;
                    }
                case this.fields.FRIENDS:
                    resolve(this.data.friends);
                    break;
                case this.fields.GROUPS:
                    resolve(this.data.groups);
                    break;
                case this.fields.RELATIONS:
                    resolve(this.data.relations);
                    break;
                default:
                    super.logInvalidGetField(field);
                    resolve(null);
                    break;
            }
        })
    }

    // ================= Get Operations ================= //

    async getFriends() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.FRIENDS).then((val) => {
                resolve(val);
            })
        })
    }

    async getGroups() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.GROUPS).then((val) => {
                resolve(val);
            })
        })
    }

    async getCreatedAt() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.CREATEDAT).then((val) => {
                resolve(val);
            })
        })
    }

    async getEmailVerified() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.EMAILVERIFIED).then((val) => {
                resolve(val);
            })
        })
    }

    async getLastLoginAt() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.LASTLOGINAT).then((val) => {
                resolve(val);
            })
        })
    }

    async getDisplayName() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.DISPLAYNAME).then((val) => {
                resolve(val);
            })
        })
    }

    async getEmail() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.EMAIL).then((val) => {
                resolve(val);
            })
        })
    }

    async getPhoneNumber() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.PHONENUMBER).then((val) => {
                resolve(val);
            })
        })
    }

    async getPfpUrl() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.PFPURL).then((val) => {
                resolve(val);
            })
        })
    }

    async getRelations() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.RELATIONS).then((val) => {
                resolve(val);
            })
        })
    }

    async getRelationWithUser(userId) {
        await this.fetchData();
        return new Promise(async (resolve, reject) => {
            const allRelations = await this.getRelations();
            let found = false;
            for (const key of Object.entries(allRelations)) {
                if (key[0] === userId) {
                    found = true;
                    resolve(new UserRelation(key[1]));
                }
            }
            if (!found) {
                const otherUserManager = DBManager.getUserManager(userId);
                const displayName = await otherUserManager.getDisplayName();
                const newRelation = new UserRelation();
                newRelation.setDisplayName(displayName);
                resolve(newRelation);
            }
        })
    }

    // ================= Set Operations ================= //
    setCreatedAt(newCreatedAt) {
        const createdAtChange = new Set(this.fields.CREATEDAT, newCreatedAt);
        super.addChange(createdAtChange);
    }
    
    setEmailVerified(newEmailVerified) {
        const emailVerifiedChange = new Set(this.fields.EMAILVERIFIED, newEmailVerified);
        super.addChange(emailVerifiedChange);
    }
    
    setLastLoginAt(newLastLoginAt) {
        const loginAtChange = new Set(this.fields.LASTLOGINAT, newLastLoginAt);
        super.addChange(loginAtChange);
    }

    setDisplayName(newDisplayName) {
        const displayNameChange = new Set(this.fields.DISPLAYNAME, newDisplayName);
        super.addChange(displayNameChange);
    }
    
    setEmail(newEmail) {
        const emailChange = new Set(this.fields.EMAIL, newEmail);
        super.addChange(emailChange);
    }

    setPhoneNumber(newPhoneNumber) {
        const phoneNumberChange = new Set(this.fields.PHONENUMBER, newPhoneNumber);
        super.addChange(phoneNumberChange);
    }
    
    setPfpUrl(newProfilePictureUrl) {
        const photoUrlChange = new Set(this.fields.PFPURL, newProfilePictureUrl);
        super.addChange(photoUrlChange);
    }

    // ================= Update Operation ================= // 
    updateRelation(key, relation) {
        const relationUpdate = new Update(this.fields.RELATIONS, key, relation.toJson());
        super.addChange(relationUpdate);
    }

    // ================= Add Operations ================= //
    addFriend(friendId) {
        const friendAddition = new Add(this.fields.FRIENDS, friendId);
        super.addChange(friendAddition);
    }
    
    addGroup(groupId) {
        const groupAddition = new Add(this.fields.GROUPS, groupId);
        super.addChange(groupAddition);
    }

    // ================= Remove Operations ================= //
    removeFriend(friendId) {
        const friendRemoval = new Remove(this.fields.FRIENDS, friendId);
        super.addChange(friendRemoval);
    }
    
    removeGroup(groupId) {
        const groupRemoval = new Remove(this.fields.GROUPS, groupId);
        super.addChange(groupRemoval);
    }

    removeRelation(relationUserId) {
        const relationRemoval = new Remove(this.fields.RELATIONS, relationUserId);
        super.addChange(relationRemoval);
    }

    // ================= Misc. Methods ================= //
    /**
     * Get a user's initials by displayName
     * @returns a promise resolved with the user's initials
     */
    async getInitials() {
        return new Promise(async (resolve, reject) => {
            const fullName = await this.getDisplayName()
            if (fullName) {
                resolve(fullName.charAt(0))
            } else {
                resolve("?");
            }
        })
    }
}

export class UserRelation {
    constructor(_userRelation) {
        this.balances = _userRelation ? _userRelation.balances : {USD: 0};
        this.numTransactions = _userRelation ? _userRelation.numTransactions : 0;
        this.history = _userRelation ? _userRelation.history : [];
        this.lastInteracted = _userRelation ? _userRelation.lastInteracted : new Date();
        this.displayName = _userRelation ? _userRelation.displayName : null;
    }

    addHistory(history) {
        const json = history.toJson();
        const balanceType = json.currency.legal ? "USD" : json.currency.type;
        this.balances[balanceType] = (this.balances[balanceType] ? this.balances[balanceType] : 0) + json.amount;
        this.numTransactions++;
        this.lastInteracted = new Date();
        this.history.unshift(json);
    }

    getHistory() {
        let historyArray = [];
        for (const jsonHistory of this.history) {
            historyArray.push(new UserRelationHistory(jsonHistory));
        }
        return historyArray;
    }

    /**
     * Remove entry for a transactionId from history array
     * @param {string} transactionId id of transaction to erase from history
     */
    removeHistory(transactionId) {
        for (const jsonHistory of this.history) {
            if (jsonHistory.transaction === transactionId) {
                this.history = this.history.filter(entry => entry.transaction !== transactionId);
                // This is the entry to remove
                const balanceType = jsonHistory.currency.legal ? "USD" : jsonHistory.currency.type;
                this.balances[balanceType] = this.balances[balanceType] - jsonHistory.amount;
                break;
            }
        }
        this.numTransactions--;
    }

    setDisplayName(displayName) {
        this.displayName = displayName;
    }

    toJson() {
        return {
            balances: this.balances,
            numTransactions: this.numTransactions,
            history: this.history,
            lastInteracted: this.lastInteracted,
            displayName: this.displayName,
        }
    }

    static sortByBalance(userRelationArray) {
        if (!userRelationArray) {
            return userRelationArray;
        }
        userRelationArray.sort((a, b) => {
            return b.balances["USD"] - a.balances["USD"];
        });
        // Separate into two arrays and spit zeros out at the bottom
        let topArray = [];
        let bottomArray = [];
        for (const userRelation of userRelationArray) {
            if (userRelation.balances["USD"] !== 0) {
                topArray.push(userRelation);
            } else {
                bottomArray.push(userRelation);
            }
        }
        return topArray.concat(bottomArray);
    }

    static sortByAbsoluteValue(userRelationArray) {
        if (!userRelationArray) {
            return userRelationArray;
        }
        userRelationArray.sort((a, b) => {
            return Math.abs(b.balance) - Math.abs(a.balance);
        });
        return userRelationArray;
    }

    static sortByDisplayName(userRelationArray) {
        if (!userRelationArray) {
            return userRelationArray;
        }
        userRelationArray.sort((a, b) => {
            if (a.displayName < b.displayName) {
                return -1;
            }
            if (a.displayName > b.displayName) {
                return 1;
            }
            return 0;
        });
        return userRelationArray;
    }

    static sortByLastInteracted(userRelationArray) {
        if (!userRelationArray) {
            return userRelationArray;
        }
        userRelationArray.sort((a, b) => {
            return new Date(b.lastInteracted) - new Date(a.lastInteracted);
        });
        return userRelationArray;
    }

    static sortByNumTransactions(userRelationArray) {
        userRelationArray.sort((a, b) => {
            return b.numTransactions - a.numTransactions;
        });
        return userRelationArray;
    }

    static applySort(scheme, array) {
        switch (scheme) {
            case this.sortingSchemes.BALANCE:
                return this.sortByBalance(array);
            case this.sortingSchemes.NUMTRANSACTIONS:
                return this.sortByNumTransactions(array);
            case this.sortingSchemes.LASTINTERACTED:
                return this.sortByLastInteracted(array);
            case this.sortingSchemes.DISPLAYNAME:
                return this.sortByDisplayName(array);
            case this.sortingSchemes.ABSOLUTEVALUE:
                return this.sortByAbsoluteValue(array);
            default:
                return array;
        }
    }

    static sortingSchemes = {
        BALANCE: "balance",
        NUMTRANSACTIONS: "numTransactions",
        LASTINTERACTED: "lastInteracted",
        DISPLAYNAME: "displayName",
        ABSOLUTEVALUE: "absoluteValue"
    }
}

export class UserRelationHistory {
    constructor(_userRelationHistory) {
        this.currency = _userRelationHistory ? _userRelationHistory.currency : {legal: null, type: null};      // "Currency" used in this exchange (USD? BEER? PIZZA?)
        this.amount = _userRelationHistory ? _userRelationHistory.amount : null;                // How many of that currency was used in this exchange
        this.transaction = _userRelationHistory ? _userRelationHistory.transaction : null;      // ID of this exchange's transaction
        this.transactionTitle = _userRelationHistory ? _userRelationHistory.transactionTitle : null;      // Title of this exchange's transaction
        this.group = _userRelationHistory ? _userRelationHistory.group : null;                 // ID of this exchange's group (if applicabale)
        this.date = _userRelationHistory ? _userRelationHistory.date : new Date();              // When this exchange occured
    }

    setTransaction(transactionId) {
        this.transaction = transactionId;
    }

    setTransactionTitle(newTitle) {
        this.transactionTitle = newTitle;
    }

    setCurrencyLegal(newLegal) {
        this.currency.legal = newLegal;
    }

    setCurrencyType(newType) {
        this.currency.type = newType;
    }

    setAmount(amt) {
        this.amount = amt;
    }

    setGroup(groupId) {
        this.group = groupId;
    }

    setDate(date) {
        this.date = date;
    }

    getDate() {
        return this.date;
    }

    getAmount() {
        return this.amount;
    }

    getTransaction() {
        return this.transaction;
    }
    
    toJson() {
        return {
            currency: this.currency,
            amount: this.amount,
            transaction: this.transaction,
            transactionTitle: this.transactionTitle,
            group: this.group,
            date: this.date,
        }
    }
}