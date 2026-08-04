import { doc, collection, addDoc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { firestore } from "../../firebase";
import { Debugger } from "../../debugger";
import { Change, DBManager } from "../dbManager";

/**
 * ObjectManager is an abstract class used to standardize higher-level oprations of database objects
 * @todo This should probably be turned into a typescript file in the future, but that would be a lot of work.
 * @param {string} _objectType type of object to manager
 * @param {string} _documentId id of document on database <- can be ignored if the document doesn't already exist
 */
export class ObjectManager {
    constructor(_objectType, _documentId) {
        this.objectType = _objectType;
        this.documentId = _documentId;
        this.docRef = this.documentId ? doc(firestore, this.getCollection(), _documentId) : null;
        this.error = false;
        this.fetched = false;
        this.changes = [];
        this.debugger = this.getDebugger();
        this.data = this.getEmptyData();
    }

    /**
     * Get a debugger for the current object
     * @returns Debugger with the correct prefix
     */
    getDebugger() {
        switch (this.objectType) {
            case DBManager.objectTypes.GROUP:
                return new Debugger(Debugger.controllerObjects.OBJECTMANAGERGROUP);
            case DBManager.objectTypes.TRANSACTION:
                return new Debugger(Debugger.controllerObjects.OBJECTMANAGERTRANSACTION);
            case DBManager.objectTypes.INVITATION:
                return new Debugger(Debugger.controllerObjects.OBJECTMANAGERINVITATION);
            case DBManager.objectTypes.USER:
                return new Debugger(Debugger.controllerObjects.OBJECTMANAGERUSER);
            default:
                return null;
        }
    }

    /**
     * Add a change to this object
     * @param {Change} change change to add
     */
    addChange(change) {
        this.changed = true;
        this.changes.push(change);
    }

    /**
     * Apply all changes to this object
     * @returns a promise resolved when the changes are applied
     */
    async applyChanges() {
        return new Promise(async (resolve, reject) => {
            if (!this.fetched) {
                this.debugger.logWithPrefix("Fetching data to apply changes...");
                await this.fetchData();
                this.debugger.logWithPrefix("Fetch complete!");
            }
            if (this.data) {
                for (const change of this.changes) {
                    this.debugger.logWithPrefix("Making change: " + change.toString());
                    switch(change.type) {
                        case Change.changeTypes.ADD:
                            this.data = this.handleAdd(change, this.data);
                            break;
                        case Change.changeTypes.REMOVE:
                            this.data = this.handleRemove(change, this.data);
                            break;
                        case Change.changeTypes.SET:
                            this.data = this.handleSet(change, this.data);
                            break;
                        case Change.changeTypes.UPDATE:
                            this.data = this.handleUpdate(change, this.data);
                            break;
                        default:
                            this.debugger.logWithPrefix("Invalid change type when trying to apply changes!");
                            break;
                    }
                }
                this.changes = [];
                this.changed = false;
                resolve(true);
            } else {
                this.debugger.logWithPrefix("Applying changes failed because data was null!");
                resolve(false);
            }
        })
    }

    /**
     * Get firestore collection for current object type
     * @returns {String} firestore collection for object type
     */
    getCollection() {
        switch(this.objectType) {
            case DBManager.objectTypes.GROUP:
                return "groups";
            case DBManager.objectTypes.TRANSACTION:
                return "transactions";
            case DBManager.objectTypes.INVITATION:
                return "invitations";
            case DBManager.objectTypes.USER:
                return "users";
            default:
                return null;
        }
    }

    /**
     * Get this ObjectManager's document id
     * @returns {String} id of this ObjectManager's firestore document
     */
    getDocumentId() {
        return this.documentId;
    }

    /**
     * Get this ObjectManager's type
     * @returns {String} object type
     */
    getObjectType() {
        return this.objectType;
    }

    /**
     * Get a string representation of this ObjectManager
     * @returns {String} string representation of the object
     */
    toString() {
        return 'Object manager of type "' + this.objectType + '" with id "' + this.documentId + '"';
    }
    
    /**
     * Log the objectManager's data
     */
    logData() {
        this.debugger.logWithPrefix(this.data);
    }

    /**
     * Log a change application fail arror
     * @param {Change} change change to log
     */
    logChangeFail(change) {
        this.debugger.logWithPrefix(change.toString + ' failed to apply because field does not accept this kind of change!');
    }

    /**
     * Log an invalid change field error
     * @param {Change} change change to log
     */
    logInvalidChangeField(change) {
        this.debugger.logWithPrefix(change.toString + ' failed to apply because the field was not recognized!');
    }

    /**
     * Log an invalid field error
     * @param {string} field invalid field 
     */
    logInvalidGetField(field) {
        this.debugger.logWithPrefix('"' + field + '" is not a valid field!');
    }

    /**
     * Check if document exists already in the database
     * @returns Whether or not doc exists on DB
     */
    async documentExists() {
        if (!this.docRef || !this.documentId) {
            return false;
        }
        const docSnap = await getDoc(this.docRef);
        return docSnap.exists();
    }

    /**
    * Fetch data from database by document reference
    * @returns {Object} data from document snapshot
    */
    async fetchData() {
        this.debugger.logWithPrefix("Fetching object data...");
        return new Promise(async (resolve) => {
            this.fetched = true;
            if (!this.documentId) {
                this.debugger.logWithPrefix("No document Id! Setting empty data...");
                this.data = this.getEmptyData();
                resolve(this.getEmptyData());
            } else {
                const docSnap = await getDoc(this.docRef);
                if (docSnap.exists()) {
                    this.data = docSnap.data();
                    resolve(docSnap.data());
                } else {
                    this.debugger.logWithPrefix("Document snapshot didn't exist! Setting empty data...");
                    this.data = this.getEmptyData();
                    resolve(this.getEmptyData());
                }
            }
        })
    }

    /**
     * Fetch data several times until either timeout or document exists
     * @param {Number} maxAttempts number of times to try fetching data
     * @param {Number} delay delay in milliseconds between attempts
     */
    async fetchDataAndRetry(maxAttempts, delay) {
        async function fetchRecursive(fetchAttempts) {
            return new Promise(async (resolve) => {
                if (!this.docRef) {
                    this.debugger.logWithPrefix("No document Id! Setting empty data...");
                    this.data = this.getEmptyData();
                    resolve(false);
                } else {
                    const docSnap = await getDoc(this.docRef);
                    if (docSnap.exists()) {
                        this.data = docSnap.data();
                        this.fetched = true;
                        resolve(docSnap.data());
                    } else {
                        this.debugger.logWithPrefix("No document with this ID exists on DB.");
                        if (fetchAttempts > maxAttempts) {
                            resolve(null);
                        } else {
                            this.debugger.logWithPrefix("Didn't find data on attempt " + (fetchAttempts + 1));
                            setTimeout(() => {
                                resolve(fetchRecursive(fetchAttempts + 1));
                            }, delay);
                        }
                    }
                }
            })
        }
        fetchRecursive(0).then((result) => {
            return result;
        });
    }

    /**
     * Get data from ObjectManager.
     * @returns {Object} data
     */
    getData() {
        if (this.data) {
            return this.data;
        } else {
            if (!this.fetched) {
                this.debugger.logWithPrefix("We need to fetch data first... Fetching!");
                return this.fetchData();
            } else {
                this.debugger.logWithPrefix("getData() returned null AFTER fetching!");
            }
        }
    }

    /**
     * Push changes on this object to the DB
     * @returns a promise resolved with a DocumentReference pointing to the object in the database
     */
    async push() {
        if (!this.error) {
            // Assuming everything was OK, we push
            return new Promise(async (resolve) => {
                if (this.changed) {
                    this.debugger.logWithPrefix('Applying changes to: ' + this.toString());   
                    await this.applyChanges();
                    if (this.documentId) {
                        // Document has an ID. Set data and return true                 
                        this.debugger.logWithPrefix('Pushing changes to: ' + this.toString());
                        await setDoc(this.docRef, this.data);
                    } else {
                        this.debugger.logWithPrefix("No document id. Creating new document.");
                        const newDoc = await addDoc(collection(firestore, this.getCollection()), this.data);
                        this.documentId = newDoc.id;
                        this.docRef = newDoc;
                        this.debugger.logWithPrefix('Created new object of type" ' + this.objectType + '" with id "' + this.documentId + '"');
                    }
                    resolve(this.docRef);
                } else {
                    this.debugger.logWithPrefix("No changes were made to: " + this.toString());
                    resolve(null);
                }
            })
        } else {
            // Don't push if there was an error
            this.debugger.logWithPrefix("Error detected in objectManager: " + this.toString());
            this.debugger.logWithPrefix("Changes will not be pushed!");
            return null;
        }
    }

    /**
     * Log no data error and return passed in value
     * @param {anything} retval value to return from
     * @returns value passed into method
     */
    logNoDataError(retval) {
        this.debugger.logWithPrefix("Error! Failed to return data to subclass.");
        this.error = true;
        return retval;
    }

    /**
     * Compare method for ObjectManagers
     * @param {ObjectManager} objectManager ObjectManager to compare
     * @returns whether or not the ObjectManagers are equivilant
     */
    equals(objectManager) {
        const matchingTypes = objectManager.getObjectType() === this.getObjectType();
        const matchingIds = objectManager.getObjectId() === this.getObjectId();
        return matchingTypes && matchingIds;
    }

    /**
     * Delete object's document on the database
     * @returns A promise resolved when the document is deleted
     */
    async deleteDocument() {
        return new Promise(async (resolve, reject) => {
            const docExists = await this.documentExists();
            if (!docExists) {
                this.debugger.logWithPrefix("Cannot delete document because the reference doesn't exist!");
                resolve(false);
            } else {
                await deleteDoc(this.docRef);
                resolve(true);
            }
        })
    }

    /**
     * Return whether or not this ObjectManager has fetched from DB yet
     * @returns boolean whether or not this ObjectManager has fetched from DB
     */
    hasFetched() {
        return this.fetched;
    }
}