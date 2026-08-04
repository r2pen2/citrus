import { DBManager, Add, Remove, Set, Update } from "../dbManager";
import { RouteManager } from "../../routeManager";
import { capitalizeFirstLetter } from "../../strings";
import { ObjectManager } from "./objectManager";
import { InviteType, InviteMethod } from "./invitationManager";
import { SessionManager } from "../../sessionManager";

/**
 * Object Manager for groups
 */
export class GroupManager extends ObjectManager {

    constructor(_id, _data) {
        super(DBManager.objectTypes.GROUP, _id);
        if (_data) {
            this.data = _data;
            this.fetched = true;
        }
    }

    fields = {
        CREATEDAT: "createdAt",
        CREATEDBY: "createdBy",
        NAME: "name",
        DESCRIPTION: "description",
        TRANSACTIONS: "transactions",
        USERS: "users",
        BALANCES: "balances",
        LINKINVITE: "linkInvite",
        QRINVITE: "qrInvite",
        CODEINVITE: "codeInvite",
    }

    getEmptyData() {
        const empty = {
            createdAt: null,    // {date} When the group was created
            createdBy: null,    // {string} ID of user that created the group
            name: null,         // {string} Name of the group
            description: null,  // {string} Description of the group
            transactions: [],   // {array <- string} IDs of every transaction associated with this group
            users: [],          // {array <- string} IDs of every user in this group
            balances: {},       // {map <string, map>} Balances of every user in group
            invitations: {      // {map} Invitations associated with group
                link: null,     // -- {string} Invite link to this group
                qr: null,       // -- {string} Invite qr code for this group
                code: null,     // -- {string} ID of CodeInvite for this group
            },
        }
        return empty;
    }

