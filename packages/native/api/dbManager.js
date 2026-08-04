// Library Imports
import firestore from "@react-native-firebase/firestore";

/**
 * @class Superclass extended by all Changes ({@link Add}. {@link Remove}. {@link Set}. {@link Update})
 * @classdesc Superclass
 */
class Change {
  /**
   * Enum for change types
   * @readonly
   * @private
   * @enum {string}
   */
  static changeTypes = {
    SET: "set",
    REMOVE: "remove",
    ADD: "add",
    UPDATE: "update",
  };

  /**
   * @constructor
   * @param {changeTypes} _type type of change from {@link changeTypes} 
   * @param {string} _field field that this change is attached to
   * @param {Object} _value value of this change 
   */
  constructor(_type, _field, _value) {
    this.type = _type;    // Set change type
    this.field = _field;  // Set the field that this change is attached to
    this.value = _value;  // Set the value of this change
  }

  /**
   * Detailed toString function
   * @deprecated since 11/8/22: This is old and pretty much useless
   * @returns Terribly long string representation of this change
   */
  toStringVerbose() {
    return `Change of type "${this.type}" on field "${this.field}" with value "${this.value}"`;
  }

  /**
   * Get a string representation of this change
   * @deprecated since 2/14/23: Change.toString() is no longer used anywhere in this project
   * @returns String representation of this change
   */
  toString() {
    return `${this.type}" field: ${this.field} val: ${this.value}`;
  }
}

/**
 * A Change object for setting the value of a field
 * @private
 * @extends Change
 * @see {@link Change}
 */
class Set extends Change {
  /**
   * @constructor
   * @param {string} _field field to set
   * @param {Object} _value new value of field 
   */
  constructor(_field, _newValue) {
    super(Change.changeTypes.SET, _field, _newValue);
  }
}

/**
 * A Change object for adding an object to an array
 * @private
 * @extends Change
 * @see {@link Change}
 */
class Remove extends Change {
  /**
   * @constructor
   * @param {string} _field field to remove an object from
   * @param {Object} _value object to remove 
   */
  constructor(_field, _value) {
    super(Change.changeTypes.REMOVE, _field, _value);
  }
}

/**
 * A Change object for removing an object from an array
 * @private
 * @extends Change
 * @see {@link Change}
 */
class Add extends Change {
  /**
   * @constructor
   * @param {string} _field field to aadd an object to
   * @param {Object} _value object to add
   */
  constructor(_field, _newValue) {
    super(Change.changeTypes.ADD, _field, _newValue);
  }
}

/**
 * A Change object for updating a key in a map 
 * @private
 * @extends Change
 * @see {@link Change}
 */
class Update extends Change {
  /**
   * @constructor
   * @param {string} _field name of map field
   * @param {string} _newKey key of object in map to update
   * @param {Object} _newValue object to place in map at key
   */
  constructor(_field, _newKey, _newValue) {
    super(Change.changeTypes.UPDATE, _field, _newValue);
    this.key = _newKey;
  }
}

/**
 * @class ObjectManager is an abstract class used to standardize higher-level oprations of database objects.
 * It is extended by {@link UserManager}, {@link TransactionManager}, and {@link GroupManager}.
 * @classdesc Abstract class that has methods that must be implemented by subclasses ({@link ObjectManager.handleAdd}, {@link ObjectManager.handleRemove}, 
 * {@link ObjectManager.handleSet}, {@link ObjectManager.handleUpdate}, {@link ObjectManager.handleGet}, and {@link ObjectManager.getEmptyData})
 */
class ObjectManager {
  /**
   * @constructor
   * @param {objectTypes} _objectType type of object to manager
   * @param {string} _documentId id of document on database
   * @default
   * _documentId = null; // This is ok! We'll just create a new document if there's no ID
   */
  constructor(_objectType, _documentId) {
    this.objectType = _objectType;    // Set objectType
    this.documentId = _documentId;    // Set documentId (or null)
    this.docRef = this.documentId ? firestore().collection(this.getCollection()).doc(_documentId) : null;   // Get reference if there's an ID
    this.collectionRef = firestore().collection(this.getCollection());                                      // Get collection reference based on the objectType
    this.error = false;               // Whether or not there's an error in this ObjectManager (hopefully not)
    this.fetched = false;             // Whether or not this ObjectManager has fetched any data  
    this.changes = [];                // A list of all Changes that this ObjectManager has yet to apply
    this.data = this.getEmptyData();  // Data stored in this ObjectManger (specific to subclass)
  }

  /**
   * Add a change to this object
   * @param {Change} change change to add
   */
  addChange(change) {
    this.changed = true;    // Mark that this ObjectManager has been changed
    this.changes.push(change);  // Add change to change array
  }

  /**
   * Handle an {@link Add}
   * @abstract must be implemented by subclass
   */
  handleAdd() { throw new Error('handleAdd must be implemented by subclass!'); }

  /**
   * Handle a {@link Remove}
   * @abstract must be implemented by subclass
   */
  handleRemove() { throw new Error('handleRemove must be implemented by subclass!'); }

  /**
   * Handle a {@link Set}
   * @abstract must be implemented by subclass
   */
  handleSet() { throw new Error('handleSet must be implemented by subclass!'); }

  /**
   * Handle an {@link Update}
   * @abstract must be implemented by subclass
   */
  handleUpdate() { throw new Error('handleUpdate must be implemented by subclass!'); }

  /**
   * Get the value of a field in this ObjectManager
   * @abstract must be implemented by subclass
   */
  handleGet() { throw new Error('handleGet must be implemented by subclass!'); }
  
  /**
   * Set this ObjectManager's data to the default values of whatever {@link DBManager.objectTypes} it is
   * @abstract must be implemented by subclass
   */
  getEmptyData() { throw new Error('getEmptyData must be implemented by subclass!'); }

