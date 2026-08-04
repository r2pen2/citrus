// Style imports
import "./style/navigation.scss";

// Library imports
import {Breadcrumbs as MUIBreadcrumbs, Link} from "@mui/material"

/**
 * Renders a text-based description of user's current location in the app
 * @param {string} path User's location path split by slashes (/) 
 * @returns 
 */
export function Breadcrumbs({path}) {

    function mapPath(p) {
        const path = p.split("/");
        return path.map((link, idx) => {
            return (
                <Link underline='none' color="inherit" key={link}>
                    <div className={(idx + 1 === path.length ? "current " : "") + (idx === 0 ? "first" : "")}>
                        {link}
                    </div>
                </Link>
            )
        })
    }

    return (
        <div className="breadcrumbs">
            <MUIBreadcrumbs aria-label="breadcrumb">
                { mapPath(path) }
            </MUIBreadcrumbs>
        </div>
  )
}