    getQr() {
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${RouteManager.getHostName()}/invite?type=group&method=qr&id=${this.documentId}`
    }

    getLink() {
        return `${RouteManager.getHostName()}/invite?type=group&method=link&id=${this.documentId}`
    }

    async generateInvites() {
        return new Promise(async (resolve, reject) => {
            let newCode = false;
            let codeString = "";
            let invitationManager = null;
            while (!newCode) {
              const word1 = await DBManager.getRandomWord();
              const word2 = await DBManager.getRandomWord();
              const word3 = await DBManager.getRandomWord();
              codeString = capitalizeFirstLetter(word1) + capitalizeFirstLetter(word2) + capitalizeFirstLetter(word3);
              invitationManager = DBManager.getInvitationManager(codeString);
              const codeExists = await invitationManager.documentExists();
              newCode = !codeExists;
            }
            invitationManager.setInviteMethod(InviteMethod.methods.CODE);
            invitationManager.setTargetType(InviteType.types.GROUP);
            invitationManager.setInvitedAt(new Date());
            invitationManager.setUsed(false);
            invitationManager.setTarget(this.getDocumentId());
            console.log(invitationManager)
            // Push invitation Manager
            const invitePushed = await invitationManager.push();
            if (!invitePushed) {
                resolve(false);
            } else {
                this.setCodeInvite(codeString);
                this.setLinkInvite(this.getLink());
                this.setQrInvite(this.getQr());
                const thisPushed = await this.push();
                if (!thisPushed) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        })
    }

    handleAdd(change, data) {
        switch(change.field) {
            case this.fields.TRANSACTIONS:
                if (!data.transactions.includes(change.value)) {    
                    data.transactions.unshift(change.value);
                }
                return data;
            case this.fields.USERS:
                if (!data.users.includes(change.value)) {    
                    data.users.push(change.value);
                }
                return data;
            case this.fields.CREATEDAT:
            case this.fields.CREATEDBY:
            case this.fields.NAME:
            case this.fields.DESCRIPTION:
            case this.fields.CODEINVITE:
            case this.fields.LINKINVITE:
            case this.fields.QRINVITE:
            case this.fields.BALANCES:
                super.logInvalidChangeType(change);
                return data;
            default:
                super.logInvalidChangeField(change);
                return data;
        }
    }

    handleRemove(change, data) {
        switch(change.field) {
            case this.fields.TRANSACTIONS:
                data.transactions = data.transactions.filter(transaction => transaction !== change.value);
                return data;
            case this.fields.USERS:
                data.users = data.users.filter(user => user !== change.value);
                return data;
            case this.fields.CREATEDAT:
            case this.fields.CREATEDBY:
            case this.fields.NAME:
            case this.fields.DESCRIPTION:
            case this.fields.CODEINVITE:
            case this.fields.LINKINVITE:
            case this.fields.QRINVITE:
            case this.fields.BALANCES:
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
                data.createdAt = change.value;
                return data;
            case this.fields.CREATEDBY:
                data.createdBy = change.value;
                return data;
            case this.fields.NAME:
                data.name = change.value;
                return data;
            case this.fields.DESCRIPTION:
                data.description = change.value;
                return data;
            case this.fields.CODEINVITE:
                data.invitations.code = change.value;
                return data;
            case this.fields.LINKINVITE:
                data.invitations.link = change.value;
                return data;
            case this.fields.QRINVITE:
                data.invitations.qr = change.value;
                return data;
            case this.fields.TRANSACTIONS:
            case this.fields.USERS:
            case this.fields.BALANCES:
                super.logInvalidChangeType(change);
                return data;
            default:
                super.logInvalidChangeField(change);
                return data;
        }
    }

    handleUpdate(change, data) {
        switch(change.field) {
            case this.fields.BALANCES:
                data.balances[change.key] = change.value;
                return data;
            case this.fields.CREATEDAT:
            case this.fields.CREATEDBY:
            case this.fields.NAME:
            case this.fields.DESCRIPTION:
            case this.fields.CODEINVITE:
            case this.fields.LINKINVITE:
            case this.fields.QRINVITE:
            case this.fields.TRANSACTIONS:
            case this.fields.USERS:
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
                case this.fields.CREATEDAT:
                    resolve(this.data.createdAt);
                    break;
                case this.fields.CREATEDBY:
                    resolve(this.data.createdBy);
                    break;
                case this.fields.NAME:
                    resolve(this.data.name);
                    break;
                case this.fields.DESCRIPTION:
                    resolve(this.data.description);
                    break;
                case this.fields.TRANSACTIONS:
                    resolve(this.data.transactions);
                    break;
                case this.fields.USERS:
                    resolve(this.data.users);
                    break;
                case this.fields.BALANCES:
                    resolve(this.data.balances);
                    break;
                case this.fields.LINKINVITE:
                    resolve(this.data.invitations.link);
                    break;
                case this.fields.CODEINVITE:
                    resolve(this.data.invitations.code);
                    break;
                case this.fields.QRINVITE:
                    resolve(this.data.invitations.qr);
                    break;
                default:
                    super.logInvalidGetField(field);
                    resolve(null);
                    break;
            }
        })
    }

    // ================= Get Operations ================= //
    async getCreatedAt() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.CREATEDAT).then((val) => {
                resolve(val);
            })
        })
    }

    async getCreatedBy() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.CREATEDBY).then((val) => {
                resolve(val);
            })
        })
    }

    async getName() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.NAME).then((val) => {
                resolve(val);
            })
        })
    }

    async getDescription() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.DESCRIPTION).then((val) => {
                resolve(val);
            })
        })
    }

    async getTransactions() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.TRANSACTIONS).then((val) => {
                resolve(val);
            })
        })
    }

    async getUsers() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.USERS).then((val) => {
                resolve(val);
            })
        })
    }

    async getLinkInvite() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.LINKINVITE).then((val) => {
                resolve(val);
            })
        })
    }

    async getQrInvite() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.QRINVITE).then((val) => {
                resolve(val);
            })
        })
    }

    async getCodeInvite() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.CODEINVITE).then((val) => {
                resolve(val);
            })
        })
    }
    
    async getBalances() {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.BALANCES).then((val) => {
                resolve(val);
            })
        })
    }
    
    async getUserBalance(userId) {
        return new Promise(async (resolve, reject) => {
            this.handleGet(this.fields.BALANCES).then((val) => {
                resolve(val[userId] ? val[userId] : {});
            })
        })
    }

    /**
     * Get the number of users in a group
     * @returns {number} number of users in the group
     */
    async getMemberCount() {
        return new Promise(async (resolve, reject) => {
            const groupMembers = await this.getUsers();
            resolve(groupMembers.length);
        })
    }

    // ================= Set Operations ================= //
    setCreatedAt(newCreatedAt) {
        const createdAtChange = new Set(this.fields.CREATEDAT, newCreatedAt);
        super.addChange(createdAtChange);
    }
    
    setCreatedBy(newCreatedBy) {
        const createdByChange = new Set(this.fields.CREATEDBY, newCreatedBy);
        super.addChange(createdByChange);
    }
    
    setName(newName) {
        const nameChange = new Set(this.fields.NAME, newName);
        super.addChange(nameChange);
    }

    setDescription(newDescription) {
        const descriptionChange = new Set(this.fields.DESCRIPTION, newDescription);
        super.addChange(descriptionChange);
    }

    setLinkInvite(newLinkInvite) {
        const linkInviteChange = new Set(this.fields.LINKINVITE, newLinkInvite);
        super.addChange(linkInviteChange);
    }

    setQrInvite(newQrInvite) {
        const qrInviteChange = new Set(this.fields.QRINVITE, newQrInvite);
        super.addChange(qrInviteChange);
    }

    setCodeInvite(newCodeInvite) {
        const codeInviteChange = new Set(this.fields.CODEINVITE, newCodeInvite);
        super.addChange(codeInviteChange);
    }

    // ================= Add Operations ================= //
    addTransaction(transactionId) {
        const transactionAddition = new Add(this.fields.TRANSACTIONS, transactionId);
        super.addChange(transactionAddition);
    }

    addUser(userId) {
        const userAddition = new Add(this.fields.USERS, userId);
        super.addChange(userAddition);
    }

    addInvitation(invitationId) {
        const invitationAddition = new Add(this.fields.INVITATIONS, invitationId);
        super.addChange(invitationAddition);
    }

    // ================= Remove Operations ================= //
    removeTransaction(transactionId) {
        const transactionRemoval = new Remove(this.fields.TRANSACTIONS, transactionId);
        super.addChange(transactionRemoval);
    }

    removeUser(userId) {
        const userRemoval = new Remove(this.fields.USERS, userId);
        super.addChange(userRemoval);
    }

    removeInvitation(invitationId) {
        const invitationRemoval = new Remove(this.fields.INVITATIONS, invitationId);
        super.addChange(invitationRemoval);
    }

    // ================= Update Operation ================= // 
    updateBalance(key, balance) {
        const balanceUpdate = new Update(this.fields.BALANCES, key, balance);
        super.addChange(balanceUpdate);
    }

    // ================= Misc Operation ================= //
    async cleanDelete() {
        return new Promise(async (resolve, reject) => {
            await this.deleteDocument();
            resolve(true);
        })
    }
}