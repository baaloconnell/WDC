var express = require('express');
var xss = require('xss');
var session = require('express-session');
var async = require('async');

var router = new express.Router();

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

function cJ(e,msg){
	"use strict";
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
	"use strict";
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
		scope: scopes
		// Optional property that passes state parameters to redirect URI
		// state: { foo: 'bar' }
	});
	res.send(url);
});
function addUser(req,res,authinfo){
	"use strict";
	var id = authinfo.id;
	var fn = authinfo.given_name;
	var ln = authinfo.family_name;
	console.log(id + ' ' + fn +  ' ' + ln);
		req.pool.getConnection( function(err,connection) {
		if (err) { 
			throw err;
		}
		//Query inserts a new user and returns their unique ID.
		var query = "INSERT INTO user VALUES (DEFAULT,?,?,?); SELECT LAST_INSERT_ID();";
		connection.query(query,[id,fn,ln], function(err, rows, fields) {
			var uid = rows[1][0]['LAST_INSERT_ID()'];
			req.session.userId = uid;
			connection.release();
			if (err){
				console.log(err);
			}
			else{
				console.log('succ');
				res.redirect('/settings.html');
			}
		});
	});
}
function checkUserExists(req,res,authinfo){
	"use strict";
	var id = authinfo.id;
	req.pool.getConnection( function(err,connection) {
		if (err) {
			res.json({});
			throw err;
		}
		var query = "SELECT count(UserID) AS 'idcount' FROM user WHERE Googleid = ?";
		connection.query(query,[id], function(err, rows, fields) {
			//cJ(rows,'Data from MySQL');
			if (rows[0].idcount === 0){
				connection.release();
				//Insert the user info and redirect to a setup page
				console.log('No user under GID: '+id+ ' ' +rows[0].idcount);
				addUser(req,res,authinfo);
			}
			else{
				query = "SELECT UserID FROM user WHERE Googleid = ?";
				connection.query(query,[id], function(err, rows, fields) {
					if (err){
						console.log(err);
					}
				
					var uid = rows[0].UserID;
					req.session.userId = uid;
					//Make sure they have calendars:
					query = "SELECT count(calID) AS 'calidcount' FROM calendar WHERE UserID = ?";
					connection.query(query,[uid], function(err, rows, fields) {
						connection.release();
						if (rows[0].calidcount === 0){
							//Redirects to setup if no calendar IDs exist;
							res.redirect('/settings.html');
						}
						else{
							//Redirect to events page
							res.redirect('/events.html');
						}
					});
				});
			}
		});
	});
}
/* GET home page. */
router.get('/oauthcallback', function(req, res, next) {
	var accessCode = req.query.code;
	
	var oauthClient = oAuthClient();
	
	oauthClient.getToken(accessCode, function (err, tokens) {
		if (!err) {
			oauthClient.setCredentials(tokens);
			req.session.token = tokens;
			//cJ(req.session , "Session data")
			var prof = google.oauth2({
				version: 'v2',
				auth: oauthClient
			});
			prof.userinfo.get({
				auth: oauthClient
			}, function (err, response) {
				if (!err) {
					var idToken = response.id;
					//cJ(response,'Auth info')
					checkUserExists(req,res,response);
					
					req.session.idToken = idToken;
				}
				else{
					cJ(err,'user info error');
				}
			});
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
	
	console.log(calId + ':' + eId);
	
	if (calId === "personal"){
		var response = {};
		req.pool.getConnection( function(err,connection) {
			if (err) { 
				res.json({}); 
				throw err; 
			}
			var query = "SELECT * FROM event WHERE id = ? AND UserID = ?";
			connection.query(query,[eId,req.session.userId], function(err, rows, fields) {
				connection.release();
				if (err){
					console.log(err);
				}
				else if(rows.length > 0){
					//cJ(rows,'Data from EVENT QUERY');
					//Get the Title
					if (rows[0].Title){
						response.summary = rows[0].Title;
					}
					//Get the Description
					if (rows[0].Description){
						response.description = rows[0].Description;
					}
					//Get the Timestamp
					if (rows[0].Timestamp){
						response.start = {};
						response.start.dateTime = rows[0].Timestamp;
					}
					//Get the Location
					if (rows[0].Location){
						response.location = rows[0].Location;
					}
					//Get the tags
					if (rows[0].Tag){
						var tagCSV = rows[0].Tag;
						var tagArr = tagCSV.split(',');
						var returnTags = [];
						response.tag = [];
						req.pool.getConnection( function(err,connection) {
							if (err) { 
								res.json({}); 
								throw err; 
							}
							async.forEachOf(tagArr, function (data, key, callback) {
								if (data){
									query = "SELECT content FROM tags WHERE idtags = ? AND uid = ?";
									connection.query(query,[data,req.session.userId], function(err, rowTag, fields) {
										if (err){
											console.log(err);
										}
										else if (rowTag && rowTag[0].content){
											returnTags.push({'id':data,'content':rowTag[0].content});
										}
										callback();
									});
								}
								else{
									callback();
								}
							}, function (err) {
								response.tag = returnTags;
								connection.release();
								res.send(response);
							});
						});
					}
					else{
						res.send(response);
					}
				}
				else{
					res.send(response);
				}
			});
		});
	}
	else{	
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
			//cJ(response,'GOOGLE CAL RESPONSE HERE')
			//Check the DB for any data on the selected event
			req.pool.getConnection( function(err,connection) {
				if (err) { 
					res.json({}); 
					throw err; 
				}
				var query = "SELECT * FROM event WHERE EventID = ? AND UserID = ?";
				connection.query(query,[eId,req.session.userId], function(err, rows, fields) {
					connection.release();
					if (err){
						console.log(err);
					}
					else if(rows.length > 0){
						//cJ(rows,'Data from EVENT QUERY');
						//Get the Title
						if (rows[0].Title){
							response.summary = rows[0].Title;
						}
						//Get the Description
						if (rows[0].Description){
							response.description = rows[0].Description;
						}
						//Get the tags
						if (rows[0].Tag){
							var tagCSV = rows[0].Tag;
							var tagArr = tagCSV.split(',');
							var returnTags = [];
							response.tag = [];
							req.pool.getConnection( function(err,connection) {
								if (err) { 
									res.json({}); 
									throw err; 
								}
								async.forEachOf(tagArr, function (data, key, callback) {
									if (data){
										query = "SELECT content FROM tags WHERE idtags = ? AND uid = ?";
										connection.query(query,[data,req.session.userId], function(err, rowTag, fields) {
											if (err){
												console.log(err);
											}
											else if (rowTag && rowTag[0].content){
												returnTags.push({'id':data,'content':rowTag[0].content});
											}
											callback();
										});
									}
									else{
										callback();
									}
								}, function (err) {
									response.tag = returnTags;
									connection.release();
									res.send(response);
								});
							});
						}
						else{
							res.send(response);
						}
					}
					else{
						res.send(response);
					}
				});
			});
		});
	}
});

//Returns a list of calendar IDs and names attached to a login
router.get('/calIdList', function(req,res,next){
	var oauthClient = oAuthClient();
	var tokens = req.session.token;
	var id = req.session.userId;
	oauthClient.setCredentials(tokens);
	var cal = google.calendar({
		version: 'v3',
		auth: oauthClient
	});
	req.pool.getConnection( function(err,connection) {
			if (err) { 
				res.json({}); 
				throw err; 
			}
			var query = "SELECT CalID FROM calendar WHERE UserID = ?";
			connection.query(query,[id], function(err, rows, fields) {
				connection.release();
				
				cal.calendarList.list({
				auth: oauthClient
				}, function (err, response) {
					if (!err) {
						var calId = [];
						var sel;
						var i;
						var c;
						for (i=0;i<response.items.length;i+=1){
							if (rows.length > 0){
								sel = 0;
								for (c=0;c<rows.length;c+=1){
									if (response.items[i].id === rows[c].CalID){
										sel = 1;
									}
								}
							}
							calId[i] = {
								id: response.items[i].id,
								name: response.items[i].summary,
								desc: response.items[i].description,
								selected: sel
							};
						}
						res.send(calId);
					}
					else{
						cJ(err , 'calendar ids error');
					}
				});
			});
	});
	
	
});
router.post('/calIdSet', function(req,res,next){
	var uid = req.session.userId;
	
	//cJ(req.body,'calIdSet');
	
	//First remove all the existing entries
	var query = "DELETE FROM calendar WHERE UserID = ?;";
	var qArr = [uid];
	async.forEachOf(req.body, function (data, key, callback) {
		console.log(key + ' ' + data);
		query += "INSERT INTO calendar VALUES (DEFAULT,?,?,?);";
		qArr.push(uid,key,data);
		callback();
	}, function (err) {
		if (err){
			console.error(err.message);
		}
		console.log(query);
		var i;
		for (i=0;i<qArr.length;i+=1){
			console.log(qArr[i]);
		}
		req.pool.getConnection( function(err,connection) {
			if (err) {
				throw err;
			}
			connection.query(query,qArr, function(err, rows, fields) {
				if (err){
					console.log(err);
				}
				connection.release();
				console.log(rows);
				res.sendStatus(200);
			});
		});
	});
});
router.get('/calIdCheck', function(req,res,next){
	var id = req.session.idToken;
	if (id){
		req.pool.getConnection( function(err,connection) {
			if (err) {
				res.json({});
				throw err;
			}
			var query = "SELECT count(UserID) AS 'calidcount' FROM calendar WHERE Googleid = ?";
			connection.query(query,[id], function(err, rows, fields) {
				connection.release();
				if (rows[0].idcount === 0){
					//Redirects to setup if no calendar IDs exist;
					res.redirect('/settings.html');
				}
				else{
					//Redirect to events page
					res.redirect('/events.html');
				}
			});
		});
	}
});
function gatherEvents(req,res,token,calIdArr,dateTo,dateFrom,callback){
	"use strict";
	//cJ(calIdArr,'cal IDs passed to draw all events');
	var oauthClient = oAuthClient();
	var tokens = token;
	oauthClient.setCredentials(tokens);
	var cal = google.calendar({
		version: 'v3',
		auth: oauthClient
	});
	var eventArr = [];
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
					//cJ(response,'Found!!! for calId: "'+calIdVal+'"');
					response.items.calid = calIdVal;
					eventArr.push(response.items);
				}
				else if (response !== 'Not Found'){
					//cJ(response,'Not found error for calId: "'+calIdVal+'"');
				}
			}
			else{
				cJ(err,'event error with calendar ID: ' + calIdVal);
			}
			callback();
		});
	}, function (err) {
		if (err){
			console.error(err.message);
		}
		// eventArr is now an array of event info
		req.pool.getConnection( function(err,connection) {
			if (err) { 
				console.log(err); 
			}
			var timeFrom = new Date(dateFrom);
			var timeTo =  new Date(dateTo);
			/* dT.setHours(23,59,59);
			
			var timeFrom = dF.toISOString();
			var timeTo = dT.toISOString(); */
			console.log(timeFrom + ' -> ' + timeTo);
			
			var query = "SELECT id,Location as location,Description as description,Title as summary,Timestamp,Tag,CalID FROM event WHERE EventID IS NULL AND UserID = ? AND CalID = 'personal' AND timestamp > ? AND timestamp < ?";
			connection.query(query,[req.session.userId,timeFrom,timeTo], function(err, rows, fields) {
				connection.release();
				if (err){
					console.log(err);
				}
				else if (rows.length>0){
					var i;
					for (i=0;i<rows.length;i+=1){
						rows[i].start = {};
						rows[i].organizer = {};
						rows[i].kind = 'custom';
						rows[i].start.dateTime = rows[i].Timestamp;
						rows[i].organizer.email = rows[i].CalID;
						eventArr.push([rows[i]]);
					}
					//cJ(rows,'collected Events')
				}
					//cJ(eventArr,'final Events')
					callback(req,res,eventArr);
				
				});
			});
	});
}
				
