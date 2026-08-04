// Style Imports
import "./style/people.scss";

// Library Imports
import { Typography, Button, CardActionArea, CardContent, FormControl, InputLabel, Select, MenuItem, Chip, Tooltip, Dialog, TextField, InputAdornment } from "@mui/material";
import GroupsIcon from '@mui/icons-material/Groups';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useContext } from "react";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// API Imports
import { UserRelation } from "../../api/db/objectManagers/userManager";

// Component Imports
import { SectionTitle } from "./Labels";
import { AvatarIcon } from "./Avatars";
import { OutlinedCard } from "./Surfaces";
import { EmojiBalanceBar, BalanceLabel } from "./Balances";
import { UserRelationHistory } from "../../api/db/objectManagers/userManager";
import { SessionManager } from "../../api/sessionManager";
import { RouteManager } from "../../api/routeManager";
import { getDateString } from "../../api/strings";
import { CurrencyManager } from "../../api/currencyManager";
import { DBManager } from "../../api/db/dbManager";
import { UsersContext } from "../../App";

export function PeopleList({relations, sortingScheme, filter, setFocusedUser}) {

    function renderRelationCards(relevantRelations) {
        const sortedRelations = UserRelation.applySort(sortingScheme, relevantRelations);
        return sortedRelations.map((relation, index) => {
            return <UserRelationCard key={index} relation={relation} setFocusedUser={setFocusedUser}/>;
        })
    }
    
    function renderOthers() {
        return <section>
                <SectionTitle title="Other Users" />
                { relations.fetched && renderRelationCards(relations.others) }
        </section>
    }
    
    function renderFriends() {
        return <section>
            <SectionTitle title="Friends">
                <Button variant="contained">Add Friends</Button>
            </SectionTitle>
            { relations.fetched && renderRelationCards(relations.friends) }   
        </section>
    }

    return (
        <div className="relation-cards-wrapper">
            { filter.friends && renderFriends() }
            { filter.others && renderOthers() }
        </div>
    )
}


export function UserRelationCard({relation, setFocusedUser}) {

    function emojisShouldRender() {
        const userBalances = Object.keys(relation.balances);
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
                <CardActionArea onClick={() => setFocusedUser(relation.userId)}>
                    <CardContent>
                        <div className="transaction-card-content d-flex flex-row align-items-center w-100 gap-10">
                            <div className="w-25">
                                <AvatarIcon id={relation.userId} size={60}/>
                            </div>
                            <div className="w-50 d-flex flex-row overflow-hidden justify-content-start">
                                <Typography variant="h1">{relation.displayName}</Typography>
                            </div>
                            <div className="w-25 d-flex flex-column gap-10 align-items-center">
                                <BalanceLabel userRelation={relation} size="small" />
                                { emojisShouldRender() && <EmojiBalanceBar userRelation={relation} size="small" /> }
                            </div>
                        </div>
                    </CardContent>
                </CardActionArea>
            </OutlinedCard>
        </div>
    )
} 

export function SortSelector({setSortingScheme, sortingScheme, setFilter, filter}) {

    /**
     * Render a working filter chip with colors and labels 
     * @param {Boolean} bool whether or not filter is on 
     * @param {String} label filter title 
     * @returns Chip element styled to current state
     */
    function renderFilterChip(bool, label) {

        /**
         * Change state based on filter label
         */
        function handleFilterChange() {
            if (label === "friends") {
                setFilter({
                    friends: !filter.friends,
                    others: filter.others
                })
            }
            if (label === "others") {
                setFilter({
                    friends: filter.friends,
                    others: !filter.others
                })
            }
        }

        // Format label string to show user
        const forwardLabel = label.toLowerCase()[0].toUpperCase() + label.toLowerCase().substring(1);
        return bool ? <Chip label={forwardLabel} color="primary" onClick={handleFilterChange} /> : <Chip label={forwardLabel} onClick={handleFilterChange} />;
    }

    return (
        <div className="d-flex flex-row justify-content-between">
            <FormControl className="sort-select-box w-100">
                <InputLabel id="sort-select-label">Sort By:</InputLabel>
                <Select 
                    value={sortingScheme} 
                    labelId="sort-select-label" 
                    onChange={(e) => setSortingScheme(e.target.value)} 
                    label="Sort By:"
                    className="w-50"
                >
                    <MenuItem value={UserRelation.sortingSchemes.BALANCE}>Balance</MenuItem>
                    <MenuItem value={UserRelation.sortingSchemes.ABSOLUTEVALUE}>Balance (Absolute Value)</MenuItem>
                    <MenuItem value={UserRelation.sortingSchemes.LASTINTERACTED}>Last Interacted</MenuItem>
                    <MenuItem value={UserRelation.sortingSchemes.NUMTRANSACTIONS}>Total Transactions</MenuItem>
                    <MenuItem value={UserRelation.sortingSchemes.DISPLAYNAME}>Alphabetically</MenuItem>
                </Select>
            </FormControl>
            <div className="d-flex flex-row gap-10 align-items-center justify-content-end w-50">
                { renderFilterChip(filter.friends, "friends") }
                { renderFilterChip(filter.others, "others") }
            </div>
        </div>
        
    )
}

