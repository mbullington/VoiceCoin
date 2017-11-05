const Alexa = require("alexa-sdk");

const { getBitcoinValue, getAccountValue, getGrowth, getPrediction, readablePrediction } = require("./main");
const { roundNum } = require("./lib/util");

const { APP_ID } = require("./config");

const SKILL_NAME = "VoiceCoin";

const HELP_MESSAGE = "You can say, how much your Coinbase balance is worth, what is your Bitcoin prediction for tomorrow, or, you can say exit... What can I help you with?";
const HELP_REPROMPT = "What can I help you with?";

const STOP_MESSAGE = "Goodbye!";

exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);

    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    "LaunchRequest": function() {
        this.emit("GetUpdateIntent");
    },
    "GetUpdateIntent": function() {
        Promise.all([getBitcoinValue(), getAccountValue(), getGrowth(2), getPrediction()])
            .then(list => {
                const [ btnValue, value, growth, prediction ] = list;
                const readable = readablePrediction(prediction);

                this.response.cardRenderer(`${SKILL_NAME} Update`, `
                    Bitcoin Value: \$${btnValue} ${growth >= 0 ? "+" : ""}${growth}
                    Coinbase Wallet Amount: \$${value}
                    Tomorrow's Prediction: ${readable}
                `);
                
                this.response.speak(`
                    Hello! The current value of one bitcoin is \$${btnValue}, which makes your Coinbase wallet worth \$${value}.
                    The value has ${growth >= 0 ? "increased" : "decreased"} ${growth} percent since yesterday.
                    Tomorrow, with some help from Watson, my bitcoin prediction is ${readable}.
                    `);                

                this.emit(":responseReady");    
            })
            .catch(err => {
                logError(err);
            });
    },
    "GetBtnValueIntent": function() {
        getBitcoinValue().then(value => {
            this.response.speak(`The current value of one bitcoin is \$${value}.`);
            this.emit(":responseReady");    
        });
    },
    "GetBalanceValueIntent": function() {
        getAccountValue().then(value => {
            this.response.speak(`Your Coinbase wallet is currently worth \$${value}.`);
            this.emit(":responseReady");                
        });
    },
    "GetBtnGrowthIntent": function() {
        Promise.all([getGrowth(1), getAccountValue()]).then(list => {
            const [ growth, value ] = list;
            const ratio = 100 / (100 + growth);
            const diff = roundNum(Math.abs(value - value * ratio));

            if (growth >= 0) {
                this.response.speak(`The value of bitcoin has increased by ${growth} percent since yesterday, meaning you've gained \$${diff}.`);
            } else {
                this.response.speak(`The value of bitcoin has decreased by ${Math.abs(growth)} percent since yesterday, meaning you've lost \$${diff}.`);                
            }

            this.emit(":responseReady");
        });
    },
    "GetBtnPredictionIntent": function() {
        getPrediction().then(prediction => {
            const readable = readablePrediction(prediction);

            this.response.speak(`My bitcoin prediction for tomorrow, with a little help from Watson, is ${readable}.`);
            this.emit(":responseReady");
        });
    },
    "AMAZON.HelpIntent": function() {
        this.response.speak(HELP_MESSAGE).listen(HELP_REPROMPT);
        this.emit(":responseReady");
    },
    "AMAZON.CancelIntent": function() {
        this.response.speak(STOP_MESSAGE);
        this.emit(":responseReady");
    },
    "AMAZON.StopIntent": function() {
        this.response.speak(STOP_MESSAGE);
        this.emit(":responseReady");
    },
};