import "./style/balances.scss";
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import { useState, useEffect } from "react";
import Typography from '@mui/material/Typography';
import { CurrencyManager } from "../../api/currencyManager"; 
import { SessionManager } from "../../api/sessionManager";
import { DBManager } from "../../api/db/dbManager";

export function EmojiBalanceBar({userRelation, groupBalances, size}) {

    if (userRelation) {
        function renderEmojis() {

            // First we sort balances
            const sortedBalances = Object.keys(userRelation.balances).sort().reduce(
                (obj, key) => {
                    obj[key] = userRelation.balances[key];
                    return obj;
                },
                {}
            )
            // This sorting is really fucked lmao it's not actually sorting by emoji name but instead sorting by the stringified unicode representation (I think)
            // So ☕ is handled as U+2615 and 🍕 is U+1F355
    
            return Object.entries(sortedBalances).map((key, idx) => {
    
                const amt = Math.abs(key[1]);
    
                function getTooltip() {
                    if (key[1] > 0) {
                        return `You're owed ${amt} ${key[0]}`;
                    }
                    if (key[1] < 0) {
                        return `You owe ${amt} ${key[0]}`;
                    }
                }
    
                if (key[0] !== "USD" && key[1] !== 0) {
                    return (
                        <Tooltip key={idx} title={getTooltip()}>
                            <Badge badgeContent={amt} color={key[1] > 0 ? "citrusGreen" : "citrusRed"}>
                                <div className={"emoji-badge " + size}>
                                    {key[0]}
                                </div>
                            </Badge>
                        </Tooltip>
                    )
                }
            })    
        }
        
        return (
            <div className="d-flex flex-row w-100 overflow-auto align-items-center gap-10 justify-content-center">
                {renderEmojis()}
            </div>
        )
    }

    if (groupBalances) {

        if (!groupBalances[SessionManager.getUserId()]) {
            return <div></div>
        }

        function renderEmojis() {

            // First we sort balances
            const sortedBalances = Object.keys(groupBalances[SessionManager.getUserId()]).sort().reduce(
                (obj, key) => {
                    obj[key] = groupBalances[SessionManager.getUserId()][key];
                    return obj;
                },
                {}
            )
            // This sorting is really fucked lmao it's not actually sorting by emoji name but instead sorting by the stringified unicode representation (I think)
            // So ☕ is handled as U+2615 and 🍕 is U+1F355
    
            return Object.entries(sortedBalances).map((key, idx) => {
    
                const amt = Math.abs(key[1]);
    
                function getTooltip() {
                    if (key[1] > 0) {
                        return `You're owed ${amt} ${key[0]}`;
                    }
                    if (key[1] < 0) {
                        return `You owe ${amt} ${key[0]}`;
                    }
                }
    
                if (key[0] !== "USD" && key[1] !== 0) {
                    return (
                        <Tooltip key={idx} title={getTooltip()}>
                            <Badge badgeContent={amt} color={key[1] > 0 ? "citrusGreen" : "citrusRed"}>
                                <div className={"emoji-badge " + size}>
                                    {key[0]}
                                </div>
                            </Badge>
                        </Tooltip>
                    )
                }
            })    
        }
        
        return (
            <div className="d-flex flex-row w-100 overflow-auto align-items-center gap-10 justify-content-center">
                {renderEmojis()}
            </div>
        )
    }
}

export function BalanceLabel({userRelation, groupBalances, history, transaction, groupId, size}) {


    function getColor(amt) {
        if (amt > 0) {
            return "primary";
        }
        if (amt < 0) {
            return "error";
        }
        return "";
    }

    function getTooltip(amt, amtString) {
        if (amt > 0) {
            return `You are owed ${amtString}`;
        }
        if (amt < 0) {
            return `You owe ${amtString}`;
        }
        return "You're not a part of this transaction."
    }

    if (userRelation) {

        const legalBal = userRelation.balances["USD"]

        return (
            <Tooltip title={getTooltip(legalBal, CurrencyManager.formatUSD(Math.abs(legalBal)))}>
                <Typography variant={size === "small" ? "h1" : "h2"} color={getColor(legalBal)}>{size === "small" ? CurrencyManager.formatUSD(legalBal) : CurrencyManager.formatUSD(legalBal, true)}</Typography>
            </Tooltip>
        )
    }

    if (groupBalances) {
        if (!groupBalances[SessionManager.getUserId()]) {
            return <div></div>;
        }
        let legalBal = groupBalances[SessionManager.getUserId()]["USD"];
        return (
            <Tooltip title={getTooltip(legalBal, CurrencyManager.formatUSD(Math.abs(legalBal)))}>
                <Typography variant={size === "small" ? "h1" : "h2"} color={getColor(legalBal)}>{CurrencyManager.formatUSD(legalBal)}</Typography>
            </Tooltip>
        )
    }
    
    if (history) {
        const amt = history.getAmount();
        return (
            <Tooltip title={getTooltip(amt, history.currency.legal ? CurrencyManager.formatUSD(amt) : history.currency.type + " x " + Math.abs(amt))} >
                <Typography variant="h2" color={getColor(amt)}>{history.currency.legal ? CurrencyManager.formatUSD(amt) : history.currency.type + " x " + amt}</Typography>
            </Tooltip>
        )
    }

    if (transaction) {
        if (!transaction.balances[SessionManager.getUserId()]) {
            return (
                <Tooltip title={getTooltip(0, "")}>
                    <Typography variant="h2">{CurrencyManager.formatUSD(0)}</Typography>
                </Tooltip>
            )
        }
        let amt = transaction.balances[SessionManager.getUserId()];
        if (groupId) {
            if (transaction.settleGroups[groupId]) {
                amt = transaction.settleGroups[groupId];
            }
        }
        return (
            <Tooltip title={getTooltip(amt, transaction.currency.legal ? CurrencyManager.formatUSD(amt) : transaction.currency.type + " x " + Math.abs(amt))}>
                <Typography variant="h2" color={getColor(amt)}>{transaction.currency.legal ? CurrencyManager.formatUSD(amt) : transaction.currency.type + " x " + amt}</Typography>
            </Tooltip>
        )
    }
}