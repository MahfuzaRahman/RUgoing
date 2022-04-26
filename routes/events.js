var express = require('express');
var router = express.Router();

const { create } = require('domain');
const fs = require("fs");
const Parser = require("rss-parser");


let events = [];
let clubs = [];

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
        let club = {
            "clubEmail": clubInfo.substring(0, parIndex),
            "clubName": clubInfo.substring(parIndex+1, clubInfo.length-1),
            events: []
        }
        if(!clubs.some(c => c.clubName === club.clubName)) {
            club.events.push(event);
            clubs.push(club);
        } else {
           // let existingClub = 
            clubs.find(c => c.clubName === club.clubName).events.push(event);
           // existingClub.events.push(event);
        }

        // for(var k = 0; k <clubs.length; k++){
        //     console.log(k + " " + clubs[k].clubName);
        //     for(var i = 0; i < clubs[k].events.length; i++){
        //         console.log(clubs[k].events[i]);
        //     }
                
        // }    
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
 *  searches! find events given club name
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

// orders events by date
router.get('/getEventsSorted', function (req, res) {
    const sortedEvents = events.sort((a, b) => b.date - a.date)
    //res.send(sortedEvents);
    res.send(sortedEvents.map(({ eventName }) => ({ eventName })));
  })

module.exports = router;