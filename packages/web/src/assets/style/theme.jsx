import { createTheme } from "@mui/material/styles";

export default createTheme({
  // declare re-used variables
  palette: {
    type: "light",
    citrusGreen: {
      main: "#bfd679",
    },
    citrusYellow: {
      main: "#f0e358",
    },
    citrusOrange: {
      main: "#FDB90F",
    },
    citrusPink: {
      main: "#F4A09A",
    },
    citrusRed: {
      main: "#EA4236",
    },
    citrusTan: {
      main: "#FDB90F33",
    },
    background: {
      main: "#E5E5E5",
    },
    primary: {
      main: "#bfd679", // aka citrusGreen
    },
    secondary: {
      main: "#FDB90F", // aka citrusOrange
    },
    error: {
      main: "#EA4236", // aka citrusRed
    },
    success: {
      main: "#bfd679", // aka citrusGreen
    },
    warning: {
      main: "#FDB90F", // aka citrusOrange
    },
    info: {
      main: "#f0e358", // aka citrusYellow
    },
    white: {
      main: "#FFFFFF",
    },
    venmo: {
      main: "#3D95CE",
    },
  },
});
