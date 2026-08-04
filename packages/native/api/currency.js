// API Imports
import { emojiCurrencies, legalCurrencies, } from "./enum";

/**
 * @class Class for handling operations related to currencies
 * @static
 */
export class CurrencyManager {
    /**
     * Get singular or plural string representation of currencyType
     * @static method belonging to {@link CurrencyManager}
     * @param {Enumerator} currency currencyType enum
     * @param {boolean} plural whether or not the string should be plural
     * @returns string representation of currencyType
     * @default
     * plural = false;
     * @example
     * CurrencyManager.getCurrencyName(emojiCurrencies.BEER) = "beer";
     * CurrencyManager.getCurrencyName(emojiCurrencies.BEER, true) = "beers";
     */
    static getCurrencyName(currency, plural) {
        switch (currency) {
            case legalCurrencies.USD:
                return plural ? "dollars" : "dollar";
            case emojiCurrencies.BEER:
                return plural ? "beers" : "beer";
            case emojiCurrencies.PIZZA:
                return plural ? "pizzas" : "pizza";
            case emojiCurrencies.COFFEE:
                return plural ? "coffees" : "coffee";
            default:
                return "";
        }
    }
}