  /**
   * Apply all changes to this object
   * @async
   * @returns a promise resolved when the changes are applied
   */
  async applyChanges() {
    return new Promise(async (resolve, reject) => {
      if (!this.fetched) {
        // We haven't fetched data for this ObjectManager! Nothing to apply changes to
        await this.fetchData();
      }
      if (!this.data) {
        // After fetching, if there somehow stil isnt any data, reject the promise
        reject(new Error('Failed to fetch document data'));
      } else {
        // Otherwise, loop through this ObjectManager's changes and apply them with the subclass
        for (const change of this.changes) {
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
              break;
          }
        }
        this.changes = [];    // Clear change list
        this.changed = false;   // Mark that there are no changes
        resolve(true);      // Resolve true once changes are applied
      }
    })
  }

  /**
   * Get Firestore collection for current object type
   * @returns {String} firestore collection for object type
   */
  getCollection() {
    switch(this.objectType) {
      case DBManager.objectTypes.GROUP:
        return "groups";
      case DBManager.objectTypes.TRANSACTION:
        return "transactions";
      case DBManager.objectTypes.USER:
        return "users";
      default:
        return null;
    }
  }

  /**
   * Get this ObjectManager's document id
   * @deprecated since 2/28/23: Since this field doesn't rely on database queries, it'll
   * always be available. Using ObjectManager.documentId is just more convenient
   * @returns {String} id of this ObjectManager's firestore document
   */
  getDocumentId() {
    return this.documentId;
  }

  /**
   * Get this ObjectManager's type
   * @deprecated since 2/28/23: Since this field doesn't rely on database queries, it'll
   * always be available. Using ObjectManager.objectType is just more convenient
   * @returns {String} object type
   */
  getObjectType() {
    return this.objectType;
  }

  /**
   * Get a string representation of this ObjectManager
   * @deprecated since 2/14/23: ObjectManager.toString() is no longer used anywhere in this project
   * @returns {String} string representation of the object
   */
  toString() {
    return `ObjectManager of type "${this.objectType}" with id "${this.documentId}"`;
  }

  /**
   * Check if document exists already in the database
   * @async
   * @returns A promise resoved with whether or not doc exists on DB
   */
  async documentExists() {
    return new Promise(async (resolve) => {
      if (!this.docRef) {
        // There's no ref, therefore there's no data associated with this ObjectManager
        resolve(false);
      }
      if (!this.documentId) {
        // There's no ID, therefore there's no data associated with this ObjectManager
        resolve(false);
      }
      // Get this ObjectManager's data from Firestore and return whether or not it exists
      const docSnap = await this.docRef.get();
      if (docSnap.exists) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  /**
  * Fetch data from Firestore by document reference
  * @async
  * @returns a promise resolved with data from document snapshot
  */
  async fetchData() {
    return new Promise(async (resolve) => {
      this.fetched = true;    // Mark that we've fetched data on this ObjectManager
      if (!this.documentId) {   
        this.data = this.getEmptyData();  // There's no documentId, so return empty data
        resolve(this.getEmptyData());
      } else {
        const docSnap = await this.docRef.get();  // Get document data from Firestore
        if (docSnap.exists) {
          this.data = docSnap.data();    // Document exists. Set data and resolve
          resolve(this.data);
        } else {
          this.data = this.getEmptyData(); // Document does not exist. Set default data and resolve
          resolve(this.getEmptyData());
        }
      }
    })
  }

  /**
   * Push changes on this object to the DB
   * @async
   * @returns a promise resolved with a DocumentReference pointing to the object in the database
   */
  async push() {
    if (!this.error) {
      // Assuming everything was OK, we push
      return new Promise(async (resolve, reject) => {
        if (this.changed) {   
          await this.applyChanges();
          if (this.documentId) {
            // Document has an ID. Set data and resolve with existing docRef         
            await this.docRef.set(this.data)
          } else {
            // This is a new document! Push it and resolve with the new docRef
            const newDoc = await this.collectionRef.add(this.data);
            this.documentId = newDoc.id;
            this.docRef = newDoc;
          }
          resolve(this.docRef);
        } else {
          // There were no changes on this document, so just resolve null
          resolve(null);
        }
      })
    } else {
      // Don't push if there was an error
      reject(new Error('Error in ObjectManager blocked push attempt!'));
    }
  }

  /**
   * Returs whether or not ObjectManagers share the same objectType and documentId
   * @param {ObjectManager} objectManager ObjectManager to compare
   * @deprecated since 2/14/23: This isn't used anywhere anymore
   * @returns whether or not the ObjectManagers are equivilant
   */
  equals(objectManager) {
    const matchingTypes = objectManager.objectType === this.objectType;
    const matchingIds = objectManager.documentId === this.documentId;
    return matchingTypes && matchingIds;
  }

  /**
   * Delete object's document on the database
   * @returns A promise resolved when the document is deleted
   * @async
   */
  async deleteDocument() {
    return new Promise(async (resolve) => {
      const docExists = await this.documentExists();
      if (!docExists) {
        // Not worth rejecting since there's nothing to catch. Just resolve false.
        resolve(false);
      } else {
        await this.docRef.delete(); // Delete doc and resolve true
        resolve(true);
      }
    })
  }
}

/**
 * @class ObjectManager for groups
 * @extends ObjectManager
 * @see {@link ObjectManager}
 */
class GroupManager extends ObjectManager {

  /**
   * Create a GroupManager with a given documentId and data (if applicable)
   * @param {string} _id groupId
   * @param {Map<string, Object>} _data any existing data for this group
   * @default
   * data = null; // If data isn't null we'll also declare that the group has fetched already
   */
  constructor(_id, _data) {
    super(DBManager.objectTypes.GROUP, _id);
    if (_data) {
      this.data = _data;
      this.fetched = true;
    }
  }

  /**
   * Enum for GroupManager fields
   * @example
   * @readonly
   * @enum {string}
   */
  fields = {
    CREATEDAT: "createdAt",
    CREATEDBY: "createdBy",
    NAME: "name",
    FAMILYMODE: "familyMode",
    TRANSACTIONS: "transactions",
    USERS: "users",
    FAMILYMULTIPLIERS: "familyMultipliers",
    INVITEDUSERS: "invitedUsers",
  }

  /**
   * Get default data for all fields of a GroupManager
   * @override implements {@link ObjectManager.getEmptyData} from {@link ObjectManager}
   * @returns default data for a GroupManager
   */
  getEmptyData() {
    const empty = {
      createdAt: null,        // {date} When the group was created
      createdBy: null,        // {string} ID of user that created the group
      name: null,             // {string} Name of the group
      familyMode: false,      // {bool} Whether or not family mode ison
      transactions: [],       // {array <- string} IDs of every transaction associated with this group
      users: [],              // {array <- string} IDs of every user in this group
      familyMultipliers: {},  // {map <string, number>} Multiplier for each user when familyMode is true
      invitedUsers: [],       // {array <- string} IDs of every user invited to this group
    }
    return empty;
  }

  /**
   * Handle an {@link Add} as a GroupManager
   * @override implements {@link ObjectManager.handleAdd} from {@link ObjectManager}
   * @returns data after {@link Add} has been applied
   */
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
      case this.fields.INVITEDUSERS:
        if (!data.invitedUsers.includes(change.value)) {  
          data.invitedUsers.push(change.value);
        }
        return data;
      case this.fields.CREATEDAT:
      case this.fields.CREATEDBY:
      case this.fields.NAME:
      case this.fields.FAMILYMODE:
      case this.fields.FAMILYMULTIPLIERS:
      default:
        return data;
    }
  }

  /**
   * Handle a {@link Remove} as a GroupManager
   * @override implements {@link ObjectManager.handleRemove} from {@link ObjectManager}
   * @returns data after {@link Remove} has been applied
   */
  handleRemove(change, data) {
    switch(change.field) {
      case this.fields.TRANSACTIONS:
        data.transactions = data.transactions.filter(transaction => transaction !== change.value);
        return data;
      case this.fields.USERS:
        data.users = data.users.filter(user => user !== change.value);
        return data;
      case this.fields.INVITEDUSERS:
        data.invitedUsers = data.invitedUsers.filter(user => user !== change.value);
        return data;
      case this.fields.CREATEDAT:
      case this.fields.CREATEDBY:
      case this.fields.NAME:
      case this.fields.FAMILYMODE:
      case this.fields.FAMILYMULTIPLIERS:
      default:
        return data;
    }
  }

  /**
   * Handle a {@link Set} as a GroupManager
   * @override implements {@link ObjectManager.handleAdd} from {@link ObjectManager}
   * @returns data after {@link Set} has been applied
   */
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
      case this.fields.FAMILYMODE:
        data.familyMode = change.value;
        return data;
      case this.fields.FAMILYMULTIPLIERS:
        data.familyMultipliers = change.value;
        return data;
      case this.fields.TRANSACTIONS:
      case this.fields.USERS:
      default:
        return data;
    }
  }

  /**
   * Handle an {@link Update} as a GroupManager
   * @override implements {@link ObjectManager.handleAdd} from {@link ObjectManager}
   * @returns data after {@link Update} has been applied
   */
  handleUpdate(change, data) {
    switch(change.field) {
      case this.fields.FAMILYMULTIPLIERS:
        data.familyMultipliers = [change.key] = change.value;
        return data;
      case this.fields.CREATEDAT:
      case this.fields.CREATEDBY:
      case this.fields.NAME:
      case this.fields.FAMILYMODE:
      case this.fields.TRANSACTIONS:
      case this.fields.USERS:
        return data;
      default:
        return data;
    }
  }

  /**
   * Get the value in the requested GroupManager field
   * @param {fields} field GroupManager field 
   * @override implements {@link ObjectManager.handleGet} from {@link ObjectManager}
   * @returns value of field
   */
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
        case this.fields.FAMILYMODE:
          resolve(this.data.familyMode);
          break;
        case this.fields.TRANSACTIONS:
          resolve(this.data.transactions);
          break;
        case this.fields.USERS:
          resolve(this.data.users);
          break;
        case this.fields.FAMILYMULTIPLIERS:
          resolve(this.data.familyMultiplyers);
          break;
        case this.fields.INVITEDUSERS:
          resolve(this.data.invitedUsers);
          break;
        default:
          resolve(null);
          break;
      }
    })
  }

  // ================= Get Methods ================= //
  /**
   * Fetch data and get this GroupManager's createdAt
   * @async
   * @returns a promise resolved with createdAt
   */
  async getCreatedAt() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.CREATEDAT).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this GroupManager's createdBy
   * @async
   * @returns a promise resolved with createdBy
   */
  async getCreatedBy() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.CREATEDBY).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this GroupManager's name
   * @async
   * @returns a promise resolved with name
   */
  async getName() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.NAME).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get whether or not this GroupManager has familyMode enabled
   * @async
   * @returns a promise resolved with familyMode boolean
   */
  async getFamilyMode() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.FAMILYMODE).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this GroupManager's transaction
   * @async
   * @returns a promise resolved with transaction
   */
  async getTransactions() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.TRANSACTIONS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this GroupManager's users
   * @async
   * @returns a promise resolved with users
   */
  async getUsers() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.USERS).then((val) => {
        resolve(val);
      })
    })
  }
  
  /**
   * Fetch data and get this GroupManager's familyMultipliers
   * @async
   * @returns a promise resolved with familyMultipliers
   */
  async getFamilyMultipliers() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.FAMILYMULTIPLIERS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this a specific user in this GroupManager's familyMultiplier
   * @async
   * @param {string} userId ID of user to fetch familyMultiplier for
   * @returns a promise resolved with specific user's familyMultiplier
   */
  async getUserFamilyMultiplier(userId) {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.FAMILYMULTIPLIERS).then((val) => {
        resolve(val[userId] ? val[userId] : {});
      })
    })
  }

  // ================= Set Methods ================= //
  /**
   * Add a {@link Set} for a new createdAt
   * @param {Date} newCreatedAt new createdAt value
   */
  setCreatedAt(newCreatedAt) {
    const createdAtChange = new Set(this.fields.CREATEDAT, newCreatedAt);
    super.addChange(createdAtChange);
  }
  
  /**
   * Add a {@link Set} for a new createdBy
   * @param {string} newCreatedBy new createdBy value
   */
  setCreatedBy(newCreatedBy) {
    const createdByChange = new Set(this.fields.CREATEDBY, newCreatedBy);
    super.addChange(createdByChange);
  }
  
  /**
   * Add a {@link Set} for a new name
   * @param {string} newName new name value
   */
  setName(newName) {
    const nameChange = new Set(this.fields.NAME, newName);
    super.addChange(nameChange);
  }
  
  /**
   * Add a {@link Set} for a new familyMode
   * @param {boolean} newFamilyMode new familyMode value
   */
  setFamilyMode(newFamilyMode) {
    const familyModeChange = new Set(this.fields.FAMILYMODE, newFamilyMode);
    super.addChange(familyModeChange);
  }

  /**
   * Add a {@link Set} for a new familyMultipliers map
   * @param {Map<string, number>} newFamilyMultipliers new familyMultipliers map
   */
  setFamilyMultipliers(newFamilyMultipliers) {
    const familyMultipliersChange = new Set(this.fields.FAMILYMULTIPLIERS, newFamilyMultipliers);
    super.addChange(familyMultipliersChange);
  }
  // ================= Add Methods ================= //
  /**
   * Add an {@link Add} for a new transaction
   * @param {string} transactionId ID of transaction to add
   */
  addTransaction(transactionId) {
    const transactionAddition = new Add(this.fields.TRANSACTIONS, transactionId);
    super.addChange(transactionAddition);
  }

  /**
   * Add an {@link Add} for a new user
   * @param {string} userId ID of user to add
   */
  addUser(userId) {
    const userAddition = new Add(this.fields.USERS, userId);
    super.addChange(userAddition);
  }

  /**
   * Add an {@link Add} for a new invitedUser
   * @param {string} userId ID of invitedUser to add
   */
  addInvitedUser(userId) {
    const invitedUserAddition = new Add(this.fields.INVITEDUSERS, userId);
    super.addChange(invitedUserAddition);
  }

  // ================= Remove Methods ================= //
  /**
   * Add a {@link Remove} for a transaction
   * @param {string} transactionId ID of transaction to remove
   */
  removeTransaction(transactionId) {
    const transactionRemoval = new Remove(this.fields.TRANSACTIONS, transactionId);
    super.addChange(transactionRemoval);
  }

  /**
   * Add a {@link Remove} for a user
   * @param {string} userId ID of user to remove
   */
  removeUser(userId) {
    const userRemoval = new Remove(this.fields.USERS, userId);
    super.addChange(userRemoval);
  }

  /**
   * Add a {@link Remove} for a invitedUser
   * @param {string} userId ID of invitedUser to remove
   */
  removeInvitedUser(userId) {
    const invitedUserRemoval = new Remove(this.fields.INVITEDUSERS, userId);
    super.addChange(invitedUserRemoval);
  }

  // ================= Update Methods ================= // 
  /**
   * Add an {@link Update} for a new familyMultiplier
   * @param {string} key ID of user to update familyMultiplier for
   * @param {Object} balance new familyMultiplier to place at key
   */
  updateFamilyMultiplier(key, multiplier) {
    const familyMultiplierUpdate = new Update(this.fields.FAMILYMULTIPLIERS, key, multiplier);
    super.addChange(familyMultiplierUpdate);
  }

}

