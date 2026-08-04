import { Debugger } from "./debugger";
import { DBManager } from "./db/dbManager";

const browserManagerDebugger = new Debugger(Debugger.controllerObjects.BROWSERMANAGER);

export class BrowserManager {
    static setTitle(pageTitle) {    
        // browserManagerDebugger.logWithPrefix("Setting document title to Citrus | " + pageTitle);
        document.title = "Citrus | " + pageTitle;
    }

    static setTitleNoPrefix(pageTitle) {
        // browserManagerDebugger.logWithPrefix("Setting document title to " + pageTitle);
        document.title = pageTitle;
    }

    static async setTransactionTitleFromURL() {
        const params = new URLSearchParams(window.location.search);
        const transactionId = params.get("id");
        const transactionManager = DBManager.getTransactionManager(transactionId);
        const transactionTitle = await transactionManager.getTitle();
        BrowserManager.setTitleNoPrefix(transactionTitle);
    }
}