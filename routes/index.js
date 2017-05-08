var express = require('express');
var session = require('express-session');
var async = require('async');
var router = express.Router();
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

function cJ(e,msg){
	//This is a simple shortcut to output json objects to the console in a nice format
	console.log(msg + ' : ' + JSON.stringify(e,null,4));
}

router.use(session({
  key: 'app.sess',
  resave: true,
  saveUninitialized: false,
  secret: 'SEKR37'
}));

function oAuthClient(){
	return new OAuth2(
		'551111354834-nfns5goompgkjpch7eu55mrj9nrp3ofd.apps.googleusercontent.com',
		'_xPs0CGHaaD039afPvwG_wkW',
		'http://localhost:55666/oauthcallback'
	);
}

router.get('/redirecturl', function(req, res, next) {
	// generate a url that asks permissions for Google+ and Google Calendar scopes
	var scopes = [
		'https://www.googleapis.com/auth/calendar',
		'https://www.googleapis.com/auth/userinfo.profile'
	];
	
	var oauthClient = oAuthClient();
	
	var url = oauthClient.generateAuthUrl({
		access_type: 'online',
		scope: scopes,
		// Optional property that passes state parameters to redirect URI
		// state: { foo: 'bar' }
	});
	res.send(url);
});

/* GET home page. */
router.get('/oauthcallback', function(req, res, next) {
	var accessCode = req.query.code;
	
	var oauthClient = oAuthClient();
	
	oauthClient.getToken(accessCode, function (err, tokens) {
		if (!err) {
			oauthClient.setCredentials(tokens);
			req.session.token = tokens;
			
			var prof = google.oauth2({
				version: 'v2',
				auth: oauthClient
			});
			prof.userinfo.get({
				auth: oauthClient
			}, function (err, response) {
				if (!err) {
					var idToken = response.id;
					req.session.id = idToken;
					cJ(response,'user info');
					res.redirect('/events.html');
				}
				else{
					cJ(err,'user info error');
				}
			});
			
			//checkExistingUser(req);
			//cJ(tokens);
			//At this point run a function to check if user exists and action appropriately
			//res.redirect('/events');
  		}
  		else{
			console.log('error');
  			cJ(err,'get token initial error');
  		}
	});
	
	console.log(accessCode);
});