function formatEvents(req,res,calEvents,callback){
	"use strict";
	//calEvents is an array, one row per calendar, each contains arrays of JSON objects for the events found on the day
	//First clean up the array
	//cJ(calEvents,'----------------------------------------------------------------');
	var eventCleanArr = [];
	var eventListObj=[];
	var c;
	async.forEachOf(calEvents, function (eventArr, key, callback) {
		for (c=0;c<eventArr.length;c+=1){
			if (typeof(eventArr[c])!=="string"){
				eventCleanArr.push(eventArr[c]);
			}
		}
		callback();
	}, function(err){
		if (err){
			console.log(err);
		}
		else{
			
			async.forEachOf(eventCleanArr, function (event, key, callback) {
				
				//cJ(event);
				var id = event.id;
				var parentCalId = event.organizer.email;
				var title = event.summary;
				var desc='';
				
				if (event.kind !== "custom"){
				//Set the title checking each step is defined to avoid errors
				req.pool.getConnection( function(err,connection) {
					if (err) { 
						res.json({}); 
						throw err; 
					}
					var query = "SELECT * FROM event WHERE EventID = ? AND UserID = ?";
					connection.query(query,[id,req.session.userId], function(err, rows, fields) {
						connection.release();
						if (err){
							console.log(err);
						}
						else if(rows.length > 0){
							//cJ(rows,'Data from EVENT QUERY');
							if (rows[0].Title){
								title=rows[0].Title;
								console.log('DB Title '+title);
							}
							if (rows[0].Description){
								desc=rows[0].Description;
							}
						}
						var titlePrev='';
						if (title.length > 16){
							titlePrev = title.substr(0,15) + '..';
						}
						else{
							titlePrev = title;
						}
						
						var eventDate;
						
						if (!event.start.dateTime){
							eventDate = event.start.date + 'T00:00:00+0930';
						}
						else{
							eventDate = event.start.dateTime;
						}
						
						var dateObj = new Date(eventDate);
						
						var min = dateObj.getMinutes();
						if (min === 0){
							min = '00';
						}
						var dateString = dateObj.getDate() + '/' + (dateObj.getMonth()+1) + '/' + dateObj.getFullYear() + ' ' + dateObj.getHours() + ':' + min;
										
						var location = event.location;
						if (!location){
							location = '';
						}
						var descPrev;
						
						if (desc === ''){
							if (!event.description){
								desc = '';
							}
							else{
								desc = event.description;
							}
						}
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
						console.log("HTML: " + html);
						eventListObj.push({"date":eventDate,"htmlString":html});
						callback();
					});
				});
				}
				else{
					var titlePrev;
					if (title.length > 16){
							titlePrev = title.substr(0,15) + '..';
					}
					else{
						titlePrev = title;
					}
					
					var eventDate;
					
					if (!event.start.dateTime){
						eventDate = event.start.date + 'T00:00:00+0930';
					}
					else{
						eventDate = event.start.dateTime;
					}
					
					var dateObj = new Date(eventDate);
					
					var min = dateObj.getMinutes();
					if (min === 0){
						min = '00';
					}
					var dateString = dateObj.getDate() + '/' + (dateObj.getMonth()+1) + '/' + dateObj.getFullYear() + ' ' + dateObj.getHours() + ':' + min;
									
					var location = event.location;
					if (!location){
						location = '';
					}
					var descPrev;
					
					if (desc === ''){
						if (!event.description){
							desc = '';
						}
						else{
							desc = event.description;
						}
					}
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
					console.log("HTML: " + html);
					eventListObj.push({"date":eventDate,"htmlString":html});
					callback();
				}
			}, function(err){
				if (err){
					console.log(err);
				}
				else{
					//cJ(eventListObj , "List of Events to push");
					res.send(eventListObj);
				}
			});
		}
	});
	
}
function formatEventsCal(req,res,calEvents,callback){
	"use strict";
	var eventCleanArr = [];
	var eventListObj=[];
	var c;
	async.forEachOf(calEvents, function (eventArr, key, callback) {
		for (c=0;c<eventArr.length;c+=1){
			if (typeof(eventArr[c])!=="string"){
				eventCleanArr.push(eventArr[c]);
			}
		}
		callback();
	}, function(err){
		if (err){
			console.log(err);
		}
		else{
			
			async.forEachOf(eventCleanArr, function (event, key, callback) {
				
				//cJ(event);
				if (event.kind !== "undefined"){
				var id = event.id;
				var parentCalId = event.organizer.email;
				
				var title = event.summary;
				
				//Set the title checking each step is defined to avoid errors
				req.pool.getConnection( function(err,connection) {
					if (err) { 
						res.json({}); 
						throw err; 
					}
					var query = "SELECT * FROM event WHERE EventID = ? AND UserID = ?";
					connection.query(query,[id,req.session.userId], function(err, rows, fields) {
						connection.release();
						if (err){
							console.log(err);
						}
						else if(rows.length > 0){
							//cJ(rows,'Data from EVENT QUERY');
							if (rows[0].Title){
								title=rows[0].Title;
								console.log('DB Title '+title);
							}
						}
						//Event date
						var eventDate;
						
						if (!event.start.dateTime){
							eventDate = event.start.date + 'T00:00:00+0930';
						}
						else{
							eventDate = event.start.dateTime;
						}
						
						
						eventListObj.push({"date":eventDate,"title":title,"eventId":id,"calId" : parentCalId});
						callback();
					});
				});
				}
			}, function(err){
				if (err){
					console.log(err);
				}
				else{
					//cJ(eventListObj , "List of Events to push");
					res.send(eventListObj);
				}
			});
		}
	});
}

