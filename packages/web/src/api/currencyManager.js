/**
 * RouteManager is a tool handling currencies. Contains methods for formatting and converting between different currencies (legal and emoji)
 */
export class CurrencyManager {

    static emojiCurrencies = {
        BEER: "🍺",
        PIZZA: "🍕",
        COFFEE: "☕",
    }

    static legalCurrencies = {
        USD: "USD",
    }

    static getLegalCurrencySymbol(legalCurrency) {

        // Now we know that this is a legal currency
        switch (legalCurrency) {
            case this.legalCurrencies.USD:
                return "$";
            default:
                return "?";
        }
    }

    static formatUSD(num, absoluteValue) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        })

        if (!absoluteValue) {
            return `${num > 0 ? "+" : ""}${formatter.format(num)}`;
        }
        return formatter.format(Math.abs(num));

    }

    static getCurrencyName(currency, plural) {
        switch (currency) {
            case this.legalCurrencies.USD:
                return plural ? "dollars" : "dollar";
            case this.emojiCurrencies.BEER:
                return plural ? "beers" : "beer";
            case this.emojiCurrencies.PIZZA:
                return plural ? "pizzas" : "pizza";
            case this.emojiCurrencies.COFFEE:
                return plural ? "coffees" : "coffee";
            default:
                return "";
        }
    }

}