// Component Imports
import Logo from "../../assets/images/Logo256.png";

/**
 * A cute little component for login: Citrus logo that spins on click 
 */
export function SpinningLogo() {

    /**
     * Handle logo click
     */
    function spin() {
        const spinner = document.getElementById("login-logo-spinner");
        spinner.classList.toggle("spin");
    }

    return (
        <div className="login-logo-container" onClick={() => spin()}> 
            <img src={Logo} id="login-logo-spinner" alt="logo" className="logo" data-testid="login-logo"></img>
        </div>
    )
}