router.get('/eventList', function(req,res,next){
	
	//Set the tokens from the session
	var tokens = req.session.token;
	var uid = req.session.userId;
	
	//cJ(req.query);
	
	//Set vars from get values
	var dateTo = req.query.dateTo;
	var dateFrom = req.query.dateFrom;
	var type = req.query.type;
	var id = req.session.idToken;
	//Get the calendar ID from the DB
	var calIds=[];
	req.pool.getConnection( function(err,connection) {
		if (err) {
			throw err; 
		}
		var query = "SELECT CalID FROM calendar WHERE UserID = ?";
		connection.query(query,[uid], function(err, rowsCalID, fields) {
			connection.release();
			//cJ(rowsCalID,'calidquery');
			async.forEachOf(rowsCalID, function (data, key, callback) {
				calIds.push(data.CalID);
				callback();
			}, function (err) {
				console.log(calIds);
				if (type === 'calendar'){
					gatherEvents(req,res,tokens,calIds,dateTo,dateFrom,formatEventsCal);
				}
				else{
					gatherEvents(req,res,tokens,calIds,dateTo,dateFrom,formatEvents);
				}
			});
		});
	});
	//Change the callback function depending on the source of the query
	
});

router.get('/signedin', function(req,res,next){
	if (!req.session.token){
		console.log('Not signed in! returning false');
		res.send(false);
	}
	else{
		var	uid = req.session.userId;
		req.pool.getConnection( function(err,connection) {
			if (err) {
				res.json({});
				throw err;
			}
			var query = "SELECT count(calID) AS 'calidcount' FROM calendar WHERE UserID = ?";
			connection.query(query,[uid], function(err, rows, fields) {
				connection.release();
				if (rows[0].calidcount === 0){
					//Redirects to setup if no calendar IDs exist;
						res.send("nocal");
				}
				else{
					//Send true back for client
					console.log('Signed in! returning true');
					res.send(true);
				}
			});
		});
	}
});

