// Style imports
import "./style/oweCards.scss";

// Library imports
import { CardContent, CardActionArea, Typography, TextField, Tooltip, Button } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import { useState, useEffect } from 'react';

// API imports
import { showDollars } from "../../api/strings";
import { DBManager } from "../../api/db/dbManager";
import { RouteManager } from "../../api/routeManager";
import { SessionManager } from "../../api/sessionManager";

// Component imports
import { SectionTitle } from "./Labels";
import { OutlinedCard } from "./Surfaces";
import { AvatarIcon } from "./Avatars";

// Get user manager from LS
const currentUserManager = SessionManager.getCurrentUserManager();

export function DashboardOweCards() {

    const [relations, setRelations] = useState({
        postitive: [],
        negative: []
    })

    useEffect(() => {

        async function fetchUserRelations() {
            // Get all transactions for current user
            const userRelations = await currentUserManager.getSortedRelations();
            setRelations({
                positive: userRelations.positive,
                negative: userRelations.negative
            })
            setTimeout(() => {
              fetchUserRelations();
            }, 1000)
        }

        fetchUserRelations();
    }, [])

    return (
      <div className="d-flex flex-row" data-testid="owe-cards">
          <DashboardOweCard direction={"positive"} relations={relations.positive}/>
          <div className="spacer"></div>
          <DashboardOweCard direction={"negative"} relations={relations.negative}/>
      </div>
    )
}

function DashboardOweCard({direction, relations, negativeRelations}) {

    function handleOweCardClick() {
        const newVal = "owe-" + (direction ? direction : "all");
        RouteManager.redirectWithHash("dashboard", newVal);
    }

    function getCardColor() {
      if (direction === "positive") {
        return "rgba(176, 200, 86, 0.8)";
      } else if (direction === "negative") {
        return "rgba(234, 66, 54, 0.5)";
      }
      return "#f0e358";
    }

    function getCardTitle() {
      if (direction === "positive") {
        return "Owe Me";
      } else if (direction === "negative") {
        return "I Owe";
      }
      return "Total";
    }

    function getToFromString() {
      if (direction === "positive") {
        return "From";
      } else if (direction === "negative") {
        return "To";
      }
      return "With"
    }

    let amountOwed = 0;
    let peopleFound = [];
    // Simplify relations
    if (relations) {
        for (const relation of relations) {
          if (!peopleFound.includes(relation.user)) {
            peopleFound.push(relation.user);
          }
          amountOwed += relation.amount;
        }
    }
    if (negativeRelations) {
        for (const negativeRelation of negativeRelations) {
            if (negativeRelation.from.id === SessionManager.getUserId()) {
                if (!peopleFound.includes(negativeRelation.to.id)) {
                    peopleFound.push(negativeRelation.to.id);
                }
            } else if (negativeRelation.to.id === SessionManager.getUserId()) {
                if (!peopleFound.includes(negativeRelation.from.id)) {
                    peopleFound.push(negativeRelation.from.id);
                }
            }
            amountOwed -= negativeRelation.amount;
        }
    }
    const numPeople = peopleFound.length;
  
    return (
        <div
          data-testid={"owe-card-" + (direction ? direction : "all")}
          className="dashboard-owe-card-container"
        >
          <SectionTitle title={getCardTitle()} />
          <div className="card-wrapper" data-testid="owe-card-card-element">
            <OutlinedCard borderWeight="2px" borderColor={getCardColor()} data-testid="owe-card-card-element">
              <CardActionArea>
                <CardContent onClick={() => handleOweCardClick()}>
                  <Typography variant="h5" component="div">
                    {showDollars(Math.abs(amountOwed))}
                  </Typography>
                  <div className="d-flex align-items-center">
                    <GroupsIcon fontSize="large" />
                    <Typography
                      variant="subtitle1"
                      component="div"
                      marginLeft="5px"
                      marginTop="2px"
                    >
                      {getToFromString()} {numPeople} {numPeople === 1 ? "person" : "people"}
                    </Typography>
                  </div>
                </CardContent>
              </CardActionArea>
            </OutlinedCard>
          </div>
        </div>
    );
}

export function OweOneDirectionHeader({positive, relations}) {
  function getRelationTotal() {
    let total = 0;
    for (const r of relations) {
      total += r.amount;
    }
    return Math.abs(total);
  }

  return (
    <div className="owe-one-direction-header">
      <Typography variant="h1">{positive ? "Owe Me" : "I Owe"}</Typography>
      <Typography variant="h2">{showDollars(getRelationTotal())}</Typography>
    </div>
  )
}