/**
 * @class ObjectManager for users
 * @extends ObjectManager
 * @see {@link ObjectManager}
 */
class UserManager extends ObjectManager {
  
  /**
   * Create a UserManager with a given documentId and data (if applicable)
   * @param {string} _id userId
   * @param {Map<string, Object>} _data any existing data for this user
   * @default
   * data = null; // If data isn't null we'll also declare that the user has fetched already
   */
  constructor(_id, _data) {
    super(DBManager.objectTypes.USER, _id);
    if (_data) {
      this.data = _data;
      this.fetched = true;
    }
  }
  
  /**
   * Enum for UserManager fields
   * @example
   * @readonly
   * @enum {string}
   */
  fields = {
    FRIENDS: "friends",
    GROUPS: "groups",
    TRANSACTIONS: "transactions",
    RELATIONS: "relations",
    CREATEDAT: "createdAt",
    DISPLAYNAME: "displayName",
    PHONENUMBER: "phoneNumber",
    EMAIL: "email",
    PFPURL: "pfpUrl",
    NOTIFICATIONS: "notifications",
    MUTEDGROUPS: "mutedGroups",
    MUTEDUSERS: "mutedUsers",
    GROUPINVITATIONS: "groupInvitations",
    INCOMINGFRIENDREQUESTS: "incomingFriendRequests",
    OUTGOINGFRIENDREQUESTS: "outgoingFriendRequests",
  }

  /**
   * Get default data for all fields of a UserManager
   * @override implements {@link ObjectManager.getEmptyData} from {@link ObjectManager}
   * @returns default data for a UserManager
   */
  getEmptyData() {
    const empty = {
      friends: [],                  // {array} IDs of friends the user has added
      groups: [],                   // {array} IDs of groups the user is in
      transactions: [],             // {array} IDs of all transactions user was in
      relations: {},                // {map} Map of userIds and their respective relations
      metadata: {                   // {map} Metadata associated with user
        createdAt: null,            // --- {date} When the user was created
      },  
      personalData: {               // {map} Personal data associated with user
        displayName: null,          // --- {string} User's display name
        displayNameSearchable: null,// --- {string} User's display name all lowercase
        phoneNumber: null,          // --- {string} User's phone number
        email: null,                // --- {string} User's email
        pfpUrl: null,               // --- {string} URL of user's profile photo
      },
      notifications: {},            // {map} Map of notification types and their targets 
      mutedGroups: [],              // {array} IDs of groups the user wants to ignore notifications from
      mutedUsers: [],               // {array} IDs of users the user wants to ignore notifications from
      groupInvitations: [],         // {array} IDs of groups the user has been invited to
      incomingFriendRequests: [],   // {array} IDs of people that have requested to be friends
      outgoingFriendRequests: [],   // {array} IDs of people this user wants to be friends with
    }
    return empty;
  }

