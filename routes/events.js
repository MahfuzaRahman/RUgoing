var express = require('express');
var router = express.Router();

const { create } = require('domain');
const fs = require("fs");
const Parser = require("rss-parser");


let events = [];

(async function main(){
    const parser = new Parser();
    const feed = await parser.parseURL("https://rutgers.campuslabs.com/engage/events.rss");

    let items = [];

    await Promise.all(feed.items.map(async (currentItem) => {
        items.push(currentItem);
    }));

    var json = JSON.stringify(items, null, 2);
    fs.writeFileSync("events.json", json);

    for(var i=0; i<items.length; i++){
        let clubInfo = (String)(items[i].author);
        let parIndex = clubInfo.indexOf('(');
        let event = {
            "eventName": items[i].title,
            "clubEmail": clubInfo.substring(0, parIndex),
            "clubName": clubInfo.substring(parIndex+1, clubInfo.length-1),
            "categories": items[i].categories,
            "content": items[i].content,
            "contentSnippet": items[i].contentSnippet,
            "date": getDate(items[i].contentSnippet),
            "RSVP": items[i].guid,
            "attendance" : items[i] = 0
        } 
        events.push(event);

        let clubs = [];
    }

})();

// /* GET users listing. */
router.get('/getEvents', function(req, res, next) {
       res.send(events);
});

//gets the date
function getDate(description){
    let fields = description.split('\r\n');
    return fields[fields.length - 3];
}

/**
 * searches! find events given club name
 */
 router.get('/getEvents/:name', function (req, res) {
    const {name} = req.params;
    const searchedEvents = events.filter((event) => event.clubName.includes(name));
    res.send(searchedEvents);
  })

//filters through events given a category
router.get('/getThemes/:category', function (req, res) {
    const {category} = req.params;
    const filteredEvents = events.filter((event) => event.categories.includes(category));
    res.send(filteredEvents.map(({ eventName }) => ({ eventName })));
  })

module.exports = router;