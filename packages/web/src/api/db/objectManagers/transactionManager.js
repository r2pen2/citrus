import { DBManager, Add, Remove, Set, Update } from "../dbManager";
import { ObjectManager } from "./objectManager";
import { SessionManager } from "../../sessionManager";
import { UserRelation } from "./userManager";

/**
 * Object Manager for transactions
 */
export class TransactionManager extends ObjectManager {
    constructor(_id, _data) {
        super(DBManager.objectTypes.TRANSACTION, _id);
        if (_data) {
            this.data = _data;
            this.fetched = true;
        }
    }

    fields = {
        CREATEDBY: "createdBy",
        CURRENCYLEGAL: "currencyLegal",
        CURRENCYTYPE: "currencyType",
        AMOUNT: "amount",
        DATE: "date",
        TITLE: "title",
        BALANCES: "balances",
        GROUP: "group",
        SETTLEGROUPS: "settleGroups",
        ISIOU: "isIOU",
    }

    getEmptyData() {
        const empty = {
            currency: {legal: null, type: null},           // {PaymentType} What type of currency was used (BEER, PIZZA, USD)
            amount: null,           // {number} How many of that currency was used 
            date: new Date(),       // {date} Timestamp of transaction
            title: null,            // {string} Title of transaction
            balances: {},           // {map<string, number>} Map relating usedIds to how much they are owed/owe for this transaction
            createdBy: null,        // {string} ID of user that created this transaction
            group: null,            // {number} ID of this transaction's group (if applicable)
            settleGroups: {},     // {map<string, number} Map relating groupIds to how much they relate to this settlement (if applicable)
            isIOU: null,     // {boolean} Whether or not this transaction was an IOU
        }
        return empty;
    }

    handleAdd(change, data) {
        switch(change.field) {
            case this.fields.CURRENCYLEGAL:
            case this.fields.CURRENCYTYPE:
            case this.fields.CREATEDBY:
            case this.fields.AMOUNT:
            case this.fields.DATE:
            case this.fields.TITLE:
            case this.fields.BALANCES:
            case this.fields.GROUP:
            case this.fields.SETTLEGROUPS:
            case this.fields.ISIOU:
                super.logInvalidChangeType(change);
                return data;
            default:
                super.logInvalidChangeField(change);
                return data;
        }
    }

    handleRemove(change, data) {
        switch(change.field) {
            case this.fields.CURRENCYLEGAL:
            case this.fields.CURRENCYTYPE:
            case this.fields.CREATEDBY:
            case this.fields.AMOUNT:
            case this.fields.DATE:
            case this.fields.TITLE:
            case this.fields.BALANCES:
            case this.fields.GROUP:
            case this.fields.ISIOU:
            case this.fields.SETTLEGROUPS:
                super.logInvalidChangeType(change);
                return data;
            default:
                super.logInvalidChangeField(change);
                return data;
        }
    }

    handleSet(change, data) {
        switch(change.field) {
            case this.fields.CURRENCYLEGAL:
                data.currency.legal = change.value;
                return data;
            case this.fields.CURRENCYTYPE:
                data.currency.type = change.value;
                return data;
            case this.fields.CREATEDBY:
                data.createdBy = change.value;
                return data;
            case this.fields.AMOUNT:
                data.amount = change.value;
                return data;
            case this.fields.DATE:
                data.date = change.value;
                return data;
            case this.fields.TITLE:
                data.title = change.value;
                return data;
            case this.fields.GROUP:
                data.group = change.value;
                return data;
            case this.fields.ISIOU:
                data.isIOU = change.value;
                return data;
            case this.fields.BALANCES:
            case this.fields.SETTLEGROUPS:
                super.logInvalidChangeType(change);
                return data;
            default:
                super.logInvalidChangeField(change);
                return data;
        }
    }

