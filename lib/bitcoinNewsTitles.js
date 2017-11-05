
const r2 = require("r2");
const FeedParser = require("feedparser");

const RSS_URL = "https://news.google.com/news/rss/search/section/q/bitcoin/bitcoin?hl=en&gl=US&ned=us";

module.exports = () => r2(RSS_URL).text.then(text => {
    return new Promise((resolve, reject) => {
        const titles = [];
        const parser = new FeedParser();
        
        parser.on("error", err => reject(err));
        parser.on("end", () => resolve(titles));

        parser.on("readable", () => {
            let article;
            while (article = parser.read()) {
                titles.push(article.title);
            }
        });
  
        parser.write(text);
        parser.push(null);
    });
});