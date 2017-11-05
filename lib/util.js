// show a reportable error before throwing
function logError(err) {
    console.log("We errored! . . . ");
    console.log(err);
    throw err;
}

// rounds number to two decimal places
function roundNum(val) {
    return Math.round(val * 100) / 100;
}

module.exports = {
    logError,
    roundNum
};