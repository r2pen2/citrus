// Style Imports
import "./style/groups.scss";

// Library Imports
import { FormControl, TextField, Skeleton, CardActionArea, CardContent, Typography, Button, IconButton, InputAdornment, Tooltip } from "@mui/material";
import { useState, useEffect, useContext } from "react"
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import StarIcon from '@mui/icons-material/Star';
import SearchIcon from '@mui/icons-material/Search';

// Component Imports
import { Breadcrumbs } from "./Navigation";
import { OutlinedCard } from "./Surfaces";
import { BalanceLabel, EmojiBalanceBar } from "./Balances";

// API Imports
import { RouteManager } from "../../api/routeManager";
import { getDateString } from "../../api/strings";
import { SessionManager } from "../../api/sessionManager";
import { DBManager } from "../../api/db/dbManager";
import { AvatarStack } from "./Avatars";
import { GroupsContext, TransactionsContext } from "../../App";

// Get user manager from LS
const currentUserManager = SessionManager.getCurrentUserManager();

export function GroupNew() {

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  function checkSubmitEnable() {
      return groupName.length > 0;
  }

  /**
   * Creates a group, adds the current user to that group, and redirects the user
   * to the invitation page for this new group
   */
  async function handleSubmit() {
    const groupManager = DBManager.getGroupManager();
    // Set group metadata
    groupManager.setCreatedAt(new Date());
    groupManager.setCreatedBy(SessionManager.getUserId());
    // Set user-facing group data
    groupManager.setDescription(groupDescription.length > 0 ? groupDescription : null);
    groupManager.setName(groupName);
    // Add current user to group
    groupManager.addUser(SessionManager.getUserId());
    // Create a code
    // Push changes to new group, then add the group to current user if successful
    await groupManager.push();
    await groupManager.generateInvites();
    currentUserManager.addGroup(groupManager.getDocumentId());
    await currentUserManager.push();
    RouteManager.redirectToGroupInvite(groupManager.getDocumentId());
  }

  return (
    <div className="group-form">
      <Breadcrumbs path="Dashboard/Groups/New" />
      <div className="d-flex flex-column align-items-center justify-content-center w-100 gap-10">
          <Typography variant="h1">Create a Group</Typography>
          <FormControl className="gap-10 w-50">
              <TextField
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                inputProps={{min: 0, style: { textAlign: 'center' }}}
                label="Group Title"
              >
              </TextField>
              <TextField
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                inputProps={{min: 0, style: { textAlign: 'center' }}}
                label="Description (Optional)"
                multiline={true}
              >
              </TextField>
          </FormControl>
          <Button variant="contained" color="primary" disabled={!checkSubmitEnable()} onClick={() => handleSubmit()}>
              Create Group
          </Button>
      </div>
    </div>
  );
}

export function GroupsList({groupManagers, setFocusedGroup}) {

  function renderGroups() {
    return groupManagers.map((groupManager, index) => {
      return <GroupCard key={index} group={groupManager} setFocusedGroup={setFocusedGroup}></GroupCard>
    });
  }
  
  return (
    <div className="group-cards-wrapper">
      { renderGroups() }
    </div>
  )
}


function GroupCard({group, setFocusedGroup}) {
  function emojisShouldRender() {
    const userBalances = Object.keys(group.data.balances[SessionManager.getUserId()]);
    // Check if user has more than one currency
    const multipleCurrencies = userBalances.length > 1;
    // Check if user's currencies include USD
    const hasUSD = userBalances.includes("USD");
    // Check if USD is the only currency
    const justUSD = userBalances.length === 1 && hasUSD;
    return multipleCurrencies && !justUSD;
  }

  return (
      <div className="w-100 mb-3">
        <OutlinedCard disableMarginBottom={true}>
            <CardActionArea onClick={() => setFocusedGroup(group.documentId)}>
                <CardContent>
                      <div className="transaction-card-content d-flex flex-row align-items-center w-100">
                          <div className="w-50">
                            <AvatarStack ids={group.data.users} max={3}/>
                          </div>
                          <div className="w-50 d-flex flex-row overflow-hidden justify-content-center">
                            <Typography variant="h1" >{group.data.name}</Typography>
                          </div>
                          <div className="w-25 d-flex flex-column gap-10 align-items-center">
                            <BalanceLabel groupBalances={group.data.balances} size="small"/>
                            { emojisShouldRender() && <EmojiBalanceBar groupBalances={group.data.balances} size="small" />}
                          </div>
                       </div>
                </CardContent>
            </CardActionArea>
        </OutlinedCard>
      </div>
  )
} 

