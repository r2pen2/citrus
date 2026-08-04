// Style imports
import "./style/labels.scss";

// Library imports
import { Typography } from "@mui/material";

export function SectionTitle(props) {
  return (
    <div className="section-title">
        <Typography sc={{ fontSize: 14}} color="text-secondary" gutterBottom>{props.title} ❯</Typography>
        <div className={"fill-line margin-right line-style-" + (props.line ? props.line : "dotted")}></div>
        {props.children}
    </div>
  )
}