router.get('/name',function(req,res,next){
	if (req.session){
		var	uid = req.session.userId;
		req.pool.getConnection( function(err,connection) {
			if (err) {
				res.json({});
				throw err;
			}
			var query = "SELECT Firstname FROM user WHERE UserID = ?";
			connection.query(query,[uid], function(err, rows, fields) {
				connection.release();
				if (rows[0]){
					res.send({'name':rows[0].Firstname});
				}
			});
		});
	}
});

router.post('/tagInsert', function(req,res,next){
	var tagContent = xss(req.body.value);
	var userId = req.session.userId;
	
	req.pool.getConnection( function(err,connection) {
		if (err) {
			console.log(err); 
		}
		var query = "SELECT idtags FROM tags WHERE uid = ? AND content = ?";
		connection.query(query,[userId,tagContent], function(err, rows, fields) {
			//cJ(rows,'SQL TAG UPDATE');
			if (err){
				console.log(err);
			}
			var tagId;
			//First check if the tag exists
			//If there are no matching tags, create it and return the ID
			if (!rows[0]){
				query = "INSERT INTO tags VALUES (DEFAULT,?,?); SELECT LAST_INSERT_ID();";
				connection.query(query,[userId,tagContent], function(err, rows, fields) {
					connection.release();
					if (err){
						console.log(err);
					}
					else{
						//cJ(rows,'SQL TAG NEW');
						tagId = rows[1][0]['LAST_INSERT_ID()'];
						
						console.log("New: "+tagId);
						res.send({returnId:tagId});
					}
				});
			}
			else{
				connection.release();
				tagId = rows[0].idtags;
				console.log("Exists: "+tagId);
				res.json({returnId:tagId});
			}
		});
	});
	
});