  /**
   * Handle an {@link Add} as a UserManager
   * @override implements {@link ObjectManager.handleAdd} from {@link ObjectManager}
   * @returns data after {@link Add} has been applied
   */
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
      case this.fields.TRANSACTIONS:
        if (!data.transactions.includes(change.value)) {  
          data.transactions.push(change.value);
        }
        return data;
      case this.fields.NOTIFICATIONS:
        if (!data.notifications[change.value.type]) {
          data.notifications[change.value.type] = {};
        }
        if (!data.notifications[change.value.type][change.value.target]) {
          // We don't have a notification of this type for this target
          data.notifications[change.value.type][change.value.target] = change.value;
        }
        return data;
      case this.fields.MUTEDGROUPS:
        if (!data.mutedGroups.includes(change.value)) {  
          data.mutedGroups.push(change.value);
        }
        return data;
      case this.fields.MUTEDUSERS:
        if (!data.mutedUsers.includes(change.value)) {  
          data.mutedUsers.push(change.value);
        }
        return data;
      case this.fields.GROUPINVITATIONS:
        if (!data.groupInvitations.includes(change.value)) {  
          data.groupInvitations.push(change.value);
        }
        return data;
      case this.fields.INCOMINGFRIENDREQUESTS:
        if (!data.incomingFriendRequests.includes(change.value)) {  
          data.incomingFriendRequests.push(change.value);
        }
        return data;
      case this.fields.OUTGOINGFRIENDREQUESTS:
        if (!data.outgoingFriendRequests.includes(change.value)) {  
          data.outgoingFriendRequests.push(change.value);
        }
        return data;
      case this.fields.RELATIONS:
      case this.fields.CREATEDAT:
      case this.fields.DISPLAYNAME:
      case this.fields.PHONENUMBER:
      case this.fields.EMAIL:
      case this.fields.PFPURL:
      default:
        return data;
    }
  }

  /**
   * Handle a {@link Remove} as a UserManager
   * @override implements {@link ObjectManager.handleRemove} from {@link ObjectManager}
   * @returns data after {@link Remove} has been applied
   */
  handleRemove(change, data) {
    switch(change.field) {
      case this.fields.FRIENDS:
        data.friends = data.friends.filter(friend => friend !== change.value);
        return data;
      case this.fields.GROUPS:
        data.groups = data.groups.filter(group => group !== change.value);
        return data;
      case this.fields.TRANSACTIONS:
        data.transactions = data.transactions.filter(transaction => transaction !== change.value);
        return data;
      case this.fields.RELATIONS:
        delete data.relations[change.value];
        return data;
      case this.fields.NOTIFICATIONS:
        if (data.notifications[change.value.type]) {
          // There's a bucket for this notification type
          // Delete entry with this target
          delete data.notifications[change.value.type][change.value.target];
        }
        return data;
      case this.fields.MUTEDGROUPS:
        data.mutedGroups = data.mutedGroups.filter(mg => mg !== change.value);
        return data;
      case this.fields.MUTEDUSERS:
        data.mutedUsers = data.mutedUsers.filter(mu => mu !== change.value);
        return data;
      case this.fields.GROUPINVITATIONS:
        data.groupInvitations = data.groupInvitations.filter(mu => mu !== change.value);
        return data;
      case this.fields.INCOMINGFRIENDREQUESTS:
        data.incomingFriendRequests = data.incomingFriendRequests.filter(mu => mu !== change.value);
        return data;
      case this.fields.OUTGOINGFRIENDREQUESTS:
        data.outgoingFriendRequests = data.outgoingFriendRequests.filter(mu => mu !== change.value);
        return data;
      case this.fields.CREATEDAT:
      case this.fields.DISPLAYNAME:
      case this.fields.PHONENUMBER:
      case this.fields.EMAIL:
      case this.fields.PFPURL:
      default:
        return data;
    }
  }

  /**
   * Handle a {@link Set} as a UserManager
   * @override implements {@link ObjectManager.handleAdd} from {@link ObjectManager}
   * @returns data after {@link Set} has been applied
   */
  handleSet(change, data) {
    switch(change.field) {
      case this.fields.CREATEDAT:
        data.metadata.createdAt = change.value;
        return data;
      case this.fields.DISPLAYNAME:
        data.personalData.displayName = change.value;
        data.personalData.displayNameSearchable = change.value.toLowerCase().replace(" ", "");
        return data;
      case this.fields.PHONENUMBER:
        data.personalData.phoneNumber = change.value;
        return data;
      case this.fields.EMAIL:
        data.personalData.email = change.value;
        return data;
      case this.fields.PFPURL:
        data.personalData.pfpUrl = change.value;
        return data;
      case this.fields.NOTIFICATIONS:
        data.notifications = change.value;
        return data;
      case this.fields.FRIENDS:
      case this.fields.GROUPS:
      case this.fields.RELATIONS:
      case this.fields.MUTEDGROUPS:
      case this.fields.MUTEDUSERS:
      case this.fields.GROUPINVITATIONS:
      case this.fields.INCOMINGFRIENDREQUESTS:
      case this.fields.OUTGOINGFRIENDREQUESTS:
      default:
        return data;
    }
  }

  /**
   * Handle an {@link Update} as a UserManager
   * @override implements {@link ObjectManager.handleAdd} from {@link ObjectManager}
   * @returns data after {@link Update} has been applied
   */
  handleUpdate(change, data) {
    switch(change.field) {
      case this.fields.RELATIONS:
        data.relations[change.key] = change.value;
        return data;
      case this.fields.FRIENDS:
      case this.fields.GROUPS:
      case this.fields.TRANSACTIONS:
      case this.fields.CREATEDAT:
      case this.fields.NOTIFICATIONS:
      case this.fields.MUTEDGROUPS:
      case this.fields.MUTEDUSERS:
      case this.fields.DISPLAYNAME:
      case this.fields.PHONENUMBER:
      case this.fields.EMAIL:
      case this.fields.PFPURL:
      case this.fields.GROUPINVITATIONS:
      case this.fields.INCOMINGFRIENDREQUESTS:
      case this.fields.OUTGOINGFRIENDREQUESTS:
      default:
        return data;
    }
  }

  /**
   * Get the value in the requested UserManager field
   * @param {fields} field UserManager field 
   * @override implements {@link ObjectManager.handleGet} from {@link ObjectManager}
   * @returns value of field
   */
  async handleGet(field) {
    return new Promise(async (resolve, reject) => {
      if (!this.fetched || !this.data) {
        await super.fetchData();
      }
      switch(field) {
        case this.fields.CREATEDAT:
          resolve(this.data.metadata.createdAt);
          break;
        case this.fields.NOTIFICATIONS:
          resolve(this.data.notifications);
          break;
        case this.fields.MUTEDGROUPS:
          resolve(this.data.mutedGroups);
          break;
        case this.fields.DISPLAYNAME:
          resolve(this.data.personalData.displayName);
          break;
        case this.fields.MUTEDUSERS:
          resolve(this.data.mutedUsers);
          break;
        case this.fields.PHONENUMBER:
          resolve(this.data.personalData.phoneNumber);
          break;
        case this.fields.EMAIL:
          resolve(this.data.personalData.email);
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
        case this.fields.TRANSACTIONS:
          resolve(this.data.transactions);
          break;
        case this.fields.RELATIONS:
          resolve(this.data.relations);
          break;
        case this.fields.GROUPINVITATIONS:
          resolve(this.data.groupInvocations);
          break;
        case this.fields.INCOMINGFRIENDREQUESTS:
          resolve(this.data.incomingFriendRequests);
          break;
        case this.fields.OUTGOINGFRIENDREQUESTS:
          resolve(this.data.relations);
          break;
        default:
          resolve(null);
          break;
      }
    })
  }

  // ================= Get Methods ================= //
  /**
   * Fetch data and get this UserManager's friends
   * @async
   * @returns a promise resolved with friends
   */
  async getFriends() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.FRIENDS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's groups
   * @async
   * @returns a promise resolved with groups
   */
  async getGroups() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.GROUPS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's transactions
   * @async
   * @returns a promise resolved with transactions
   */
  async getTransactions() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.TRANSACTIONS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's createdAt
   * @async
   * @returns a promise resolved with createdAt
   */
  async getCreatedAt() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.CREATEDAT).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's notifications
   * @async
   * @returns a promise resolved with notifications
   */
  async getNotifications() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.NOTIFICATIONS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's mutedGroups
   * @async
   * @returns a promise resolved with mutedGroups
   */
  async getMutedGroups() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.MUTEDGROUPS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's displayName
   * @async
   * @returns a promise resolved with displayName
   */
  async getDisplayName() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.DISPLAYNAME).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's mutedUsers
   * @async
   * @returns a promise resolved with mutedUsers
   */
  async getMutedUsers() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.MUTEDUSERS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's phoneNumber
   * @async
   * @returns a promise resolved with phoneNumber
   */
  async getPhoneNumber() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.PHONENUMBER).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's email
   * @async
   * @returns a promise resolved with email
   */
  async getEmail() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.EMAIL).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's pfpUrl
   * @async
   * @returns a promise resolved with pfpUrl
   */
  async getPfpUrl() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.PFPURL).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's relations
   * @async
   * @returns a promise resolved with relations
   */
  async getRelations() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.RELATIONS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's groupInvitations
   * @async
   * @returns a promise resolved with groupInvitations
   */
  async getGroupInvitations() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.GROUPINVITATIONS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's incomingFriendRequests
   * @async
   * @returns a promise resolved with incomingFriendRequests
   */
  async getIncomingFriendRequests() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.INCOMINGFRIENDREQUESTS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's outgoingFriendRequests
   * @async
   * @returns a promise resolved with outgoingFriendRequests
   */
  async getOutgoingFriendRequests() {
    return new Promise(async (resolve) => {
      this.handleGet(this.fields.OUTGOINGFRIENDREQUESTS).then((val) => {
        resolve(val);
      })
    })
  }

  /**
   * Fetch data and get this UserManager's relation with a specific user
   * @async
   * @param {string} userId ID of user to get relation with
   * @returns a promise resolved with relation to a specific user
   */
  async getRelationWithUser(userId) {
    await this.fetchData();
    return new Promise(async (resolve) => {
      const allRelations = await this.getRelations();
      let found = false;
      for (const key of Object.entries(allRelations)) {
        if (key[0] === userId) {
          found = true;
          resolve(new UserRelation(key[1]));
        }
      }
      if (!found) {
        resolve( new UserRelation());
      }
    })
  }

  // ================= Set Methods ================= //
  /**
   * Add a {@link Set} for a new createdAt
   * @param {Date} newCreatedAt new createdAt value
   */
  setCreatedAt(newCreatedAt) {
    const createdAtChange = new Set(this.fields.CREATEDAT, newCreatedAt);
    super.addChange(createdAtChange);
  }

  /**
   * Add a {@link Set} for a new displayName
   * @param {string} newDisplayName new displayName value
   */
  setDisplayName(newDisplayName) {
    const displayNameChange = new Set(this.fields.DISPLAYNAME, newDisplayName);
    super.addChange(displayNameChange);
  }
  
  /**
   * Add a {@link Set} for a new phoneNumber
   * @param {string} newPhoneNumber new phoneNumber value
   */
  setPhoneNumber(newPhoneNumber) {
    const phoneNumberChange = new Set(this.fields.PHONENUMBER, newPhoneNumber);
    super.addChange(phoneNumberChange);
  }
  
  /**
   * Add a {@link Set} for a new email
   * @param {string} newEmail new email value
   */
  setEmail(newEmail) {
    const emailChange = new Set(this.fields.EMAIL, newEmail);
    super.addChange(emailChange);
  }
  
  /**
   * Add a {@link Set} for a new pfpUrl
   * @param {string} newProfilePictureUrl new pfpUrl value
   */
  setPfpUrl(newProfilePictureUrl) {
    const photoUrlChange = new Set(this.fields.PFPURL, newProfilePictureUrl);
    super.addChange(photoUrlChange);
  }
  
  /**
   * Add a {@link Set} for a new notifications list
   * @param {List<Object>} newNotifications new notifications list
   */
  setNotifications(newNotifications) {
    const notificationsChange = new Set(this.fields.NOTIFICATIONS, newNotifications);
    super.addChange(notificationsChange);
  }

  // ================= Update Methods ================= // 
  /**
   * Add an {@link Update} for a new relation
   * @param {string} key ID of user to update relation for
   * @param {Object} relation new relation to place at key
   */
  updateRelation(key, relation) {
    const relationUpdate = new Update(this.fields.RELATIONS, key, relation.toJson());
    super.addChange(relationUpdate);
  }

  // ================= Add Methods ================= //
  /**
   * Add an {@link Add} for a new friend
   * @param {string} friendId ID of friend to add
   */
  addFriend(friendId) {
    const friendAddition = new Add(this.fields.FRIENDS, friendId);
    super.addChange(friendAddition);
  }
  
  /**
   * Add an {@link Add} for a new group
   * @param {string} groupId ID of group to add
   */
  addGroup(groupId) {
    const groupAddition = new Add(this.fields.GROUPS, groupId);
    super.addChange(groupAddition);
  }
  
  /**
   * Add an {@link Add} for a new transaction
   * @param {string} transactionId ID of transaction to add
   */
  addTransaction(transactionId) {
    const transactionAddition = new Add(this.fields.TRANSACTIONS, transactionId);
    super.addChange(transactionAddition);
  }

  /**
   * Add an {@link Add} for a new notification
   * @param {string} notification of notification to add
   */
  addNotification(notification) {
    const notificationAddition = new Add(this.fields.NOTIFICATIONS, notification);
    super.addChange(notificationAddition);
  }

  /**
   * Add an {@link Add} for a new mutedGroup
   * @param {string} groupId ID of mutedGroup to add
   */
  addMutedGroup(groupId) {
    const mutedGroupAddition = new Add(this.fields.MUTEDGROUPS, groupId);
    super.addChange(mutedGroupAddition);
  }

  /**
   * Add an {@link Add} for a new mutedUser
   * @param {string} userId ID of mutedUser to add
   */
  addMutedUser(userId) {
    const mutedUserAddition = new Add(this.fields.MUTEDUSERS, userId);
    super.addChange(mutedUserAddition);
  }

  /**
   * Add an {@link Add} for a new groupInvitation
   * @param {string} groupId ID of groupInvitation to add
   */
  addGroupInvitation(groupId) {
    const groupInvitationAddition = new Add(this.fields.GROUPINVITATIONS, groupId);
    super.addChange(groupInvitationAddition);
  }
  
  /**
   * Add an {@link Add} for a new incomingFriendRequest
   * @param {string} userId ID of sender of incomingFriendRequest to add
   */
  addIncomingFriendRequest(userId) {
    const incomingFriendRequestAddition = new Add(this.fields.INCOMINGFRIENDREQUESTS, userId);
    super.addChange(incomingFriendRequestAddition);
  }
  
  /**
   * Add an {@link Add} for a new outgoingFriendRequest
   * @param {string} userId ID of target of outgoingFriendRequest to add
   */
  addOutgoingFriendRequest(userId) {
    const outgoingFriendRequestAddition = new Add(this.fields.OUTGOINGFRIENDREQUESTS, userId);
    super.addChange(outgoingFriendRequestAddition);
  }

  // ================= Remove Methods ================= //
  /**
   * Add a {@link Remove} for a friend
   * @param {string} friendId ID of friend to remove
   */
  removeFriend(friendId) {
    const friendRemoval = new Remove(this.fields.FRIENDS, friendId);
    super.addChange(friendRemoval);
  }
  
  /**
   * Add a {@link Remove} for a group
   * @param {string} groupId ID of group to remove
   */
  removeGroup(groupId) {
    const groupRemoval = new Remove(this.fields.GROUPS, groupId);
    super.addChange(groupRemoval);
  }
  
  /**
   * Add a {@link Remove} for a transaction
   * @param {string} transactionId ID of transaction to remove
   */
  removeTransaction(transactionId) {
    const transactionRemoval = new Remove(this.fields.TRANSACTIONS, transactionId);
    super.addChange(transactionRemoval);
  }

  /**
   * Add a {@link Remove} for a relation
   * @param {string} relationUserId ID of user to remove relation for
   */
  removeRelation(relationUserId) {
    const relationRemoval = new Remove(this.fields.RELATIONS, relationUserId);
    super.addChange(relationRemoval);
  }

  /**
   * Add a {@link Remove} for a notification
   * @param {Map<string, Object>} notificataion notification to remove
   */
  removeNotification(notification) {
    const notificationRemoval = new Remove(this.fields.NOTIFICATIONS, notification);
    super.addChange(notificationRemoval);
  }

  /**
   * Add a {@link Remove} for a mutedGroup
   * @param {string} groupId ID of mutedGroup to remove
   */
  removeMutedGroup(groupId) {
    const mutedGroupRemoval = new Remove(this.fields.MUTEDGROUPS, groupId);
    super.addChange(mutedGroupRemoval);
  }

  /**
   * Add a {@link Remove} for a mutedUser
   * @param {string} userId ID of mutedUser to remove
   */
  removeMutedUser(userId) {
    const mutedUserRemoval = new Remove(this.fields.MUTEDUSERS, userId);
    super.addChange(mutedUserRemoval);
  }

  /**
   * Add a {@link Remove} for a groupInvitation
   * @param {string} groupId ID of groupInvitation to remove
   */
  removeGroupInvitation(groupId) {
    const groupInvitationRemoval = new Remove(this.fields.GROUPINVITATIONS, groupId);
    super.addChange(groupInvitationRemoval);
  }

  /**
   * Add a {@link Remove} for a incomingFriendRequest
   * @param {string} userId ID of sender of incomingFriendRequest to remove
   */
  removeIncomingFriendRequest(userId) {
    const incomingFriendRequestRemoval = new Remove(this.fields.INCOMINGFRIENDREQUESTS, userId);
    super.addChange(incomingFriendRequestRemoval);
  }

  /**
   * Add a {@link Remove} for a outgoingFriendRequest
   * @param {string} userId ID of target of outgoingFriendRequest to remove
   */
  removeOutgoingFriendRequest(userId) {
    const outgoingFriendRequestRemoval = new Remove(this.fields.OUTGOINGFRIENDREQUESTS, userId);
    super.addChange(outgoingFriendRequestRemoval);
  }
}