    async handleGet(field) {
        return new Promise(async (resolve, reject) => {
            if (!this.fetched) {
                await super.fetchData();
            }
            switch(field) {
                case this.fields.CURRENCYLEGAL:
                    resolve(this.data.currency.legal);
                    break;
                case this.fields.CURRENCYTYPE:
                    resolve(this.data.currency.type);
                    break;
                case this.fields.CREATEDBY:
                    resolve(this.data.createdBy);
                    break;
                case this.fields.AMOUNT:
                    resolve(this.data.amount);
                    break;
                case this.fields.DATE:
                    resolve(this.data.date);
                    break;
                case this.fields.TITLE:
                    resolve(this.data.title);
                    break;
                case this.fields.GROUP:
                    resolve(this.data.group);
                    break;
                case this.fields.BALANCES:
                    resolve(this.data.balances);
                    break;
                case this.fields.SETTLEGROUPS:
                    resolve(this.data.settleGroups);
                    break;
                case this.fields.ISIOU:
                    resolve(this.data.isIOU);
                    break;
                default:
                    super.logInvalidGetField(field);
                    resolve(null);
                    break;
            }
        })
    }
    

    handleUpdate(change, data) {
        switch(change.field) {
            case this.fields.BALANCES:
                data.balances[change.key] = change.value;
                return data;
            case this.fields.SETTLEGROUPS:
                data.settleGroups[change.key] = change.value;
                return data;
            case this.fields.CURRENCYLEGAL:
            case this.fields.CURRENCYTYPE:
            case this.fields.CREATEDBY:
            case this.fields.AMOUNT:
            case this.fields.DATE:
            case this.fields.TITLE:
            case this.fields.GROUP:
            case this.fields.ISIOU:
                super.logInvalidChangeType(change);
                return data;
            default:
                super.logInvalidChangeField(change);
                return data;
        }
    }

    // ================= Get Operations ================= //