export function UserDetail({userId, goBack}) {
    
  const { usersData } = useContext(UsersContext);
  const userRelation = new UserRelation(usersData[SessionManager.getUserId()].relations[userId])
  const usd = userRelation.balances["USD"] ? userRelation.balances["USD"] : 0;

  const [settleOpen, setSettleOpen] = useState(false);
  const [settleCurrency, setSettleCurrency] = useState({legal: true, legalType: CurrencyManager.legalCurrencies.USD, emojiType: CurrencyManager.emojiCurrencies.BEER});
  const [settleAmount, setSettleAmount] = useState(usd < 0 ? Math.abs(usd) : 0);
  const [search, setSearch] = useState("");

  function renderHistory() {
    return userRelation.getHistory().map((history, index) => {

      function handleClick(e) {
        RouteManager.redirectToTransaction(history.transaction);
      }

      const searchIncluded = search.length === 0 || history.transactionTitle.toLowerCase().includes(search.toLowerCase()) || getDateString(history.date).toLowerCase().includes(search.toLowerCase());
      
      const card = (
        <OutlinedCard onClick={handleClick} hoverHighlight={true} key={index}>
        <div className="w-100 px-3 mt-3 mb-3 d-flex flex-row align-items-center justify-content-between history-card">
          <div className="d-flex flex-column align-items-left">
            <div className="d-flex flex-row align-items-center gap-10">
                <Tooltip placement="left" title={history.group ? "This was a group transaction" : "This was a transaction between friends"} >
                    { history.group ? <GroupsIcon /> : <HandshakeIcon /> }
                </Tooltip>
              <h2>
                { history.transactionTitle }
              </h2>
            </div>
            <p>{getDateString(history.date)}</p>
          </div>
          <BalanceLabel history={history} />
        </div>
      </OutlinedCard> 
      )

      return searchIncluded && card;
    })
  }

  function handleLegalButtonPress() {
    const newState = { ...settleCurrency };
    newState.legal = !newState.legal;
    setSettleCurrency(newState);
    updateCurrencyAmount(newState);
  }

  function populateCurrencyTypeSelect() {
    const menu = settleCurrency.legal ? CurrencyManager.legalCurrencies : CurrencyManager.emojiCurrencies;
    return Object.entries(menu).map((entry) => {
        return <MenuItem key={entry[0]} value={entry[1]}>{entry[1]}</MenuItem>
    })
  }

  function updateCurrencyAmount(state) {
    const curr = state.legal ? state.legalType : state.emojiType;
    const amt = userRelation.balances[curr] ? userRelation.balances[curr] : 0
    setSettleAmount(amt < 0 ? Math.abs(amt) : 0);
  }

  function handleCurrencyTypeChange(e) {
    const newState = { ...settleCurrency };
    newState.legal = settleCurrency.legal ? e.target.value : settleCurrency.legal;
    newState.legalType = settleCurrency.legal ? e.target.value : settleCurrency.legalType;
    newState.emojiType = settleCurrency.legal ? settleCurrency.emojiType : e.target.value;
    setSettleCurrency(newState);
    updateCurrencyAmount(newState);
  }

  function updateSettleAmount(e) {
    const newAmt = parseFloat(e.target.value);
    if (newAmt < 0) {
        return;
    }
    setSettleAmount(newAmt);
  }

  async function handleSettleSubmit() {
    const newTransactionTitle = `${usersData[SessionManager.getUserId()].personalData.displayName} settled with ${userRelation.displayName}`;

    let settleGroups = {};

    // Find out how much goes to each group
    const curr = settleCurrency.legal ? settleCurrency.legalType : settleCurrency.emojiType;
    const totalDebt = userRelation.balances[curr] ? (userRelation.balances[curr] < 0 ? userRelation.balances[curr] : 0) : 0; 
    let amtLeft = settleAmount < Math.abs(totalDebt) ? settleAmount : Math.abs(totalDebt);
    for (const history of userRelation.getHistory()) {
      if (amtLeft > 0 && history.amount < 0) {
        const group = history.group;
        if (Math.abs(history.amount) > amtLeft) {
          // This will be the last history we look at
          if (group) {
            const groupManager = DBManager.getGroupManager(group);
            const bal = await groupManager.getUserBalance(SessionManager.getUserId());
            const settleGroupAmt = Math.abs(bal[curr]) > amtLeft ? amtLeft : Math.abs(bal[curr]);
            if (bal[curr] < 0) {
              settleGroups[group] = settleGroups[group] ? settleGroups[group] + settleGroupAmt : settleGroupAmt; 
              amtLeft = 0;
            }
          }
        } else {
          if (group) {
            const groupManager = DBManager.getGroupManager(group);
            const bal = await groupManager.getUserBalance(SessionManager.getUserId());
            const settleGroupAmt = Math.abs(bal[curr]) > Math.abs(history.amount) ? Math.abs(history.amount) : Math.abs(bal[curr]);
            settleGroups[group] = settleGroups[group] ? settleGroups[group] + settleGroupAmt : settleGroupAmt;
            amtLeft += history.amount < 0 ? history.amount : 0;
          }
        }
      }
    }

    // First, we have to create the transaction on the database so that the new transactionID can be placed into userRelationHistories
    const transactionManager = DBManager.getTransactionManager();
    transactionManager.setCreatedBy(SessionManager.getUserId());
    transactionManager.setCurrencyLegal(settleCurrency.legal);
    transactionManager.setCurrencyType(settleCurrency.legal ? settleCurrency.legalType : settleCurrency.emojiType);
    transactionManager.setAmount(settleAmount);
    transactionManager.setTitle(newTransactionTitle);
    transactionManager.updateBalance(SessionManager.getUserId(), settleAmount);
    transactionManager.updateBalance(userId, -1 * settleAmount);
    transactionManager.setIsIOU(true);
    
    // Add settle Groups
    for (const k of Object.keys(settleGroups)) {
      transactionManager.updateSettleGroup(k, settleGroups[k]);
    }

    await transactionManager.push();

    // Create a relationHistory for user 1
    const h1 = new UserRelationHistory();
    h1.setAmount(settleAmount);
    h1.setCurrencyLegal(settleCurrency.legal);
    h1.setCurrencyType(settleCurrency.legal ? settleCurrency.legalType : settleCurrency.emojiType);
    h1.setTransaction(transactionManager.documentId);
    h1.setTransactionTitle(newTransactionTitle);
    
    // Create a relationHistory for user2
    const h2 = new UserRelationHistory();
    h2.setAmount(-1 * settleAmount);
    h2.setCurrencyLegal(settleCurrency.legal);
    h2.setCurrencyType(settleCurrency.legal ? settleCurrency.legalType : settleCurrency.emojiType);
    h2.setTransaction(transactionManager.documentId);
    h2.setTransactionTitle(newTransactionTitle);

    // Add this relation to both users
    const user1Manager = DBManager.getUserManager(SessionManager.getUserId());
    const user2Manager = DBManager.getUserManager(userId);
    let user1Relation = await user1Manager.getRelationWithUser(userId);
    let user2Relation = await user2Manager.getRelationWithUser(SessionManager.getUserId());
    user1Relation.addHistory(h1);
    user2Relation.addHistory(h2);
    user1Manager.updateRelation(userId, user1Relation);
    user2Manager.updateRelation(SessionManager.getUserId(), user2Relation);
    
    // Push users
    let success = true;
    const pushed1 = await user1Manager.push();
    const pushed2 = await user2Manager.push();
    success = (success && pushed1 && pushed2);

    for (const k of Object.keys(settleGroups)) {
        // If there are groups to settle in, add data to groups
        const groupManager = DBManager.getGroupManager(k);
        groupManager.addTransaction(transactionManager.documentId);
        const currencyKey = settleCurrency.legal ? settleCurrency.legalType : settleCurrency.emojiType;
        
        const fromBal = await groupManager.getUserBalance(SessionManager.getUserId());
        fromBal[currencyKey] = fromBal[currencyKey] ? fromBal[currencyKey] + settleGroups[k] : settleGroups[k];
        const toBal = await groupManager.getUserBalance(userId);
        toBal[currencyKey] = toBal[currencyKey] ? toBal[currencyKey] - settleGroups[k] : -1 * settleGroups[k];
        groupManager.updateBalance(SessionManager.getUserId(), fromBal);
        groupManager.updateBalance(userId, toBal);
        
        const pushed = await groupManager.push();
        success = (success && pushed);
    }

    console.log(settleGroups)

    if (success) {
        RouteManager.redirectToTransaction(transactionManager.documentId);
    }
    
}

function getSettleColor() {
  if (userRelation.balances["USD"] < 0) {
    return "primary";
  }
  return "warning";
}

function getOweMessage() {
  if (userRelation.balances["USD"] >= 0) {
    return " (You don't owe them any money right now)";
  }
  return "";
}

  return (
    <div className="d-flex flex-column align-items-center">
        <section className="d-flex flex-row w-100" >
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={goBack}>Back</Button>
        </section>
      <section className="d-flex flex-column align-items-center m-5 gap-10">
        <AvatarIcon id={userId} size="150px"/>
        <h1>{userRelation.displayName}</h1>
        <BalanceLabel userRelation={userRelation} size="large" />
        <EmojiBalanceBar userRelation={userRelation} size="large"/>
      </section>
      <section className="d-flex flex-row justify-content-between w-50 gap-10">
          <Tooltip title={"Pay off your debt with this user." + getOweMessage()}>
            <Button className="w-100" variant="contained" color={getSettleColor()} onClick={() => setSettleOpen(true)}>Settle</Button>
          </Tooltip>
          <Tooltip title={"Pay off your debt via Venmo." + getOweMessage()}>
            <Button className="w-100 text-light" variant="contained" color="venmo">Venmo</Button>
          </Tooltip>
      </section>
      <section className="d-flex flex-column align-items-center m-5 gap-10 w-75">
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

      <Dialog disableEscapeKeyDown fullWidth maxWidth="sm" open={settleOpen} keepMounted onClose={() => setSettleOpen(false)} aria-describedby="alert-dialog-slide-description">
        <div className="px-3 py-3 gap-10">
            <section className="d-flex flex-column align-items-center justify-content-center m-2">
                <h1>Settle with {userRelation.displayName}</h1>
            </section>
            <section className="d-flex flex-row align-items-center justify-content-center mt-5 gap-10">
              <Button className="w-25" variant="outlined" endIcon={<ArrowDropDownIcon />} onClick={() => handleLegalButtonPress()}>{settleCurrency.legal ? "$" : "😉"}</Button>
              <TextField autoFocus id="amount-input" type="number" label="Amount" value={settleAmount} onChange={updateSettleAmount} variant="standard"/>
              <Select className="w-25" id="currency-type-input" value={settleCurrency.legal ? settleCurrency.legalType : settleCurrency.emojiType} onChange={e => handleCurrencyTypeChange(e)} >
                { populateCurrencyTypeSelect() }
              </Select>
            </section>
            <section className="mt-5 mb-2 d-flex flex-column align-items-center justify-content-center">
                <Button variant="contained" disabled={settleAmount === 0} onClick={handleSettleSubmit}>Submit</Button>
            </section>
        </div>
        </Dialog>

    </div>
  );
}