/**
 * @class ObjectManager for transactions
 * @extends ObjectManager
 * @see {@link ObjectManager}
 */
class TransactionManager extends ObjectManager {

  /**
   * Create a TransactionManager with a given documentId and data (if applicable)
   * @param {string} _id transactionId
   * @param {Map<string, Object>} _data any existing data for this transaction
   * @default
   * data = null; // If data isn't null we'll also declare that the transaction has fetched already
   */
  constructor(_id, _data) {
    super(DBManager.objectTypes.TRANSACTION, _id);
    if (_data) {
      this.data = _data;
      this.fetched = true;
    }
  }

  /**
   * Enum for TransactionManager fields
   * @example
   * @readonly
   * @enum {string}
   */
  fields = {
    CREATEDBY: "createdBy",
    CURRENCYLEGAL: "currencyLegal",
    CURRENCYTYPE: "currencyType",
    AMOUNT: "amount",
    DATE: "date",
    TITLE: "title",
    BALANCES: "balances",
    GROUP: "group",
    ISIOU: "isIOU",
  }

  /**
   * Get default data for all fields of a TransactionManager
   * @override implements {@link ObjectManager.getEmptyData} from {@link ObjectManager}
   * @returns default data for a TransactionManager
   */
  getEmptyData() {
    const empty = {
      currency: {legal: null, type: null},  // {PaymentType} What type of currency was used (BEER, PIZZA, USD)
      amount: null,                         // {number} How many of that currency was used 
      date: new Date(),                     // {date} Timestamp of transaction
      title: null,                          // {string} Title of transaction
      balances: {},                         // {map<string, number>} Map relating usedIds to how much they are owed/owe for this transaction
      createdBy: null,                      // {string} ID of user that created this transaction
      group: null,                          // {number} ID of this transaction's group (if applicable)
      isIOU: null,                          // {boolean} Whether or not this transaction was an IOU
    }
    return empty;
  }

