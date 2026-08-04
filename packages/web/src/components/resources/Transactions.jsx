// Style imports
import "./style/transactions.scss";

// Library imports
import { Tooltip, Button, Skeleton } from '@mui/material';
import { useState, useEffect} from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Component imports
import { AvatarStack, AvatarCard, AvatarIcon } from "./Avatars";
import { Breadcrumbs } from "./Navigation";

// API imports
import { DBManager } from "../../api/db/dbManager";
import { SessionManager } from "../../api/sessionManager";
import { RouteManager } from "../../api/routeManager";
import { CurrencyManager } from "../../api/currencyManager";

const currentUserManager = SessionManager.getCurrentUserManager();

export function TransactionDetail() {
  const params = new URLSearchParams(window.location.search);
  const transactionId = params.get("id");

  const [transactionData, setTransactionData] = useState({
    currency: SessionManager.getSavedTransaction(transactionId) ? SessionManager.getSavedTransaction(transactionId).currency : {legal: true, type: "USD"},
    amount: SessionManager.getSavedTransaction(transactionId) ? SessionManager.getSavedTransaction(transactionId).amount : 0,
    date: SessionManager.getSavedTransaction(transactionId) ? SessionManager.getSavedTransaction(transactionId).date : null,
    title: SessionManager.getSavedTransaction(transactionId) ? SessionManager.getSavedTransaction(transactionId).title : "",
    balances: SessionManager.getSavedTransaction(transactionId) ? SessionManager.getSavedTransaction(transactionId).balances : {},
    createdBy: SessionManager.getSavedTransaction(transactionId) ? SessionManager.getSavedTransaction(transactionId).createdBy : null,
    group: SessionManager.getSavedTransaction(transactionId) ? SessionManager.getSavedTransaction(transactionId).group : null,
    isIOU: SessionManager.getSavedTransaction(transactionId) ? SessionManager.getSavedTransaction(transactionId).isIOU : null,
  });

  function getCurrencyString(balance) {
    return transactionData.currency.legal ? CurrencyManager.formatUSD(balance) : transactionData.currency.type + " x " + balance;
  }
  
  function getTitleString(balance) {
    return transactionData.currency.legal ? CurrencyManager.formatUSD(balance, true) : transactionData.currency.type + " x " + balance;
  }

  useEffect(() => {

    async function fetchTransactionData() {
      // Check if there's an ID
      if (!transactionId || transactionId.length <= 0) {
        RouteManager.redirect("/dashboard");
        return;
      }
      const tm = DBManager.getTransactionManager(transactionId);
      const data = await tm.fetchData();
      setTransactionData(data);
      let onePayer = false;
      for (const k of Object.keys(transactionData.balances)) {
        if (transactionData.balances[k] === transactionData.amount) {
          onePayer = true;
        }
      }
    }

    // Fetch transaction data on load
    fetchTransactionData();
  }, [transactionId])

  async function handleDelete() {
    const transactionManager = DBManager.getTransactionManager(transactionId);
    await transactionManager.cleanDelete();
    RouteManager.redirect("/dashboard");
  }

  function getUserIds() {
    let userIds = [];
    for (const key of Object.entries(transactionData.balances)) {
      userIds.push(key[0]);
    }
    return userIds;
  }  

  function getAmountTextColor(uid) {
    const selfBalance = transactionData.balances[uid];
    if (selfBalance > 0) {
      return "color-primary";
    }
    if (selfBalance < 0) {
      return "text-red";
    }
    return "";
  }

  function renderPaidByCards() {
    // eslint-disable-next-line array-callback-return
    return Object.entries(transactionData.balances).map((key, index) => {
      const uid = key[0];
      const bal = key[1];
        return (bal > 0) && (
          <AvatarCard key={uid} id={uid}>
            <div className="color-primary font-weight-bold">{getCurrencyString(bal)}</div>
          </AvatarCard>
        )
      })
  }

  function renderLendorCards() {
    // eslint-disable-next-line array-callback-return
    return Object.entries(transactionData.balances).map((key, index) => {
      const uid = key[0];
      const bal = key[1];
      return (bal < 0) && (
        <AvatarCard key={uid} id={uid}>
          <div className={"text-red font-weight-bold"}>{getCurrencyString(bal)}</div>
        </AvatarCard>
      )
    })
  }

  function renderUserBalances() {
    if (!transactionData.isIOU) {
      return (
        <section className="d-flex flex-column w-50 justify-content-start align-items-center">
        <h2>Paid by:</h2>
          {renderPaidByCards()}
        <h2>Lendors:</h2>
          {renderLendorCards()}
        </section>
      )
    }
  }

  function renderAvatars() {
    if (transactionData.isIOU) {

      let fromId = null;
      let toId = null;

      for (const u of Object.keys(transactionData.balances)) {
        if (transactionData.balances[u] < 0) {
          toId = u;
        } else {
          fromId = u;
        }
      }

      return (
        <div className="d-flex flex-row gap-10 align-items-center">
          <AvatarIcon id={fromId} size={100}/>
          <ArrowForwardIcon fontSize="large"/>
          <AvatarIcon id={toId} size={100}/>
        </div>
      )
    }
    return <AvatarStack ids={getUserIds()}/>;
  }

  return (
    <div className="d-flex flex-column align-items-center">
      <Breadcrumbs path={`Dashboard/Transactions/${transactionData.title}`}/>
      <section className="d-flex flex-column align-items-center gap-10 m-5">
        <h2>{transactionData.title}</h2>
        <h1 className={getAmountTextColor(SessionManager.getUserId())}>{getTitleString(Math.abs(transactionData.amount))}</h1>
        { renderAvatars() }
      </section>
      { renderUserBalances() }
      <Tooltip className="m-5" title="The nuclear option">      
        <Button variant="outlined" color="error" onClick={() => {handleDelete()}}>Delete this Transaction</Button>
      </Tooltip>
    </div>
  );
}
