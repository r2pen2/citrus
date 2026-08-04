// Style imports
import "./style/avatars.scss";

// Library imports
import { useState, useEffect, useContext } from 'react';
import { AvatarGroup, Avatar, Tooltip, Typography } from "@mui/material";

// API imports
import { DBManager } from "../../api/db/dbManager";
import { OutlinedCard } from "./Surfaces";
import { SessionManager } from "../../api/sessionManager";
import { RouteManager } from "../../api/routeManager";
import { sortAlphabetical } from "../../api/sorting";

import { UsersContext } from "../../App";

export function AvatarStack({ids, max, size}) {

    // First let's sort the IDS
    const sortedIds = sortAlphabetical(ids);

    function renderAvatarStackItems() {
        if (max) {
            return (
                <AvatarGroup max={max}>
                    { sortedIds.map((id, key) => {
                        return <AvatarStackItem size={size} userId={id} key={key}/>
                    })}
                </AvatarGroup>
            )
        }
        return (
            <AvatarGroup >
                { sortedIds.map((id, key) => {
                    return <AvatarStackItem size={size} userId={id} key={key}/>
                })}
            </AvatarGroup>
        )
    }

    return (
      <div className="avatar-stack-wrapper">
          <div className="featured">
            { renderAvatarStackItems() }
          </div>
      </div>
    )
}

export function AvatarStackItem(props) {

    const { usersData, setUsersData } = useContext(UsersContext);

    const [pfpUrl, setPfpUrl] = useState(usersData[props.userId] ? usersData[props.userId].personalData.pfpUrl : null);
    const [name, setName] = useState(usersData[props.userId] ? usersData[props.userId].personalData.displayName : null);


    useEffect(() => {

        async function fetchUserData() {
            let photo, displayName = null;
            if (usersData[props.userId]) {
                photo = usersData[props.userId].personalData.pfpUrl;
                displayName = usersData[props.userId].personalData.displayName;
            } else {
                const userManager = DBManager.getUserManager(props.userId);
                photo = await userManager.getPfpUrl();
                displayName = await userManager.getDisplayName();
                const newData = { ...usersData };
                newData[props.userId] = userManager.data;
                setUsersData(newData);
            }
            setPfpUrl(photo);
            setName(displayName);
        }

        fetchUserData();
    }, [props.userId]);

    const imgStyle = {
        border: "2px solid lightgray",
        borderRadius: "50%"
    }

    if (props.size) {
        return (
            <Tooltip title={name ? name : ""} onClick={() => RouteManager.redirectToUser(props.userId)} className="ml-1 mr-1">
                <Avatar src={pfpUrl ? pfpUrl : ""} sx={{width: props.size, height: props.size}} alt={name ? name : ""} imgProps={{referrerPolicy: "no-referrer", style: imgStyle}}/>
            </Tooltip>
        )
    }
    
    return (
        <Tooltip title={name ? name : ""} onClick={() => RouteManager.redirectToUser(props.userId)} className="ml-1 mr-1">
            <Avatar src={pfpUrl ? pfpUrl : ""} alt={name ? name : ""} imgProps={{referrerPolicy: "no-referrer", style: imgStyle}}/>
        </Tooltip>
    )
}

export function AvatarIcon(props) {
    const [pfpUrl, setPfpUrl] = useState(props.src ? props.src : null);
    const [displayName, setDisplayName] = useState(props.displayName ? props.displayName : null);

    const { usersData, setUsersData } = useContext(UsersContext);

    useEffect(() => {

        async function fetchUserData() {
            let url = null;
            let name = null;
            if (usersData[props.id]) {
                if (!props.src) {
                    url = usersData[props.id].personalData.pfpUrl;
                    setPfpUrl(url);
                }
                if (!props.displayName) {
                    name = usersData[props.id].personalData.displayName;
                    setDisplayName(name);
                }
            } else {
                const userManager = DBManager.getUserManager(props.id);
                url =  await userManager.getPfpUrl();
                name = await userManager.getDisplayName();
                setPfpUrl(url)
                setDisplayName(name);
                const newData = { ...usersData };
                newData[props.id] = userManager.data;
                setUsersData(newData);
            }
        }

        fetchUserData();
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.id, props.src, props.displayName]);

    // If we've declared a size, return one with sx attr
    if (props.size) {    
        return (
            <Tooltip onClick={() => RouteManager.redirectToUser(props.id)} className="avatar-icon" title={props.showTooltip ? props.displayName : ""}>
                <Avatar src={pfpUrl} alt={displayName} sx={{width: props.size, height: props.size}} />
            </Tooltip>
        )
    }
    return (
        <Tooltip onClick={() => RouteManager.redirectToUser(props.id)} className="avatar-icon" title={props.showTooltip ? props.displayName : ""}>
            <Avatar src={pfpUrl} alt={displayName}/>
        </Tooltip>
    )
}

export function AvatarToggle(props) {

    function renderName() {
        if (props.displayName) {
            const shortenedName = props.displayName.substring(0, props.displayName.indexOf(" "));
            return (
                <Typography color={props.outlined ? "primary" : "black"}>{shortenedName}</Typography>
            )
        }
    }

    return (
        <div className="avatar-toggle">
            <div className={"avatar-toggle-icon-element " + (props.outlined ? "outlined" : "")}>
                <AvatarIcon id={props.id} src={props.src ? props.src : null} displayName={props.displayName ? props.displayName : null}/>
            </div>
            { renderName() }
        </div>
    )
}

export function AvatarCard(props) {

    const [displayName, setDisplayName] = useState(props.displayName ? props.displayName : "");
    const { usersData, setUsersData } = useContext(UsersContext);

    useEffect(() => {

        async function fetchDisplayName() {
            if (displayName.length > 0) {
                return
            }
            let name = null;
            if (usersData[props.id]) {
                name = usersData[props.id].personalData.displayName;
            } else {
                const userManager = DBManager.getUserManager(props.id);
                name = await userManager.getDisplayName();
                const newData = { ...usersData };
                newData[props.id] = userManager.data;
                setUsersData(newData);
            }
            setDisplayName(name);
        }

        fetchDisplayName();
    }, [])

    function handleClick(e) {
        if (props.id !== SessionManager.getUserId()) {
            RouteManager.redirectToUser(props.id);
        }
    }

    return (
        <OutlinedCard hoverHighlight={true} onClick={handleClick}>
            <div className="m-2 d-flex flex-row">
                <div className="w-10">
                    <AvatarIcon id={props.id} src={props.src} />
                </div>
                <div className="w-70 d-flex flex-row justify-content-center align-items-center">
                    {displayName}
                </div>
                <div className="w-20 d-flex flex-row justify-content-center align-items-center">
                    {props.children}
                </div>
            </div>
        </OutlinedCard>
    )
}