  /**
   * Handle an {@link Add} as a TransactionManager
   * @override implements {@link ObjectManager.handleAdd} from {@link ObjectManager}
   * @returns data after {@link Add} has been applied
   */
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
      case this.fields.ISIOU:
      default:
        return data;
    }
  }

  /**
   * Handle a {@link Remove} as a TransactionManager
   * @override implements {@link ObjectManager.handleRemove} from {@link ObjectManager}
   * @returns data after {@link Remove} has been applied
   */
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
      default:
        return data;
    }
  }

  /**
   * Handle a {@link Set} as a TransactionManager
   * @override implements {@link ObjectManager.handleAdd} from {@link ObjectManager}
   * @returns data after {@link Set} has been applied
   */
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
      default:
        return data;
    }
  }

  /**
   * Handle an {@link Update} as a TransactionManager
   * @override implements {@link ObjectManager.handleAdd} from {@link ObjectManager}
   * @returns data after {@link Update} has been applied
   */
  handleUpdate(change, data) {
    switch(change.field) {
      case this.fields.BALANCES:
        data.balances[change.key] = change.value;
        return data;
      case this.fields.CURRENCYLEGAL:
      case this.fields.CURRENCYTYPE:
      case this.fields.CREATEDBY:
      case this.fields.AMOUNT:
      case this.fields.DATE:
      case this.fields.TITLE:
      case this.fields.GROUP:
      case this.fields.ISIOU:
      default:
        return data;
    }
  }

  /**
   * Get the value in the requested TransactionManager field
   * @param {fields} field TransactionManager field 
   * @override implements {@link ObjectManager.handleGet} from {@link ObjectManager}
   * @returns value of field
   */
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
        case this.fields.ISIOU:
          resolve(this.data.isIOU);
          break;
        default:
          resolve(null);
          break;
      }
    })
  }

  // ================= Get Methods ================= //
  /**
   * Fetch data and get this TransactionManager's currencyLegal
   * @async
   * @returns a promise resolved with currencyLegal
   */
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

  /**
   * Fetch data and get this TransactionManager's currencyType
   * @async
   * @returns a promise resolved with currencyType
   */
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

  /**
   * Fetch data and get this TransactionManager's createdBy
   * @async
   * @returns a promise resolved with createdBy
   */
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

  /**
   * Fetch data and get this TransactionManager's amount
   * @async
   * @returns a promise resolved with amount
   */
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

  /**
   * Fetch data and get this TransactionManager's date
   * @async
   * @returns a promise resolved with date
   */
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

  /**
   * Fetch data and get this TransactionManager's title
   * @async
   * @returns a promise resolved with title
   */
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

  /**
   * Fetch data and get this TransactionManager's group
   * @async
   * @returns a promise resolved with group
   */
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

  /**
   * Fetch data and get this TransactionManager's balances
   * @async
   * @returns a promise resolved with balances
   */
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

  /**
   * Fetch data and get this TransactionManager's isIOU
   * @async
   * @returns a promise resolved with isIOU
   */
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
  
  // ================= Set Methods ================= //
  /**
   * Add a {@link Set} for a new currencyLegal
   * @param {boolean} newCurrencyLegal new currencyLegal value
   */
  setCurrencyLegal(newCurrencyLegal) {
    const currencyLegalChange = new Set(this.fields.CURRENCYLEGAL, newCurrencyLegal);
    super.addChange(currencyLegalChange);
  }

  /**
   * Add a {@link Set} for a new currencyType
   * @param {string} newCurrencyType new currencyType value
   */
  setCurrencyType(newCurrencyType) {
    const currencyTypeChange = new Set(this.fields.CURRENCYTYPE, newCurrencyType);
    super.addChange(currencyTypeChange);
  }

  /**
   * Add a {@link Set} for a new createdBy
   * @param {string} newCreatedBy new createdBy value
   */
  setCreatedBy(newCreatedBy) {
    const createdByChange = new Set(this.fields.CREATEDBY, newCreatedBy);
    super.addChange(createdByChange);
  }

  /**
   * Add a {@link Set} for a new amount
   * @param {number} newAmount new amount value
   */
  setAmount(newAmount) {
    const amountChange = new Set(this.fields.AMOUNT, newAmount);
    super.addChange(amountChange);
  }
  
  /**
   * Add a {@link Set} for a new date
   * @param {Date} newDate new date value
   */
  setDate(newDate) {
    const dateChange = new Set(this.fields.DATE, newDate);
    super.addChange(dateChange);
  }
  
  /**
   * Add a {@link Set} for a new title
   * @param {string} newTitle new title value
   */
  setTitle(newTitle) {
    const titleChange = new Set(this.fields.TITLE, newTitle);
    super.addChange(titleChange);
  }
  
  /**
   * Add a {@link Set} for a new group
   * @param {string} newGroup new group value
   */
  setGroup(newGroup) {
    const groupChange = new Set(this.fields.GROUP, newGroup);
    super.addChange(groupChange);
  }

  /**
   * Add a {@link Set} for a new isIOU
   * @param {boolean} newIsIOU new isIOU value
   */
  setIsIOU(newIsIOU) {
    const isIOUChange = new Set(this.fields.ISIOU, newIsIOU);
    super.addChange(isIOUChange);
  }

  // ================= Update Methods ================= //
  /**
   * Add an {@link Update} for a new balance
   * @param {string} key ID of user to update balance for
   * @param {Object} balance new balance to place at key
   */
  updateBalance(key, balance) {
    const balanceUpdate = new Update(this.fields.BALANCES, key, balance);
    super.addChange(balanceUpdate);
  }
}

