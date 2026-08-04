import { GroupManager } from "./objectManagers/groupManager";
import { TransactionManager } from "./objectManagers/transactionManager";
import { UserManager } from "./objectManagers/userManager";
import { InvitationManager } from "./objectManagers/invitationManager";
import { Debugger } from "../debugger";

// Create debugger for DBManager
const dbDebugger = new Debugger(Debugger.controllerObjects.DBMANAGER);

/**
 * Superclass for all changes— objects that store fields and values to update on ObjectManagers
 */
export class Change {

    /**
     * All possible types for Changes
     */
    static changeTypes = {
        SET: "set",
        REMOVE: "remove",
        ADD: "add",
        UPDATE: "update",
    };

    constructor(_type, _field, _value) {
        this.type = _type;
        this.field = _field;
        this.value = _value;
    }

    /**
     * Detailed toString function
     * @deprecated This is old and pretty much useless
     * @returns Terribly long representation of this change
     */
    toStringVerbose() {
        return 'Change of type "' + this.type + '" on field "' + this.field + '" with value "' + this.value + '"';
    }

    /**
     * Get a string representation of this change
     * @returns String representation of this change
     */
    toString() {
        return this.type + " field: " + this.field + " val: " + this.value;
    }
}

/**
 * A Change object for setting the value of a field
 */
export class Set extends Change {
    constructor(_field, _newValue) {
        super(Change.changeTypes.SET, _field, _newValue);
    }
}

/**
 * A Change object for adding an object to an array
 */
export class Remove extends Change {
    constructor(_field, _value) {
        super(Change.changeTypes.REMOVE, _field, _value);
    }
}

/**
 * A Change object for removing an object from an array
 */
export class Add extends Change {
    constructor(_field, _newValue) {
        super(Change.changeTypes.ADD, _field, _newValue);
    }
}

/**
 * A Change object for updating a key in a map 
 */
export class Update extends Change {
    constructor(_field, _newKey, _newValue) {
        super(Change.changeTypes.UPDATE, _field, _newValue);
        this.key = _newKey;
    }
}

/**
 * DBManager is a database management factory object. It generates ObjectManagers for whichever object type it may need.
 */
export class DBManager {


    /**
     * All possible types for ObjectManagers
     */
    static objectTypes = {
        INVITATION: "invitations",
        GROUP: "group",
        TRANSACTION: "transaction",
        USER: "user",
    }

    /**
    * Generates a random id string of a given length
    * @param {Number} length length of id to be created 
    * @returns {String} generated id
    */
    static generateId(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
       }
       return result;
    }

    static async getRandomWord() {
        const length = Math.floor(Math.random() * 4) + 4;
        return new Promise((resolve, reject) => {
            fetch(`https://random-word-api.herokuapp.com/word?length=${length}`).then(res => {
            res.json().then(jsonRes => {
                resolve(jsonRes[0]);
            })
        })
        })
    }

    /**
     * Get object managers of correct type
     */
    static getGroupManager(id, data) {
        return new GroupManager(id, data);
    }
    static getInvitationManager(id) {
        return new InvitationManager(id);
    }
    static getTransactionManager(id) {
        return new TransactionManager(id);
    }
    static getUserManager(id) {
        return new UserManager(id);
    }

    // For use by SessionManager and SessionManager only!
    static createUserManagerFromLocalStorage(id, data) {
        return new UserManager(id, data);
    }
    static createTransactionManagerFromLocalStorage(id, data) {
        return new TransactionManager(id, data);
    }
}