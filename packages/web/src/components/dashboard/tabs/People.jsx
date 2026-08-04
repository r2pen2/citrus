
// Library imports
import { useState, useEffect, useContext } from "react"

// Component imports
import { Breadcrumbs } from "../../resources/Navigation";
import { PeopleList } from "../../resources/PeopleResources";
import { SortSelector } from "../../resources/PeopleResources";
import { UsersContext } from "../../../App";

// API imports
import { SessionManager } from "../../../api/sessionManager";
import { UserRelation } from "../../../api/db/objectManagers/userManager";
import { UserDetail } from "../../resources/PeopleResources";

export default function People() {

    // Get context from App.js
    const { usersData, setUsersData } = useContext(UsersContext);

    // Define states
    const [sortingScheme, setSortingScheme] = useState(UserRelation.sortingSchemes.BALANCE); // Sort type
    const [relations, setRelations] = useState({
        friends: [], // Relations with friends
        others: [], // Relations with users who aren't friends
        fetched: false, // Whether or not we've loaded user's data (arrays will remain empty if user has no relations)
    });
    const [filter, setFilter] = useState({
        friends: true,  // Whether or not to show relations with friends
        others: true    // Whether or not to show relations with people who aren't friends
    });
    const [focusedUser, setFocusedUser] = useState(null); // ID of user that we'd like to "focus" (open history)

    // Fetch current user's relations once component has mounted
    useEffect(() => {
        async function fetchRelations() {

            // Get current user's data
            let allRelations, friendsList; 
            if (usersData[SessionManager.getUserId()]) {  // Check if current user is already saved locally
                // Current user has been fetched already— fetch from local
                allRelations = usersData[SessionManager.getUserId()].relations;
                friendsList = usersData[SessionManager.getUserId()].friends;
            } else {
                // Current user is not saved locally— fetch data and save it
                const currentUserManager = SessionManager.getCurrentUserManager();
                await currentUserManager.fetchData(); // Fetch data
                allRelations = currentUserManager.data.relations;
                friendsList = currentUserManager.data.friends;
                const newData = { ...usersData }; // Update context
                newData[SessionManager.getUserId()] = currentUserManager.data;
                setUsersData(newData);  // Save context
            }

            // Sort relations into "friends" and "others"
            const friends = [];
            const others = [];
            Object.entries(allRelations).forEach(([userId, relationData]) => {
                relationData["userId"] = userId; // Add a "userId" field to the raw relation data
                if (friendsList.includes(userId)) {
                    friends.push(relationData); // Sort into "friends" array
                } else {
                    others.push(relationData); // Sort into "others" array
                }
            })
            setRelations({ // Set relation data
                friends: friends,
                others: others,
                fetched: true,
            })
        }
        fetchRelations();
    }, []);

  function getBreadcrumbPath() {
    return `Dashboard/People${focusedUser && usersData[focusedUser] ? "/" + usersData[focusedUser].personalData.displayName : ""}`
  }

  return (
    <div className="d-flex flex-column gap-10"> 
        <Breadcrumbs path={getBreadcrumbPath()} />
        { !focusedUser && <SortSelector setSortingScheme={setSortingScheme} sortingScheme={sortingScheme} setFilter={setFilter} filter={filter}/> }
        { !focusedUser && <PeopleList sortingScheme={sortingScheme} relations={relations} filter={filter} setFocusedUser={setFocusedUser} /> }
        { focusedUser && <UserDetail userId={focusedUser} goBack={() => setFocusedUser(null)} /> }
    </div>
  );
}