/**
 * @class Class for storing relation data between users in the first person
 * Keeps track of overall debt, debt in each group, transaction history, and when these two users
 * last interacted
 */
export class UserRelation {
  /**
   * @constructor Creates a new UserRelation with any existing data (if applicable)
   * @param {UserRelation} _userRelation An existing UserRelation to copy data from
   * @default
   * userRelation = null;
   */
  constructor(_userRelation) {
    this.balances = _userRelation ? _userRelation.balances : {USD: 0};                // Set balance to 0USD or value of existing UserRelation
    this.groupBalances = _userRelation ? _userRelation.groupBalances : {};            // Set groupBalances to empty map or value of existing UserRelation
    this.history = _userRelation ? _userRelation.history : [];                        // Set history to empty array or value of existing UserRelation
    this.lastInteracted = _userRelation ? _userRelation.lastInteracted : new Date();  // Set lastInteracted to now or value of existing UserRelation
  }

  /**
   * Add a UserRelationHistory to the relation between two users. Update balance, groupBalances,
   * and lastInteracted accordingly.
   * @param {UserRelationHistory} history new history object to track in this UserRelation
   */
  addHistory(history) {
    // Get the JSON representation of this UserRelationHistory so we can upload to Firestore
    const json = history.toJson();
    // Determine which balance was used in this UserRelationHistory
    const balanceType = json.currency.legal ? "USD" : json.currency.type;
    // Update overall map for this UserRelation to include new value for currency used
    this.balances[balanceType] = (this.balances[balanceType] ? this.balances[balanceType] : 0) + json.amount;
    // Mark the current moment as lastInteracted
    this.lastInteracted = new Date();
    
    /**
     * This next part is a bit hard to follow, but bare with me for a moment.
     * 
     * We need to update the debt that these two users have with each other in all of their groups so that
     * user debt and total group debt remain consistent. This used to be done in groups, but it makes more
     * sene to keep track of individual group debts in the UserRelation so that all of debt calculations
     * are done on the same object and so that we can know how much each user owes each other even within
     * the context of a group (not just their total group balance).
     * 
     * We are going to break down the incoming UserRelationHistory and determine where to cancel group debt.
     * 
     * If there is a group assigned to the UserRelationHistory, just update the debt in that group. We want
     * to make sure that any group-specific transactions stay within the context of that group. It is ok for
     * the groupBalance to go negative so long as the group was specified.
     * 
     * If there is no group assigned to the UserRelationHistory, first we detemine if there is a group debt
     * to cancel. We then start eliminating all group debts, starting with the group that has the highest 
     * debt, until we have either spent the entire amount of the UserRelationHistory or all group debts have
     * been cleared.
     * 
     * We then note on the UserRelationHistory any groups in which it impacted the UserRelation groupBalace. 
     */

    if (json.group) {
      // This is the easy part! This UserRelationHistory has a group specified.

      // Make sure that map values for group and groupCurrency are not null
      if (!this.groupBalances[json.group])        { this.groupBalances[json.group] = {}; }
      if (!this.groupBalances[json.group][balanceType])   { this.groupBalances[json.group][balanceType] = 0; }

      // Update the balance with the value from the UserRelationHistory (positive or negative)
      this.groupBalances[json.group][balanceType] += json.amount;

      // Mark that this UserRelationHistory impacted this group's balance
      json.settleGroups[json.group] = json.amount; // And we're done!
    } else {
      // Oh god this sucks
      let amtLeft = json.amount; // Set distribution amount to the value of UserRelationHistory
      
      if (json.amount > 0) {
        // We're gaining money, so we need to cancel debts in groups that we're owed money
        while (amtLeft > 0) {
          // While we still have money to distribute, loop through groups and determine which has the most negative balance for this currency
          let lowestValueGroup = null;
          let lowestValue = 0;
          for (const groupId of Object.keys(this.groupBalances)) {
            if (this.groupBalances[groupId][balanceType] && this.groupBalances[groupId][balanceType] < 0) {
              // This group has a balance of this type and it's < 0!
              if (this.groupBalances[groupId][balanceType] < lowestValue) {
                lowestValue = this.groupBalances[groupId][balanceType];
                lowestValueGroup = groupId;
              }
            }
          }
          // Once we've looked through all groups, determine if there's adjustments to be made
          if (lowestValueGroup) {
            // Here's our lowest value group
            const groupBal = this.groupBalances[lowestValueGroup][balanceType]; // Get value of this balance in this group
            
            // Determine how much we can give to this group
            let amtForGroup = amtLeft;
            if (Math.abs(groupBal) < amtLeft) {
              // This group needs less money than the amount remaining. Only give this group enough money to make balance 0. (Don't go positive)
              amtForGroup = Math.abs(groupBal);
            }
            // Update group balance to new value
            this.groupBalances[lowestValueGroup][balanceType] += amtForGroup;
            // Mark that we put some amount of money into this group
            history.settleGroups[lowestValueGroup] = amtForGroup;
            // Subtract the amount we gave to this group from the amtLeft
            amtLeft -= amtForGroup;
          } else {
            // lowestValueGroup was null, so all group debts are > 0. Stop seeking.
            amtLeft = 0;
          }
        }
      } else {
        // We're losing money, so we need to cancel debts in groups that we owe money
        while (amtLeft > 0) {
          // While we still have money to distribute, loop through groups and determine which has the most positive balance for this currency
          let highestValueGroup = null;
          let highestValue = 0;
          for (const groupId of Object.keys(this.groupBalances)) {
            if (this.groupBalances[groupId][balanceType] && this.groupBalances[groupId][balanceType] > 0) {
              // This group has a balance of this type and it's > 0!
              if (this.groupBalances[groupId][balanceType] > highestValue) {
                highestValue = this.groupBalances[groupId][balanceType];
                highestValueGroup = groupId;
              }
            }
          }
          // Once we've looked through all groups, determine if there's adjustments to be made
          if (highestValueGroup) {
            // Here's our highest value group
            const groupBal = this.groupBalances[highestValueGroup][balanceType];  // Get value of this balance in this group
            
            // Determine how much we can take from this group
            let amtForGroup = amtLeft;
            if (groupBal < amtLeft) {
              // This group has less money than the amount remaining. Only take enough money to make balance 0. (Don't go negative)
              amtForGroup = groupBal;
            }
            // Update group balance to new value
            this.groupBalances[highestValueGroup][balanceType] += amtForGroup;
            // Mark that we put took some amount of money from this group
            history.settleGroups[highestValueGroup] = amtForGroup;
            // Subtrack the amount we gave to this group from the amtLeft
            amtLeft -= amtForGroup;
          } else {
            // highestValuegroup was null, so all group debts are < 0. Stop seeking.
            amtLeft = 0;
          }
        }
      }
    }

    // Finally, push the JSON representation of this UserRelationHistory to the first index of the history array
    this.history.unshift(json);
  }