function drawLeftColSearch(req,res,r){
	"use strict";
	var eventsArr=[];
	async.forEachOf(r, function (data, key, callback) {
		var eId = data.EventID;
		var calId = data.CalID;
		var title = data.Title;
		var desc = data.Description;
		var descPrev ='';
		var titlePrev ='';
		var eventDate;
		var dateObj;
		var dateString;
		var html;
		var min;
		if (calId === "personal"){
			eId = data.id;
			if (title.length > 16){
				titlePrev = title.substr(0,15) + '..';
			}
			else{
				titlePrev = title;
			}
			
			if (desc){
				if (desc.length > 41){
					descPrev = desc.substr(0,39) + '...';
				}
				else{
					descPrev = desc;
				}
			}
			
			//Event date
			eventDate = data.Timestamp;
			
			dateObj = new Date(eventDate);
			
			min = dateObj.getMinutes();
			if (min === 0){
				min = '00';
			}
			dateString = dateObj.getDate() + '/' + (dateObj.getMonth()+1) + '/' + dateObj.getFullYear() + ' ' + dateObj.getHours() + ':' + min;
			
			html = '<div class="event" id="event'+eId+'" alt="'+calId+'">';
			html += '<p>'+titlePrev+'</p>';
			html += '<p>'+dateString+'</p>';
			html += '<p>'+descPrev+'</p>';
			html += '</div>';
			console.log("HTML: " + html);
			eventsArr.push({"date":eventDate,"htmlString":html});
			callback();
		}
		else{
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
				if (err){
					console.log(err);
				}
				else{
					
					if (!title && response.summary){
						title = response.summary;
					}
					if (title.length > 16){
						titlePrev = title.substr(0,15) + '..';
					}
					else{
						titlePrev = title;
					}
					
					if (!desc && response.description){
						desc = response.description;
					}
					if (desc){
						if (desc.length > 41){
							descPrev = desc.substr(0,39) + '...';
						}
						else{
							descPrev = desc;
						}
					}
					
					//Event date
					if (!response.start.dateTime){
						eventDate = response.start.date + 'T00:00:00+0930';
					}
					else{
						eventDate = response.start.dateTime;
					}
					
					dateObj = new Date(eventDate);
					
					min = dateObj.getMinutes();
					if (min === 0){
						min = '00';
					}
					dateString = dateObj.getDate() + '/' + (dateObj.getMonth()+1) + '/' + dateObj.getFullYear() + ' ' + dateObj.getHours() + ':' + min;
					
					html = '<div class="event" id="event'+eId+'" alt="'+calId+'">';
					html += '<p>'+titlePrev+'</p>';
					html += '<p>'+dateString+'</p>';
					html += '<p>'+descPrev+'</p>';
					html += '</div>';
					console.log("HTML: " + html);
					eventsArr.push({"date":eventDate,"htmlString":html});
					callback();
				}
			});
		}
	}, function (err) {
		if (err){
			console.log(err);
		}
		else{
			//cJ(eventsArr,'search G events');
			res.send(eventsArr);
		}
	});
}
router.get('/search', function(req,res,next){
	var searchQ = xss(req.query.value);
	var userId = req.session.userId;
	searchQ = searchQ.split(" ").join("|");
	searchQ = '.*'+searchQ+'.*';
	req.pool.getConnection( function(err,connection) {
		if (err) {
			console.log(err); 
		}
		//First get any tags associated with the search string:
		var query = "SELECT idtags FROM tags WHERE content REGEXP ? AND uid = ?";
		connection.query(query,[searchQ,userId], function(err, rows, fields) {
			//cJ(rows,'SQL SEARCH');
			if (err){
				console.log(err);
			}
			else if (rows){
				var rowStr = '';
				var tagS;
				if (rows.length>0){
					var i;
					for (i=0;i<rows.length;i+=1){
						rowStr += rows[i].idtags;
						if (i !== rows.length-1){
							rowStr += '|';
						}
					}
					console.log(rowStr);
					tagS = 'REGEXP';
				}
				else if (rows.length===0){
					rowStr = '%NULL%';
					tagS = 'LIKE';
				}
				else{
					rowStr = rows[0].idtags;
					tagS = '=';
				}
				
				//Now query the DB for the events
				query = "SELECT id,EventID,CalID,Title,Timestamp,Description FROM event WHERE Tag "+tagS+" ? OR Title REGEXP ? OR Description REGEXP ? OR Location REGEXP ?";
				connection.query(query,[rowStr,searchQ,searchQ,searchQ], function(err, rows, fields) {
					connection.release();
					//cJ(rows,'SQL SEARCH FINAL');
					if (err){
						console.log(err);
					}
					else{
						if (rows.length>0){
							//Send the data to a function to populate the left column with the events that have been found
							drawLeftColSearch(req,res,rows);
						}
						else{
							//Not found
							res.send('');
						}
					}
				});
			}
		});
	});
	
});
router.post('/descUpdate', function(req,res,next){
	//cJ(req.body,'DESC UPDDATE');
	var eventid = req.body.id;
	var calID = req.body.calId;
	var val = req.body.value;
	var type = xss(req.body.type);
	var colName = "EventID";
	if (calID === "personal"){
		colName = "id";
	}
	var userId = req.session.userId;
	console.log('Updated '+type+' '+eventid+' with ' + val + ' for ' + userId);
	//Update DB with description for given event ID
	req.pool.getConnection( function(err,connection) {
		if (err) {
			console.log(err); 
		}
		//First check if the event exists
		var query = "SELECT count(id) as 'eidCount' FROM event WHERE UserID = ? AND "+colName+" = ?";
		var sendArr = [];
		connection.query(query,[userId,eventid], function(err, rows, fields) {
			//cJ(rows,'SQL DESC UPDATE');
			if (err){
				console.log(err);
			}
			else{
				//Check the type and make the appropriate update
				if (rows[0].eidCount > 0){
					console.log('update '+type);
					query = "UPDATE event SET "+type+" = ? WHERE "+colName+" = ? AND UserID = ?";
					sendArr = [val,eventid,userId];
				}
				else{
					console.log('insert '+type);
					query = "INSERT INTO event ("+colName+",UserID,CalID,"+type+") VALUES (?,?,?,?)";
					sendArr = [eventid,userId,calID,val];
				}
				
				connection.query(query,sendArr, function(err, rows, fields) {
					connection.release();
					if (!err){
						console.log('That worked');
						res.send('OK');
					}
					else{
						console.log(err);
					}
				});
			}
		});
	});
});
router.post('/signOut', function(req,res,next){
	if (!req.session.token){
		res.send(true);
	}
	else{
		req.session.destroy(function(err) {
			res.send(true);
		});
	}
});

