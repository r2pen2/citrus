import { SessionManager } from "./sessionManager";

export class Debugger {

    static controllerObjects = {
        ROUTEMANAGER: "routeManager",
        DBMANAGER: "dbManager",
        OBJECTMANAGER: "objectManager",
        OBJECTMANAGERGROUP: "objectManagerGroup",
        OBJECTMANAGERINVITATION: "objectManagerInvitation",
        OBJECTMANAGERTRANSACTION: "objectManagerTransaction",
        OBJECTMANAGERUSER: "objectManagerUser",
        BROWSERMANAGER: "browserManager",
        SESSIONMANAGER: "sessionManager",
    };

    /**
     * Debugger that can be turned on and off by using setDebugMode()
     * Can also be tied to another manager to log with a prefix
     */
    constructor(_controllerObject) {
        this.controllerObject = _controllerObject;
    }

    getControllerPrefix() {
        switch (this.controllerObject) {
            case Debugger.controllerObjects.ROUTEMANAGER:
                return "[Route Manager]: ";
            case Debugger.controllerObjects.DBMANAGER:
                return "[DB Manager]: ";
            case Debugger.controllerObjects.OBJECTMANAGER:
                return "[Object Manager]: ";
            case Debugger.controllerObjects.OBJECTMANAGERGROUP:
                return "[Object Manager <Group>]: ";
            case Debugger.controllerObjects.OBJECTMANAGERINVITATION:
                return "[Object Manager <Invitation>]: ";
            case Debugger.controllerObjects.OBJECTMANAGERTRANSACTION:
                return "[Object Manager <Transaction>]: ";
            case Debugger.controllerObjects.OBJECTMANAGERUSER:
                return "[Object Manager <User>]: ";
            case Debugger.controllerObjects.BROWSERMANAGER:
                return "[Browser Manager]: ";
            case Debugger.controllerObjects.SESSIONMANAGER:
                return "[Session Manager]: ";
            default:
                return "[Undefined Manager]: ";
        }
    }

    /**
     * Set value of debug mode
     * @param {boolean} bool new debug mode value
     */
    static setDebugMode(bool) {
        console.log("Debug mode is now " + (bool ? "on" : "off"));
        SessionManager.setDebugMode(bool);
    }

    /**
     * Log a message if debug mode is on
     * @param {string} message message to console.log()
     */
    static log(message) {
        if (SessionManager.getDebugMode()) {
            console.log(message);
        }
    }

    static logSession() {
        this.log(SessionManager.getJSON())
    }

    /**
     * Log a message with manager prefix if debug mode is on
     * @param {string} message message to console.log() with a prefix
     */
    logWithPrefix(message) {
        console.log(this.getControllerPrefix() + message);
    }
}