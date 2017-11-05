const r2 = require("r2");
const moment = require("moment");

const CURRENT_PRICE = "https://api.coindesk.com/v1/bpi/currentprice/USD.json";
const HISTORICAL_PRICE = "https://api.coindesk.com/v1/bpi/historical/close.json?currency=USD";

const TEN_MINUTES = 600000;

let currentPrice;
let currentPriceTimestamp;

module.exports = (daysBefore) => {
    if (!!daysBefore) {
        const yesterday = moment().subtract(daysBefore, "day").format("YYYY-MM-DD");

        return r2(HISTORICAL_PRICE).json.then(json => {
            return json.bpi[yesterday];
        });
    } else {
        const timestamp = Date.now();
        if (currentPrice != null && Math.abs(currentPriceTimestamp - timestamp) < 600000) {
            return currentPrice;
        }

        return r2(CURRENT_PRICE).json.then(json => {
            currentPrice = json.bpi.USD.rate_float;
            currentPriceTimestamp = Date.now();

            return currentPrice;
        });
    }
};