export function GroupCardSkeleton() {
  return <Skeleton variant="rounded" height={100} className="skeleton-round" />
}

export function GroupInvite() {

    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("id");
  
    const [groupInviteData, setGroupInviteData] = useState({
        link: null,
        qr: null,
        code: null,
      });
    const [clipboardTooltip, setClipboardtooltip] = useState("Copy to Clipboard");
      
    useEffect(() => {
        async function loadGroupData() {
          const groupManager = DBManager.getGroupManager(groupId);
          const link = await groupManager.getLinkInvite();
          const qr = await groupManager.getQrInvite();
          const code = await groupManager.getCodeInvite();
          setGroupInviteData({
            link: link,
            qr: qr,
            code: code,
          });
        }

        loadGroupData();
    }, [groupId])

    /**
     * Reset clipboard tooltip after 1 second
     */
    useEffect(() => {
      setTimeout(() => {
        setClipboardtooltip("Copy to Clipboard");
      }, 1000);
    }, [clipboardTooltip]);

    function copyLink() {
      if (groupInviteData.link) {
        navigator.clipboard.writeText(groupInviteData.link);
        setClipboardtooltip("Copied!");
      }
    }

    return (
        <div className="group-form">
          <div className="d-flex flex-column align-item-center justify-content-center w-100 gap-10">
            <div className="d-flex flex-row align-items-center justify-content-center w-100 gap-2">
              <Tooltip title={clipboardTooltip}>
                <IconButton onClick={() => copyLink()}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <TextField
                label="Invitation Link"
                value={groupInviteData.link ? groupInviteData.link : "Generating invite link..."}
                id="outlined-size-small"
                size="small"
                className="w-100"
                InputProps={{
                  readOnly: true,
                }}
              />
            </div>
            <div className="d-flex flex-row align-items-center justify-content-center w-100 gap-2">
              <Tooltip title={clipboardTooltip}>
                <IconButton onClick={() => copyLink()}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <TextField
                label="Invitation Code"
                value={groupInviteData.code ? groupInviteData.code : "Generating code..."}
                id="outlined-size-small"
                size="small"
                className="w-100"
                InputProps={{
                  readOnly: true,
                }}
              />
            </div>
          </div>
        </div>
    );
}

