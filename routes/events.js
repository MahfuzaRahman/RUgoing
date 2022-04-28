var express = require('express');
var router = express.Router();

const { create } = require('domain');
const fs = require("fs");
const Parser = require("rss-parser");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriterEvents = createCsvWriter({
    path: 'eventData.csv',
    header: [
      {id: 'eventName', title: 'Event Name'},
      {id: 'clubEmail', title: 'Club Email'},
      {id: 'clubName', title: 'Club Name'},
      {id: 'categories', title: 'Categories'},
      {id: 'description', title: 'Event Description'},
      //{id: 'contentSnippet', title: 'Content Snippet'},
      {id: 'dateStart', title: 'Begins'},
      {id: 'dateEnd', title: 'Ends'},
      {id: 'RSVP', title: 'RSVP'},
      {id: 'attendance', title: 'Attendance'}
    ]
});

const csvWriterClubs = createCsvWriter({
    path: 'clubData.csv',
    header: [
        {id: 'clubName', title: 'Club Name'},
        {id: 'clubEmail', title: 'Club Email'},
        {id: 'events', title: 'Events'}
    ]
})

let events = [];
let clubs = [];

(async function main(){
    /**
     * Parses through RSS feed provided by Rutgers Get Involved
     */
    const parser = new Parser();
    const feed = await parser.parseURL("https://rutgers.campuslabs.com/engage/events.rss");

    let items = [];

    await Promise.all(feed.items.map(async (currentItem) => {
        items.push(currentItem);
    }));

    var json = JSON.stringify(items, null, 2);
    fs.writeFileSync("events.json", json);

    // add all events and clubs to respective arrays
    for(var i=0; i<items.length; i++){
        let item = items[i];
        let event = createEvent(item);        
        let club = createClub(item);
        addEvent(event);
        addClub(club, event);
    }
    
    // writes all events to eventsData.csv
    csvWriterEvents.writeRecords(events);
    csvWriterClubs.writeRecords(clubs);
    
    /* PRINTS ALL CLUBS AND THEIR EVENTS */
    // for(var k = 0; k <clubs.length; k++){
    //     console.log(k + " " + clubs[k].clubName);
    //     for(var i = 0; i < clubs[k].events.length; i++){
    //         console.log(clubs[k].events[i].eventName);
    //     }
    // }    
   
})();

/**
 * Creates event by adding information parsed 
 * from RSS feed
 * @param {*} item array element of array of events on RSS feed
 * @returns event
 */
function createEvent(item){
    let clubInfo = (String)(item.author);
    let parIndex = clubInfo.indexOf('(');
    let event = {
        eventName: item.title,
        clubEmail: clubInfo.substring(0, parIndex),
        clubName: clubInfo.substring(parIndex+1, clubInfo.length-1),
        categories: item.categories,
        description: getDescription(item.content), // looks bad rn bc of all the <divs> :/
        //contentSnippet: item.contentSnippet,
        dateStart: getDate(item.contentSnippet).start,
        dateEnd: getDate(item.contentSnippet).end,
        RSVP: item.guid,
        attendance: 0
    } 
    return event;
}

/**
 * Creates club by adding information parsed
 * from RSS feed
 * @param {*} item array element of array events on RSS feed
 * @returns event
 */
function createClub(item){
    let clubInfo = (String)(item.author);
    let parIndex = clubInfo.indexOf('(');
    let club = {
        "clubEmail": clubInfo.substring(0, parIndex),
        "clubName": clubInfo.substring(parIndex+1, clubInfo.length-1),
        events: []
    }
    return club;
}

/**
 * Adds events to events []
 * @param {*} event event to add to events []
 */
function addEvent(event){
    events.push(event);
}

/**
 * Adds club to clubs [] and adds respective events to given club
 * @param {*} club club to add to clubs []
 */
function addClub(club, event){
    // Checks if club already exists
    if(!clubs.some(c => c.clubName === club.clubName)) {
        // If club is not in array, add event to club's events [], and then add club
        club.events.push(event);
        clubs.push(club);
    } else {
        // If club is in array, add event to club's events []
        clubs.find(c => c.clubName === club.clubName).events.push(event);
    }
}

/**
 * Parses through description to find the date of the event
 * @param {*} description RSS feeds provide a description for each event which contains the date of the event
 * @returns 
 */
function getDate(description){
    let fields = description.split('\r\n');
    return {
        start: fields[fields.length - 3], 
        end: fields[fields.length-2]
    };
}

/**
 * Parses through content snippet to find the event description
 * @param {} description 
 * @returns 
 */
function getDescription(description){
    var startIndex = description.indexOf('<p>')+3;
    var endIndex = description.indexOf('</p>');
    // let fields = description.substring(startIndex, endIndex);
    //var startIndex = description.indexOf('\n\r\n  \n')+6;
   // var endIndex = description.indexOf('\n', startIndex);
    let fields = description.substring(startIndex, endIndex);
    return fields;
}

/**
 * Gets user listings
 */
 router.get('/getEvents', function(req, res, next) {
    res.send(events);
});

/**
 *  Searches for events given a club name
 */
router.get('/getEvents/:name', function (req, res) {
    const {name} = req.params;
    const searchedEvents = events.filter((event) => event.clubName.includes(name));
    res.send(searchedEvents);
})

/**
 * Filters through events given a category and displays events matching given category
 */ 
router.get('/getThemes/:category', function (req, res) {
    const {category} = req.params;
    const filteredEvents = events.filter((event) => event.categories.includes(category));
    res.send(filteredEvents.map(({ eventName }) => ({ eventName })));
})

/**
 * Sorts events by date
 */
router.get('/getEventsSorted', function (req, res) {
    const sortedEvents = events.sort((a, b) => b.date - a.date)
    res.send(sortedEvents.map(({ eventName }) => ({ eventName })));
})

module.exports = router;