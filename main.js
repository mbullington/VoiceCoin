const { API_KEY, API_SECRET } = require("./config");

const Coinbase = require("./lib/coinbaseWrapper");

const spotPrice = require("./lib/spotPrice");

const bitcoinNewsTitles = require("./lib/bitcoinNewsTitles");
const titleAnalysis = require("./lib/titleAnalysis");
const combineSentiment = require("./lib/combineSentiment");

const { logError, roundNum } = require("./lib/util");

const BigNumber = require("bignumber.js");

// functions and actual code

function fromBigNumber(bigNum) {
    return roundNum(parseFloat(bigNum.toString()));
}

const client = new Coinbase.Client({
    apiKey: API_KEY,
    apiSecret: API_SECRET
});

const CRYPTO_CURRENCY = "BTC";

// get the current value of 1 BTN
function getBitcoinValue() {
    return spotPrice().then(price => fromBigNumber(price));
}

// get the value of your account in USD
function getAccountValue() {
    return Promise.all([spotPrice(), client.getAccountsPromise({})])
        .then(list => {
            const spotPrice = new BigNumber(list[0]);
            let returnValue;

            list[1].forEach(acct => {
                // not BTN, so either Litecoin or Ethereum?
                if (acct.currency != CRYPTO_CURRENCY) {
                    return;
                }

                const amount = new BigNumber(acct.balance.amount);
                returnValue = fromBigNumber(amount.times(spotPrice));
            });

            return returnValue;
        });
}

// get the BTN-USD growth from yesterday
function getGrowth(daysBack) {
    // spot price from today, yesterday
    return Promise.all([spotPrice(), spotPrice(daysBack || 0)])
        .then(list => {
            const [today, yesterday] = list;
            return roundNum(100 * (today / yesterday) - 100);
        });
}

function getPrediction() {
    return Promise.all([getGrowth(10), bitcoinNewsTitles()])
        .then(list => {
            const [ growth, newsTitles ] = list;
            return Promise.all(newsTitles.map(text => titleAnalysis(text))).then(numbers => {
                return combineSentiment(numbers, growth);
            });
        });
}

function readablePrediction(prediction) {
    if (prediction > 0.5) {
        return "positive";
    } else if (prediction > 0) {
        return "moderately positive";
    } else if (!prediction) {
        return "neutral";
    } else if (prediction > -0.5) {
        return "moderately negative";
    } else if (prediction >= -1) {
        return "negative";
    }
}

// demo
/*
{
    Promise.all([getBitcoinValue(), getAccountValue(), getGrowth(2), getPrediction()])
        .then(list => {
            const [ btnValue, value, growth, prediction ] = list;
            console.log("Bitcoin value: $" + btnValue);
            console.log("Value of wallet: $" + value);
            console.log(growth + "% growth since yesterday.");
            console.log("Forecast for tomorrow is " + readablePrediction(prediction) + ": " + prediction);
        })
        .catch(err => {
            logError(err);
        });
}
*/

module.exports = {
    getBitcoinValue,
    getAccountValue,
    getGrowth,
    getPrediction,
    readablePrediction
};