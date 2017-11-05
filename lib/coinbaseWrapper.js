const Coinbase = require("coinbase");

Coinbase.Client.prototype.getAccountsPromise = function(obj) {
    return new Promise((resolve, reject) => {
        Coinbase.Client.prototype.getAccounts.call(this, obj, (err, accounts) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(accounts);
        });        
    });
};

module.exports = Coinbase;