import { SessionManager } from "../api/sessionManager";

/**
 * Test user object for signing in and out
 */
export const testUser = {
    uid: "testUser",
    displayName: "Test User",
    email: "test@example.com",
    phoneNumber: "+11234567890",
    profilePictureUrl: "google.com",
    emailVerified: false,
    metadata: {
        createdAt: "testTime",
        creationTime: "testTime",
        lastLoginAt: "testTime",
        lastSignInTime: "testTime",
    },
}

/**
 * Create test user on localStorage
 */
export function signInTestUser() {
    const sessionManager = new SessionManager(testUser);
    sessionManager.saveToLS();
}

/**
 * Remove test user from localStorage
 */
export function signOutTestUser() {
    SessionManager.clearLS();
}