//Sanitises the input on event addition or edit
function cleanData(req,res,callback){
	"use strict";
	//cJ(req.body,'post');
	var subData = {};
	subData.tags = [];
	//Loops around the post data creating a json object of key value pairs sanitised by the XSS module
	async.forEachOf(req.body, function (data, key, callback) {
		console.log(key + '     ' + data);
		if (key === 'tagArr'){
			var i;
			for (i=0;i<data.length;i+=1){
				subData.tags.push({'id':xss(data[i].id), 'content' : xss(data[i].content)});
			}
		}
		else{
			subData[key] = xss(data);
		}
		callback();
	}, function (err) {
		if (err){
			console.error(err.message);
		}
		callback(req,res,subData);
	});
}

function submitEvent(req,res,cleanArr){
	"use strict";
	var uid = req.session.userId;
	var loc = cleanArr.loc;
	var title = cleanArr.title;
	var desc = cleanArr.desc;
	var tagArr = cleanArr.tags;
	//Turn the date into a proper timestamp
	var date = cleanArr.date;
	var dateObj = new Date(date.substr(6,4),(date.substr(3,2)-1),date.substr(0,2),date.substr(-5,2),date.substr(-2));
	
	//Process the tags
	var tagId;
	var tagCont;
	var tagIdArr = [];
	cJ(tagArr,'tags');
 	async.forEachOf(tagArr, function (data, key, callback) {
		tagId = data.id;
		tagCont = data.content;
		if (tagId === "new"){
			console.log('Reviewing new tag '+tagCont);
			//Insert the new tag into the DB and add the new ID to the tagIdArr
			//First check if the tag exists
			req.pool.getConnection( function(err,connection) {
				if (err) {
					console.log(err); 
				}
				var query = "SELECT idtags FROM tags WHERE uid = ? AND content = ?";
				connection.query(query,[uid,tagCont], function(err, rows, fields) {
					//cJ(rows,'SQL TAG UPDATE');
					if (err){
						console.log(err);
					}
					//If there are no matching tags, create it and return the ID
					if (!rows[0]){
						console.log(tagCont + ' is not in the DB, inserting:');
						query = "INSERT INTO tags VALUES (DEFAULT,?,?); SELECT LAST_INSERT_ID();";
						connection.query(query,[uid,tagCont], function(err, rows, fields) {
							console.log('Inserted '+tagCont);
							connection.release();
							if (err){
								console.log(err);
							}
							else{
								//cJ(rows,'SQL TAG NEW');
								tagId = rows[1][0]['LAST_INSERT_ID()'];
								
								console.log("Succesfully inserted: '"+tagCont+ "' into the DB with ID:"+tagId);
								tagIdArr.push(tagId);
								callback();
							}
						});
					}
					else{
						connection.release();
						tagId = rows[0].idtags;
						console.log(tagCont + ' Is in the DB already with ID:' + rows[0].idtags);
						tagIdArr.push(tagId);
						callback();
					}
				});
			});
		}
		else{
			console.log('Reviewing old tag '+tagCont);
			tagIdArr.push(tagId);
			callback();
		}
	}, function (err){
		if (err){
			console.log(err);
		}
		var tagStr = 'NULL';
		if (tagIdArr){
			tagStr = tagIdArr.join(',');
		}
		console.log(tagStr);
		console.log(uid+ "   " +loc+ "   " +desc+ "   " +title+ "   " +tagStr);
		req.pool.getConnection( function(err,connection) {
			if (err) {
				throw err; 
			}
			var query = "INSERT INTO event VALUES (DEFAULT,NULL,?,?,?,?,?,?,'personal'); SELECT LAST_INSERT_ID();";
			connection.query(query,[uid,loc,desc,title,dateObj,tagStr], function(err, rows, fields) {
				connection.release();
				if (!err){
					var eId = rows[1][0]['LAST_INSERT_ID()'];
					res.json({'newId' : eId});
				}
				else{
					console.log(err);
				}
			});
		});
	});
}