export function OweOneDirectionPerson({relation, positive}) {

  const [settleState, setSettleState] = useState({
    menuOpen: false,
    onButtonClick: openSettleMenu,
    buttonLabel: "Settle",
    buttonColor: positive ? "primary" : "citrusRed",
    settleAmount: relation.amount,
  })

  const [userData, setUserData] = useState({
    displayName: "",
    pfpUrl: ""
  })
  
  useEffect(() => {
    // fetch user data on mount
    async function fetchUserData() {
      const relationUserManager = DBManager.getUserManager(relation.user);
      const displayName = await relationUserManager.getDisplayName();
      const src = await relationUserManager.getPfpUrl();
      setUserData({
        displayName: displayName,
        pfpUrl: src
      })
    }

    fetchUserData();
  }, [])

  function openSettleMenu() {
    setSettleState({
      menuOpen: true,
      onButtonClick: submitSettleAmount,
      buttonLabel: "Submit",
      buttonColor: "primary",
      settleAmount: Math.abs(relation.amount),
    });
  }

  async function submitSettleAmount() {
    const amt = document.getElementById("settle-amount-input").value;
    const fromUser = positive ? DBManager.getUserManager(relation.user) : currentUserManager;
    const toUser = positive ? SessionManager.getUserId() : relation.user;
    await fromUser.settleWithUser(toUser, parseInt(amt));
    window.location.reload();
  }

  function handleAmountChange(e) {
    setSettleState({
      menuOpen: settleState.menuOpen,
      onButtonClick: settleState.onButtonClick,
      buttonLabel: settleState.buttonLabel,
      buttonColor: settleState.buttonColor,
      settleAmount: parseInt(e.target.value),
    })
  }

  function renderSettleForm() {
    if (!settleState.menuOpen) {
      return <div></div>
    } else {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center gap-10">
          <TextField
            value={settleState.settleAmount}
            onChange={(e) => handleAmountChange(e)}
            inputProps={{min: 0, style: { textAlign: 'center' }}}
            label="Settle Value"
            type="number"
            id="settle-amount-input"
          >
          </TextField>
          { renderSettleHint() }
      </div>
      )
    }
  }

  function getSettleTooltip() {
    return settleState.menuOpen ? `Send ${showDollars(settleState.settleAmount)} to ${userData.displayName}` : "";
  }

  function getVenmoTooltip() {
    return !settleState.menuOpen ? "Coming soon..." : ""
  }

  function renderSettleHint() {

    function getEndingColor() {
      if (settleState.settleAmount > Math.abs(relation.amount)) {
        return "primary";
      }
      if (settleState.settleAmount < Math.abs(relation.amount)) {
        return "error";
      }
      return "";
    }

    function getStartingColor() {
      return positive ? "primary" : "error";
    }

    return (
      <div className="d-flex flex-row justify-content-center gap-10">
        <Typography variant="subtitle1" color={getStartingColor()}>{showDollars(Math.abs(relation.amount))}</Typography>
        <Typography variant="subtitle1"> → </Typography>
        <Typography variant="subtitle1" color={getEndingColor()}>{showDollars(Math.abs(Math.abs(relation.amount) - settleState.settleAmount))}</Typography>
      </div>
    );
  }

  return (
    <OutlinedCard borderWeight="4px" borderColor={positive ? "rgba(176, 200, 86, 0.8)" : "rgba(234, 66, 54, 0.5)"} >
      <div className="personal-owe-card">
        <div className="row">
          <AvatarIcon id={relation.user} size={100}/>
          <Typography variant="h1">{userData.displayName}</Typography>
          <Typography variant="h1">{showDollars(Math.abs(relation.amount))}</Typography>
        </div>
        <div className="row buttons">
          <Button className={settleState.menuOpen ? "hidden" : ""} variant="contained" color={settleState.buttonColor}>Remind</Button>
          <Tooltip title={getSettleTooltip()} placement="top">
          <div className="d-flex flex-row">
            <Button variant="contained" color={settleState.buttonColor} onClick={settleState.onButtonClick}>{settleState.buttonLabel}</Button>
          </div>
          </Tooltip>
          <Tooltip title={getVenmoTooltip()}>
            <Button className={settleState.menuOpen ? "hidden" : ""} variant="contained" color="venmo">Venmo</Button>
          </Tooltip>
        </div>
        { renderSettleForm() }
      </div>
    </OutlinedCard>
  )
}