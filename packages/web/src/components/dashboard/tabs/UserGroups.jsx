import { Breadcrumbs } from "../../resources/Navigation";
import { useState, useEffect, useContext } from "react";
import { SectionTitle } from "../../resources/Labels"; 
import { GroupDetail, GroupsList } from "../../resources/Groups"; 
import { SessionManager } from "../../../api/sessionManager";
import { DBManager } from "../../../api/db/dbManager";
import { Button } from "@mui/material";

import { GroupCardSkeleton } from "../../resources/Groups"
import { GroupsContext, UsersContext } from "../../../App";

export default function UserGroups() {
  
  const { groupsData, setGroupsData } = useContext(GroupsContext);
  const { usersData, setUsersData } = useContext(UsersContext);

  const [groupState, setGroupState] = useState({
    ids: usersData[SessionManager.getUserId()] ? usersData[SessionManager.getUserId()].groups : [],
    managers: [],
    fetched: false
  });
  
  const [focusedGroup, setFocusedGroup] = useState(null);

  useEffect(() => {
    async function fetchGroups() {
      // Fetch user related data
      let newGroupManagers = [];
      let userGroups = [];
      if (usersData[SessionManager.getUserId()]) {
        userGroups = usersData[SessionManager.getUserId()].groups;
      } else {
        const userManager = SessionManager.getCurrentUserManager();
        userGroups = await userManager.getGroups();
        const newData = { ...usersData };
        newData[SessionManager.getUserId()] = userManager.data;
        setUsersData(newData);
      }


      // Fetch data related to user's groups
        for (const groupId of userGroups) {
          let groupManager = null;
          if (groupsData[groupId]) {
            groupManager = DBManager.getGroupManager(groupId, groupsData[groupId]);
          } else {
            groupManager = DBManager.getGroupManager(groupId);
            await groupManager.fetchData();
            const newData = { ...groupsData };
            newData[groupId] = groupManager.data;
            setGroupsData(newData);
          }
          newGroupManagers.push(groupManager);
        }
        setGroupState({ids: groupState.ids, managers: newGroupManagers, fetched: true});
    }
    fetchGroups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  function renderSkeleton() {
    return groupState.ids.map((id) => {
      return <GroupCardSkeleton key={id} />
    })
  }

  function getBreadcrumbPath() {
    return `Dashboard/Groups${focusedGroup && groupsData[focusedGroup] ? "/" + groupsData[focusedGroup].name : ""}`
  }

  return (
    <div className="d-flex flex-column gap-10">
      <Breadcrumbs path={getBreadcrumbPath()} />
      { !focusedGroup && <SectionTitle title="Groups"><Button variant="contained" onClick={() => window.location = "/dashboard/group/add"}>Add Groups</Button></SectionTitle>}
      { !focusedGroup && (groupState.fetched ? <GroupsList groupManagers={groupState.managers} setFocusedGroup={setFocusedGroup} /> : renderSkeleton()) }
      { focusedGroup && <GroupDetail groupId={focusedGroup} /> }
    </div>
  );
}