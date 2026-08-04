// Component Imports
import { MinimalTopbar, UserTopbar } from "../resources/Topbars";

// API Imports
import { SessionManager } from "../../api/sessionManager";

export default function Topbar() {
  if (!SessionManager.userFullySignedIn()) {
    // We're not signed in, so make the minimal topbar
    return (
      <MinimalTopbar />
    );
  }
  // Signed in, so set user vars and return detail topbar
  return (
    <UserTopbar />
  );
}