router.get('/drawSpecEvent', function(req,res,next){
	var calId = req.query.calId;
	var eId = req.query.eventId;
	
	console.log(calId + '    ' + eId);
	var oauthClient = oAuthClient();
	var tokens = req.session.token;
	oauthClient.setCredentials(tokens);
	var cal = google.calendar({
		version: 'v3',
		auth: oauthClient
	});
	
	cal.events.get({
		calendarId: calId,
		eventId : eId,
		auth: oauthClient
	},function(err,response){
		if (!err) {
			res.send(response);
		}
		else{
			cJ(err , 'calendar event get error');
		}
	});
});
router.get('/calIdList', function(req,res,next){
	var oauthClient = oAuthClient();
	var tokens = req.session.token;
	oauthClient.setCredentials(tokens);
	var cal = google.calendar({
		version: 'v3',
		auth: oauthClient
	});
	if (typeof(req.session.calId) != 'undefined'){
		res.send(req.session.calId);
	}
	else{
		cal.calendarList.list({
		auth: oauthClient
		}, function (err, response) {
			if (!err) {
				req.session.calId = [];
				var calId = [];
				for (var i in response.items){
					calId[i] = response.items[i].id;
				}
				req.session.calId = calId;
				cJ(calId , 'calendar ids');
				cJ(req.session.calId , 'session calendar ids');
				res.send(calId);
			}
			else{
				cJ(err , 'calendar ids error');
			}
		});
	}
});
function gatherEvents(res,token,calIdArr,dateTo,dateFrom,callback){
	cJ(calIdArr,'cal IDs passed to draw all events');
	var oauthClient = oAuthClient();
	var tokens = token;
	oauthClient.setCredentials(tokens);
	var cal = google.calendar({
		version: 'v3',
		auth: oauthClient
	});
	var eventArr = [];
	//This var holds a count of the number of times calendar items have been collected so it moves on at the correct point
	
	
	/*
	
	//This is from http://caolan.github.io/async/docs.html#eachOf
	
	var obj = {dev: "/dev.json", test: "/test.json", prod: "/prod.json"};
	var configs = {};

	async.forEachOf(obj, function (value, key, callback) {
		fs.readFile(__dirname + value, "utf8", function (err, data) {
			if (err) return callback(err);
			try {
				configs[key] = JSON.parse(data);
			} catch (e) {
				return callback(e);
			}
			callback();
		});
	}, function (err) {
		if (err) console.error(err.message);
		// configs is now a map of JSON data
		doSomethingWith(configs);
	});
	*/
 	async.forEachOf(calIdArr, function (calIdVal, key, callback) {
		cal.events.list({
			calendarId: calIdVal,
			timeMax:  (new Date(dateTo)).toISOString(),
			timeMin: (new Date(dateFrom)).toISOString(),
			showDeleted: false,
			singleEvents: true,
			orderBy: 'startTime',
			auth: oauthClient
		}, function (err, response) {
			//cJ(response,'EVENT RAW');
			if (!err) {
				if (response !== 'Not Found' && response.items.length > 0){
					cJ(response,'Found!!! for calId: "'+calIdVal+'"');
					response.items.calid = calIdVal;
					eventArr.push(response.items);
				}
				else if (response !== 'Not Found'){
					cJ(response,'Not found error for calId: "'+calIdVal+'"');
				}
			}
			else{
				cJ(err,'event error with calendar ID: ' + calIdVal);
			}
			callback();
		});
	}, function (err) {
		if (err) console.error(err.message);
		// configs is now a map of JSON data
		callback(res,eventArr);
	});
}
function formatEvents(res,calEvents,callback){
	var eventListObj = [];
	var empty = 1;
	for (var c in calEvents){
		events = calEvents[c];
		//cJ(events,'format Events');
		if (events.length > 0) {
			empty = 0;
			for (i = 0;i<events.length; i++) {
				
				var title = events[i].summary;
				
				if (title.length > 16){
					titlePrev = title.substr(0,15) + '..';
				}
				else{
					titlePrev = title;
				}
				
				var id = events[i].id;
				var parentCalId = events[i].organizer.email;
				var eventDate;
				
				if (typeof(events[i].start.dateTime)=='undefined'){
					eventDate = events[i].start.date + 'T00:00:00+0930';
				}
				else{
					eventDate = events[i].start.dateTime;
				}
				
				var dateObj = new Date(eventDate);
				
				var min = dateObj.getMinutes();
				if (min == 0) min = '00';
				
				var dateString = dateObj.getDate() + '/' + (dateObj.getMonth()+1) + '/' + dateObj.getFullYear() + ' ' + dateObj.getHours() + ':' + min;
								
				var location = events[i].location;
				if (typeof(location)=='undefined'){
					location = '';
				}
				var desc
				if (typeof(events[i].description)=='undefined'){
					desc = '';
				}
				else{
					desc = events[i].description;
				}
				
				var descPrev;
				
				if (desc !== ''){
					if (desc.length > 41){
						descPrev = desc.substr(0,39) + '...';
					}
					else{
						descPrev = desc;
					}
				}
				else{
					descPrev = desc;
				}
				
				var html = '<div class="event" id="event'+id+'" alt="'+parentCalId+'">';
				html += '<p>'+titlePrev+'</p>';
				html += '<p>'+dateString+'</p>';
				html += '<p>'+descPrev+'</p>';
				html += '</div>';
				
				eventListObj.push({"date":eventDate,"htmlString":html});
			}
		}
		if(c==(calEvents.length-1)){
			//cJ(eventListObj,'Even List Left Menu');
			res.send(eventListObj);
		}
	}
}
function formatEventsCal(res,calEvents,callback){
	var eventListObj = [];
	var empty = 1;
	for (var c in calEvents){
		events = calEvents[c];
		//cJ(events,'format Events');
		if (events.length > 0) {
			empty = 0;
			for (i = 0;i<events.length; i++) {
				
				//event Id and Cal Id
				
				var id = events[i].id;
				var parentCalId = events[i].organizer.email;
				
				//Title of the event
				var title = events[i].summary;
				
				//Event date
				var eventDate;
				
				if (typeof(events[i].start.dateTime)=='undefined'){
					eventDate = events[i].start.date + 'T00:00:00+0930';
				}
				else{
					eventDate = events[i].start.dateTime;
				}
				
				
				eventListObj.push({"date":eventDate,"title":title,"eventId":id,"calId" : parentCalId});
			}
		}
		if(c==(calEvents.length-1)){
			//cJ(eventListObj,'Even List Left Menu');
			res.send(eventListObj);
		}
	}
}

router.get('/eventList', function(req,res,next){
	
	//Set the tokens from the session
	var tokens = req.session.token;
	
	//Set the calendar ID and the date info
	var calIds = req.query.calId;
	var dateTo = req.query.dateTo;
	var dateFrom = req.query.dateFrom;
	var type = req.query.type;
	
	//Change the callback function depending on the source of the query
	if (type == 'calendar'){
		gatherEvents(res,tokens,calIds,dateTo,dateFrom,formatEventsCal);
	}
	else{
		gatherEvents(res,tokens,calIds,dateTo,dateFrom,formatEvents);
	}
});

router.get('/signedin', function(req,res,next){
	if (typeof(req.session.token) == 'undefined'){
		console.log('Not signed in! returning false');
		res.send(false);
	}
	else{
		console.log('Signed in! returning true');
		res.send(true);
	}
});

function sortCalList(req,r,drawEvents){
	callback(req)
}


router.post('/tokensignin', function(req, res, next) {
	console.log(JSON.stringify(req.body,null,4));
});
module.exports = router;