    async getCurrencyLegal() {
        if (SessionManager.getSavedTransaction(this.documentId)) {
            return SessionManager.getSavedTransaction(this.documentId).currency.legal;
        }
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.CURRENCYLEGAL).then((val) => {
                resolve(val);
            })
        })
    }

    async getCurrencyType() {
        if (SessionManager.getSavedTransaction(this.documentId)) {
            return SessionManager.getSavedTransaction(this.documentId).currency.type;
        }
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.CURRENCYTYPE).then((val) => {
                resolve(val);
            })
        })
    }

    async getCreatedBy() {
        if (SessionManager.getSavedTransaction(this.documentId)) {
            return SessionManager.getSavedTransaction(this.documentId).createdBy;
        }
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.CREATEDBY).then((val) => {
                resolve(val);
            })
        })
    }

    async getAmount() {
        if (SessionManager.getSavedTransaction(this.documentId)) {
            return SessionManager.getSavedTransaction(this.documentId).amount;
        }
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.AMOUNT).then((val) => {
                resolve(val);
            })
        })
    }

    async getDate() {
        if (SessionManager.getSavedTransaction(this.documentId)) {
            return SessionManager.getSavedTransaction(this.documentId).date;
        }
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.DATE).then((val) => {
                resolve(val);
            })
        })
    }

    async getTitle() {
        if (SessionManager.getSavedTransaction(this.documentId)) {
            return SessionManager.getSavedTransaction(this.documentId).title;
        }
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.TITLE).then((val) => {
                resolve(val);
            })
        })
    }

    async getGroup() {
        if (SessionManager.getSavedTransaction(this.documentId)) {
            return SessionManager.getSavedTransaction(this.documentId).group;
        }
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.GROUP).then((val) => {
                resolve(val);
            })
        })
    }

    async getBalances() {
        if (SessionManager.getSavedTransaction(this.documentId)) {
            return SessionManager.getSavedTransaction(this.documentId).balances;
        }
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.BALANCES).then((val) => {
                resolve(val);
            })
        })
    }

    async getSettleGroups() {
        if (SessionManager.getSavedTransaction(this.documentId)) {
            return SessionManager.getSavedTransaction(this.documentId).settleGroups;
        }
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.SETTLEGROUPS).then((val) => {
                resolve(val);
            })
        })
    }

    async getIsIOU() {
        if (SessionManager.getSavedTransaction(this.documentId)) {
            return SessionManager.getSavedTransaction(this.documentId).isIOU;
        }
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.ISIOU).then((val) => {
                resolve(val);
            })
        })
    }
    
    // ================= Set Operations ================= //

    setCurrencyLegal(newCurrencyLegal) {
        const currencyLegalChange = new Set(this.fields.CURRENCYLEGAL, newCurrencyLegal);
        super.addChange(currencyLegalChange);
    }

    setCurrencyType(newCurrencyType) {
        const currencyTypeChange = new Set(this.fields.CURRENCYTYPE, newCurrencyType);
        super.addChange(currencyTypeChange);
    }

    setCreatedBy(newCreatedBy) {
        const createdByChange = new Set(this.fields.CREATEDBY, newCreatedBy);
        super.addChange(createdByChange);
    }

    setAmount(newAmount) {
        const amountChange = new Set(this.fields.AMOUNT, newAmount);
        super.addChange(amountChange);
    }
    
    setDate(newDate) {
        const dateChange = new Set(this.fields.DATE, newDate);
        super.addChange(dateChange);
    }
    
    setTitle(newTitle) {
        const titleChange = new Set(this.fields.TITLE, newTitle);
        super.addChange(titleChange);
    }
    
    setGroup(newGroup) {
        const groupChange = new Set(this.fields.GROUP, newGroup);
        super.addChange(groupChange);
    }

    setIsIOU(newIsIOU) {
        const isIOUChange = new Set(this.fields.ISIOU, newIsIOU);
        super.addChange(isIOUChange);
    }

    // ================= Add Operations ================= //
    // ================= Remove Operations ================= //
    // ================= Update Operations ================= //
    
    updateBalance(key, relation) {
        const balanceUpdate = new Update(this.fields.BALANCES, key, relation);
        super.addChange(balanceUpdate);
    }

    updateSettleGroup(key, amount) {
        const settleGroupUpdate = new Update(this.fields.SETTLEGROUPS, key, amount);
        super.addChange(settleGroupUpdate);
    }
    
    // ================= Sub-Object Functions ================= //

    /**
     * Get group manager for this transaction
     * @returns a promise resolved with the GroupManager or null if there's no group attached to this transaction
     */
    async getGroupManager() {
        return new Promise(async (resolve, reject) => {
            const group = await this.getGroup();
            if (group) {
                resolve(DBManager.getGroupManager(group));
            } else {
                resolve(null);
            }
        })
    }

    /**
     * Delete transaction from database and remove it from all user histories
     * @returns a promise resolved with a boolean if delete went through
     */
    async cleanDelete() {
        return new Promise(async (resolve, reject) => {
            for (const balanceKey of Object.entries(await this.getBalances())) {
                // Get a user manager
                const transactionUserManager = DBManager.getUserManager(balanceKey[0]);
                // Loop through all user relations for histories that have this transaction
                const relations = await transactionUserManager.getRelations();
                for (const relationKey of Object.entries(relations)) {
                    const relation = new UserRelation(relationKey[1]);
                    relation.removeHistory(this.documentId); // Transaction matches id! Remove history.
                    transactionUserManager.updateRelation(relationKey[0], relation); // Update relation
                }
                const settleGroups = await this.getSettleGroups();
                const curr = await this.getCurrencyType();
                const transactionAmount = await this.getAmount();
                for (const k of Object.keys(settleGroups)) {
                    const groupManager = DBManager.getGroupManager(k);
                    groupManager.removeTransaction(this.documentId);
                    // Update balances in group as well
                    const groupBalances = await groupManager.getBalances();
                    for (const k of Object.keys(groupBalances)) {
                        const userBalance = groupBalances[k];
                        userBalance[curr] = userBalance[curr] - transactionAmount;
                        groupManager.updateBalance(k, userBalance);
                    }
                    await groupManager.push();
                }
                const pushed = await transactionUserManager.push();
                if (!pushed) {
                    resolve(false);
                }
            }
            // If we made it this far, we succeeded
            await this.deleteDocument();
            resolve(true);
        })
    }
}