router.post('/addEvent', function(req,res,next){
	cleanData(req,res,submitEvent);
});

router.get('/tagCheck', function(req, res, next) {
	var uid = req.session.userId;
	var searchString = xss(req.query.ss) + '%';
	
	req.pool.getConnection( function(err,connection) {
		if (err) { 
			throw err;
		}
		//Query inserts a new user and returns their unique ID.
		var query = "SELECT idtags,content FROM tags WHERE uid = ? AND content LIKE ?";
		connection.query(query,[uid,searchString], function(err, rows, fields) {
			connection.release();
			if (err){
				console.log(err);
			}
			res.json(rows);
		});
	});
});

router.post('/delAcc', function(req, res, next) {
	var id = req.session.userId;
	req.pool.getConnection( function(err,connection) {
		if (err) { 
			throw err;
		}
		//Delete all associated tags
		var query = "DELETE FROM tags WHERE uid = ?;";
		query += "DELETE FROM calendar WHERE UserID = ?;";
		query += "DELETE FROM event WHERE UserID = ?;";
		query += "DELETE FROM user WHERE UserID = ?";
		
		connection.query(query,[id,id,id,id], function(err, rows, fields) {
			connection.release();
			if (err){
				console.log(err);
			}
			console.log('Account Deleted');
			req.session.destroy(function(err) {
				if (err){
					console.log(err);
				}
				res.send('done');
			});
		});
	});
});
module.exports = router;