export function GroupDetail({groupId}) {

  const { groupsData, setGroupsData } = useContext(GroupsContext);
  const { transactionsData, setTransactionsData } = useContext(TransactionsContext);

  const [groupData, setGroupData] = useState({
    users: groupsData[groupId] ? groupsData[groupId].users : [],
    name: groupsData[groupId] ? groupsData[groupId].name : "",
    balances: groupsData[groupId] ? groupsData[groupId].balances : {},
  });

  const [search, setSearch] = useState("");
  
  const [groupTransactions, setGroupTransactions] = useState([]);
  
  useEffect(() => {
    
    async function fetchGroupData() {
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
      setGroupData(groupManager.data);
      
      let newTransactionManagers = [];
      for (const transactionId of groupManager.data.transactions) {
        let transactionManager = null;
        if (transactionsData[transactionId]) {
          transactionManager = DBManager.getTransactionManager(transactionId, transactionsData[transactionId]);
        } else {
          transactionManager = DBManager.getTransactionManager(transactionId);
          await transactionManager.fetchData();
          const newData = { ...transactionsData };
          newData[transactionId] = transactionManager.data;
          setTransactionsData(newData);
        }
        newTransactionManagers.push(transactionManager);
      }
      setGroupTransactions(newTransactionManagers);
    }

    fetchGroupData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  function renderHistory() {
    return groupTransactions.map((transaction, index) => {

      
      function handleClick(e) {
        RouteManager.redirectToTransaction(transaction.documentId);
      }
      
      function getIds() {
        let ids = [];
        for (const u of Object.keys(transaction.data.balances)) {
          if (transaction.data.balances[u] !== 0) {
            ids.push(u);
          }
        }
        return ids;
      }

      let groupTransaction = false;
      let privateTransaction = false;

      if (transaction.data) {
        groupTransaction = Object.keys(transaction.data.settleGroups).length <= 0 && transaction.data.group;
        privateTransaction = Object.keys(transaction.data.settleGroups).length > 0 && Object.keys(transaction.data.balances).includes(SessionManager.getUserId());
      }

      if (groupTransaction) {
        if (search.length === 0 || transaction.data.title.toLowerCase().includes(search.toLowerCase())) {
          return (
            <OutlinedCard onClick={handleClick} hoverHighlight={true} key={index}>
              <div className="w-100 px-3 mt-3 mb-3 d-flex flex-row align-items-center justify-content-between history-card">
                <div className="d-flex flex-column align-items-left w-100">
                  <div className="d-flex flex-row align-items-center gap-10">
                    <h2>
                      { transaction.data.title }
                    </h2>
                  </div>
                  <p>{getDateString(transaction.data.date)}</p>
                </div>
                <section className="d-flex flex-column align-items-center justify-content-right gap-10">
                  <BalanceLabel groupId={groupId} transaction={transaction.data} />
                  <AvatarStack size={40} ids={getIds()} max={8} />
                </section>
              </div>
            </OutlinedCard>
          )

        }
      }

      function renderStar() {
        if (transaction.data.settleGroups[groupId] !== transaction.data.amount) {
          return (
            <Tooltip title="This transaction cleared your group debt with someone!" >
              <StarIcon color="primary"/>
            </Tooltip>
          )
        }
      }

      if (privateTransaction) {
        if (search.length === 0 || transaction.data.title.toLowerCase().includes(search.toLowerCase())) {
          return (
            <OutlinedCard onClick={handleClick} backgroundColor="#f0f0f0" hoverHighlight={true} key={index}>
              <div className="w-100 px-3 mt-3 mb-3 d-flex flex-row align-items-center justify-content-between history-card">
                <div className="d-flex flex-column align-items-left w-100">
                  <div className="d-flex flex-row align-items-center gap-10">
                    <Tooltip title="This transaction didn't happen within the context of this group. It does, however, effect your debt with someone in it. Only you two can see this transaction." >
                      <VisibilityOffIcon />
                    </Tooltip>
                    <h2>
                      { transaction.data.title }
                    </h2>
                  </div>
                  <p>{getDateString(transaction.data.date)}</p>
                </div>
                <section className="d-flex flex-column align-items-center justify-content-right gap-10">
                  <div className="d-flex flex-row gap-10 align-items-center">
                    <BalanceLabel groupId={groupId} transaction={transaction.data} />
                    { renderStar() }
                  </div>
                  <AvatarStack size={40} ids={getIds()} max={8} />
                </section>
              </div>
            </OutlinedCard>
          )
        }
      }
    })

  }

  function handleDelete() {
    const groupManager = DBManager.getGroupManager(groupId);
    groupManager.cleanDelete();
  }

  return (
    <div className="d-flex flex-column align-items-center">
      <section className="d-flex flex-column align-items-center gap-10">
        <AvatarStack ids={groupData.users} size={100}/>
        <h1>{groupData.name}</h1>
        <BalanceLabel groupBalances={groupData.balances} size="large" />
        <EmojiBalanceBar groupBalances={groupData.balances} size="large"/>
        <Button color="error" variant="outlined" onClick={handleDelete}>Delete Group</Button>
      </section>
      <section className="d-flex flex-column align-items-center gap-10 w-75">
        <TextField 
          variant="standard"
          placeholder="Search transcations..."
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>,
          }} />
        { renderHistory() }
      </section>
    </div>
  );
}

export function GroupAdd() {
  
    const [groupCode, setGroupCode] = useState("");
    const [codeError, setCodeError] = useState(false);

    function checkSubmitEnable() {
        return groupCode.length > 5;
    }

    async function handleCodeSubmit() {
      const inviteManager = DBManager.getInvitationManager(groupCode);
      const inviteValid = await inviteManager.documentExists();
      if (inviteValid) {
        const groupId = await inviteManager.getTarget();
        const groupManager = DBManager.getGroupManager(groupId);
        groupManager.addUser(SessionManager.getUserId());
        currentUserManager.addGroup(groupId);
        await groupManager.push();
        await currentUserManager.push();
        RouteManager.redirectToGroupDashboard(groupId);
      } else {
        setCodeError(true);
      }
    }

    return (
      <div className="group-form">
        <Breadcrumbs path="Dashboard/Groups/Add" />
        <div className="d-flex flex-column align-items-center justify-content-center w-100 gap-10">
            <Typography variant="h1">Add a Group</Typography>
            <FormControl>
                <TextField
                    value={groupCode}
                    onChange={(e) => setGroupCode(e.target.value)}
                    inputProps={{min: 0, style: { textAlign: 'center' }}}
                    label="Group Code"
                >
                </TextField>
            </FormControl>
            <Button variant="contained" color="primary" disabled={!checkSubmitEnable()} onClick={() => handleCodeSubmit()}>
                Join
            </Button>
            <Button variant="outlined" color="primary" onClick={() => RouteManager.redirect("/dashboard/group/new")}>
                Or create a new group
            </Button>
            <Typography variant="subtitle1" color="error" hidden={!codeError}>Group code invalid!</Typography>
        </div>
      </div>
    );
}