// Style imports
import "./style/homePage.scss";

// Library Imports
import { Typography, Button, Stack, IconButton, Tooltip } from '@mui/material'
import React from 'react'
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';

// Component imports
import down from "../../assets/images/down.png";

/**
 * Homepage footer containing links to all informational pages
 */
export function Footer() {
    return (
      <div className="footer vh-30 d-flex flex-row" id="footer" data-testid="footer">
          <div className="column" data-testid="column1">
            <Typography variant="h4">PRODUCT</Typography>
            <Typography component="a" href="/">Home</Typography>
            <Typography component="a" href="/info/features">Features</Typography>
            <Typography component="a" href="/info/apps">Apps</Typography>
            <Typography component="a" href="/info/pricing">Pricing</Typography>
            <Typography component="a" href="/info/faq">FAQs</Typography>
          </div>
          <div className="column" data-testid="column2">
            <Typography variant="h4">RESOURCES</Typography>
            <Typography component="a" href="/info/billing">Billing Portal</Typography>
            <Typography component="a" href="/info/roadmap">Roadmap</Typography>
            <Typography component="a" href="/info/blog">Blog</Typography>
            <Typography component="a" href="/info/support">Support</Typography>
            <Typography component="a" href="/info/status">Status Page</Typography>
          </div>
          <div className="column" data-testid="column3">
            <Typography variant="h4">LEGAL</Typography>
            <Typography component="a" href="/info/privacy">Privacy Policy</Typography>
            <Typography component="a" href="/info/terms">Terms of Use</Typography>
            <Typography component="a" href="/info/eula">EULA</Typography>
            <Typography component="a" href="/info/credits">Credits</Typography>
          </div>
      </div>
    )
}

/**
 * Homepage landing page containing link to dashboard/signin
 */
export function LandingPage() {

    /**
    * Generates a blinking arrow that acts an an anchor to #footer
    * @param {Boolean} show whether or not to show the arrow
    * @returns {Component} an anchor element that directs the user to the footer
    */
    function generateArrow(show) {
        return (show ? <a href="#footer" data-testid="landing-page-down-arrow"><img src={down} alt="down"></img></a> : <div></div>);
    }

  return (
    <div className="splash-background d-flex" id="landingpage" data-testid="landing-page">
      <div className="column left">
        <div className="left-wrapper" data-testid="landing-page-left">
          <Stack marginLeft="40px" alignItems="left" spacing="20px">
            <Typography variant="h2" className="header" data-testid="landing-page-header">Split payments without the headache.</Typography>
            <Typography variant="h6" className="paragraph" data-testid="landing-page-subtitle">An app aimed to revolutionize the way you track and split expenses amongst your friends, roommates, and more! Coming soon.</Typography>
            <Button variant="contained" size="large" component="div" className="button" onClick={() => {window.location = "/login"}}>Get Started</Button>
          </Stack>
          <div className="links-container" data-testid="landing-page-socials">
            <Stack direction="row" alignItems="center">
              <Typography variant="h5" marginRight="20px" className="unselectable">
                Come visit us:
              </Typography>
              <Tooltip title="LinkedIn">
                <IconButton target="_blank" href="https://www.linkedin.com/company/citrus-financial/">
                  <LinkedInIcon fontSize="large" sx={{color: "white" }}/>
                </IconButton>
              </Tooltip>
              <Tooltip title="Instagram">
                <IconButton target="_blank" href="https://www.instagram.com/">
                  <InstagramIcon fontSize="large" sx={{color: "white" }}/>
                </IconButton>
              </Tooltip>
              <Tooltip title="Facebook">
                <IconButton target="_blank" href="https://www.facebook.com/">
                  <FacebookIcon fontSize="large" sx={{color: "white" }}/>
                </IconButton>
              </Tooltip>
              <Tooltip title="Twitter">
                <IconButton target="_blank" href="https://www.twitter.com/">
                  <TwitterIcon fontSize="large" sx={{color: "white" }}/>
                </IconButton>
              </Tooltip>
            </Stack>
          </div>
        </div>
      </div>
      <div className="column right" data-testid="landing-page-right">
        { generateArrow(false) }
      </div>
    </div>
  )
}
