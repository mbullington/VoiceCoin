// constants

const { NLU_USERNAME, NLU_PASSWORD, TONE_USERNAME, TONE_PASSWORD } = require("../config");

const NLU = require("watson-developer-cloud/natural-language-understanding/v1");
const ToneAnalyzer = require('watson-developer-cloud/tone-analyzer/v3');

const nlu = new NLU({
  username: NLU_USERNAME,
  password: NLU_PASSWORD,
  version_date: NLU.VERSION_DATE_2017_02_27
});

var toneAnalyzer = new ToneAnalyzer({
    username: TONE_USERNAME,
    password: TONE_PASSWORD,
    version_date: "2016-05-19"
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

        toneAnalyzer.tone({ text }, (err, tone) => {
            if (err) {
                reject(err);
                return;
            }
            
            let score = !!bitcoinEntity ? scoreFromEntity(bitcoinEntity, response) :
                scoreWithoutEntity(response);

            if (tone.document_tone.tone_categories.length === 3) {
                const languageTone = tone.document_tone.tone_categories[1];
                languageTone.tones.forEach(tone => {
                    if (tone.tone_id === "confident") {
                        score *= 1 + tone.score;
                    }

                    if (tone.tone_id === "tentative") {
                        score *= 1 - tone.score;
                    }
                });
            }

            resolve(score);
        });
    });   
});