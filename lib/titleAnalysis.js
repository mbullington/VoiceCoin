// constants

const { USERNAME, PASSWORD } = require("../config");

const NLU = require("watson-developer-cloud/natural-language-understanding/v1");

const nlu = new NLU({
  username: USERNAME,
  password: PASSWORD,
  version_date: NLU.VERSION_DATE_2017_02_27
});

const positiveEmotions = [
    "joy"
];

const negativeEmotions = [
    "sadness",
    "fear",
    "disgust",
    "anger"
];

function scoreFromEntity(entity, res) {
    let score = entity.sentiment.score;

    if (res.sentiment && !!res.sentiment.targets.length &&
            Math.abs(res.sentiment.targets[0].score) > Math.abs(score)) {
        score = res.sentiment.targets[0].score;
    }

    let positiveScore = 0;    
    let negativeScore = 0;

    Object.keys(entity.emotion).forEach(key => {
        if (positiveEmotions.indexOf(key) > -1) {
            positiveScore += entity.emotion[key];
        }

        if (negativeEmotions.indexOf(key) > -1) {
            negativeScore += entity.emotion[key];
        }
    });

    // average out values
    positiveScore /= positiveEmotions.length;
    negativeScore /= negativeEmotions.length;

    return score + 2 * (positiveScore - negativeScore);
}

function scoreWithoutEntity(res) {
    if (res.sentiment && !!res.sentiment.targets.length) {
        return res.sentiment.targets[0].score;
    }

    return 0;
}

module.exports = (text) => new Promise((resolve, reject) => {
    nlu.analyze({
        html: text, // Buffer or String
        features: {
            sentiment: {
                targets: [
                  "bitcoin"
                ]
            },
            entities: {
                emotion: true,
                sentiment: true
            }
        }
    }, (err, response) => {
        if (err) {
            reject(err);
            return;
        }
        
        let bitcoinEntity;
        response.entities.forEach(entity => {
            if (entity.text.toLowerCase().indexOf("bitcoin") > -1) {
                bitcoinEntity = entity;
            }
        });

        resolve(!!bitcoinEntity ? scoreFromEntity(bitcoinEntity, response) :
                scoreWithoutEntity(response));
    });   
});