  /**
   * Get a a list of UserRelationHistory objects, parsed from the JSON stored in the UserRelation history array
   * @returns {List<UserRelationHistory>} parsed JSON from history array
   */
  getHistory() {
    let historyArray = [];
    for (const jsonHistory of this.history) {
      // Make a UserRelationHistory from json and push to array
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
      // Look through entire history array
      if (jsonHistory.transaction === transactionId) {
        // This is the entry to remove
        this.history = this.history.filter(entry => entry.transaction !== transactionId);     // Filter it out by transaction ID
        const balanceType = jsonHistory.currency.legal ? "USD" : jsonHistory.currency.type;   // Get the balance type
        this.balances[balanceType] = this.balances[balanceType] - jsonHistory.amount;       // And update overall balance of that type

        // Update group balances as well
        for (const settleGroup of Object.keys(jsonHistory.settleGroups)) {
          // For each group that this history altered balance in, update that groupBalance
          this.groupBalances[settleGroup][balanceType] -= jsonHistory.settleGroups[settleGroup];  // Update groupBalance of balanceType
        }

        break; // We found the UserRelationHistory! No need to keep searching.
      }
    }
  }

  /**
   * Firestore doesn't allow us to store classes, only JSON objects. Serialize and the UserRelation and return JSON.
   * @returns JSON representation of UserRelation
   */
  toJson() {
    return {
      balances: this.balances,
      history: this.history,
      lastInteracted: this.lastInteracted,
      groupBalances: this.groupBalances
    }
  }
}

/**
 * @class Class for storing transaction data as a change in a UserRelation at a single moment in time
 */
export class UserRelationHistory {
  /**
   * @constructor Creates a UserRelationHistory with existing data (if applicable)
   * @param {UserRelationHistory} _userRelationHistory existing UserRelationHistory to clone
   * @default
   * userRelationHistory = null;
   */
  constructor(_userRelationHistory) {
    this.currency = _userRelationHistory ? _userRelationHistory.currency : {legal: null, type: null};   // "Currency" used in this exchange (USD? BEER? PIZZA?)
    this.amount = _userRelationHistory ? _userRelationHistory.amount : null;              // How many of that currency was used in this exchange
    this.transaction = _userRelationHistory ? _userRelationHistory.transaction : null;          // ID of this exchange's transaction
    this.transactionTitle = _userRelationHistory ? _userRelationHistory.transactionTitle : null;    // Title of this exchange's transaction
    this.group = _userRelationHistory ? _userRelationHistory.group : null;                // ID of this exchange's group (if applicabale)
    this.date = _userRelationHistory ? _userRelationHistory.date : new Date();              // When this exchange occured
    this.settleGroups = _userRelationHistory ? _userRelationHistory.settleGroups : {};          // Any groups that this exchange changed balance in
  }

  /**
   * Set this UserRelationHistory's transactionID value
   * @param {string} transactionId ID of this UserRelationHistory's transaction
   */
  setTransaction(transactionId) {
    this.transaction = transactionId;
  }

  /**
   * Set this UserRelationHistory's transactionTitle value
   * @param {string} newTitle Title of this UserRelationHistory's transaction
   */
  setTransactionTitle(newTitle) {
    this.transactionTitle = newTitle;
  }

  /**
   * Set this UserRelationHistory's currency.legal value
   * @param {boolean} newLegal whether or not this UserRelationHistory's transaction used legal tendor
   */
  setCurrencyLegal(newLegal) {
    this.currency.legal = newLegal;
  }

  /**
   * Set this UserRelationHistory's currency.type value
   * @param {currenctType} newType "Currency" used in this exchange (USD? BEER? PIZZA?)
   */
  setCurrencyType(newType) {
    this.currency.type = newType;
  }

  /**
   * Set this UserRelationHistory's amount value
   * @param {number} amt How many of whatever currency was used in this exchange
   */
  setAmount(amt) {
    this.amount = amt;
  }

  /**
   * Set this UserRelationHistory's group
   * @param {string} groupId group that this UserRelationHistory's transaction was associated with
   */
  setGroup(groupId) {
    this.group = groupId;
  }

  /**
   * Set this UserRelationHistory's date
   * @param {Date} date When this exchange occured
   */
  setDate(date) {
    this.date = date;
  }

  /**
   * Get when this exchange occured
   * @returns date of UserRelationHistory
   */
  getDate() {
    return this.date;
  }

  /**
   * Get UserRelationHistory's value
   * @returns number of whatever currency was used
   */
  getAmount() {
    return this.amount;
  }

  /**
   * Get the transaction associated with this UserRelationHistory
   * @returns ID of this UserRelationHistory's transcation
   */
  getTransaction() {
    return this.transaction;
  }
  
  /**
   * Firestore doesn't allow us to store classes, only JSON objects. Serialize and the UserRelationHistory and return JSON.
   * @returns JSON representation of UserRelationHistory
   */
  toJson() {
    return {
      currency: this.currency,
      amount: this.amount,
      transaction: this.transaction,
      transactionTitle: this.transactionTitle,
      group: this.group,
      date: this.date,
      settleGroups: this.settleGroups
    }
  }
}

/**
 * @class DBManager is a database management factory object. Generates ObjectManagers for whichever object type it may need.
 * @classdesc Singleton object used throughout application
 * @static
 */
export class DBManager {

  /**
   * Enum for database object types
   * @example
   * @readonly
   * @enum {string}
   */
  static objectTypes = {
    GROUP: "group",
    TRANSACTION: "transaction",
    USER: "user",
  }

  /**
  * Generates a random id string of a given length
  * @param {number} length length of id to be created 
  * @deprecated since 2/14/23: There's no use for this method anymore
  * @static
  * @returns {string} generated id
  */
  static generateId(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
      // Up until length, add a random character to the result value
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  
  /**
   * Create a GroupManager for group with given id and data
   * @param {string} id id of group
   * @param {Map<string, Object>} data any existing data for this group
   * @returns new GroupManager
   */
  static getGroupManager(id, data) {
    return new GroupManager(id, data);
  }
  
  /**
   * Create a TransactionManager for transaction with given id and data
   * @param {string} id id of transaction
   * @param {Map<string, Object>} data any existing data for this transaction
   * @returns new TransactionManager
   */
  static getTransactionManager(id) {
    return new TransactionManager(id);
  }

  /**
   * Create a UserManager for user with given id and data
   * @param {string} id id of user
   * @param {Map<string, Object>} data any existing data for this user
   * @returns new UserManager
   */
  static getUserManager(id, data) {
    return new UserManager(id, data);
  }
}
