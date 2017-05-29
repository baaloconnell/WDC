var dateObj = new Date();
var globMonth;
if ((dateObj.getMonth()+1) < 10){
	globMonth = "0"+(dateObj.getMonth()+1);
}
else{
	globMonth = (dateObj.getMonth()+1);
}
var dayDate = dateObj.getDate();

if (dateObj.getDate() < 10){
	dayDate = '0' + dateObj.getDate();
}

var date = dayDate + '/' + globMonth + '/' + dateObj.getFullYear();

function parseURLParams(url) {
	"use strict";
    var queryStart = url.indexOf("?") + 1;
    var queryEnd   = url.indexOf("#") + 1 || url.length + 1;
    var query = url.slice(queryStart, queryEnd - 1);
    var pairs = query.replace(/\+/g, " ").split("&");
    var parms = {};
	var	i;
	var n;
	var v;
	var nv;

    if (query === url || query === ""){
		return;
	}
    for (i = 0; i < pairs.length; i+=1) {
        nv = pairs[i].split("=", 2);
        n = decodeURIComponent(nv[0]);
        v = decodeURIComponent(nv[1]);

        if (!parms.hasOwnProperty(n)){
			parms[n] = [];
		}
        parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
}


function fixNth(d) {
	"use strict";
	if(d>3 && d<21){
		return d+'th';
	}
	switch (d % 10) {
		case 1:	return d+"st";
		case 2:	return d+"nd";
		case 3:	return d+"rd";
		default: return d+"th";
	}
}
function niceDay(d){
	"use strict";
	switch (d){
		case 1: return 'January';
		case 2: return 'February';
		case 3: return 'Marh';
		case 4: return 'April';
		case 5: return 'May';
		case 6: return 'June';
		case 7: return 'July';
		case 8: return 'August';
		case 9: return 'September';
		case 10: return 'October';
		case 11: return 'November';
		case 12: return 'December';
		default: return 0;
	}
}
function drawSelectedEvent(id,calId){
	"use strict";
	$('#right_col').html('<img src="img/loading.gif" />');
	$.ajax({
		method: "GET",
		url: "drawSpecEvent",
		data: {'eventId' : id , 'calId' : calId}
	}).done(function( response ) {
		console.log("event: " +JSON.stringify(response,null,4));
		var title = response.summary;
		date = response.start.dateTime;
		if (!date){
			date = response.start.date + 'T00:00:00+0930';
		}
		var cleanDateObj = new Date(date);
		
		var cleanDate = fixNth(cleanDateObj.getDate()) + ' of ' + niceDay(cleanDateObj.getMonth()+1) + ' ' + cleanDateObj.getFullYear();
				
		var locationString = response.location;
		if (!locationString){
			locationString = '';
		}
		var desc = response.description;
		if (!desc){
			desc = '';
		}
		var tagHtml='';
		if (response.tag){
			var tag = response.tag;
			var tagId;
			var tagContent;
			var i;
			for (i=0;i<tag.length;i+=1){
				
				tagId = tag[i].id;
				tagContent = tag[i].content;
				
				tagHtml += '<span class="tag" style="position: relative;" contenteditable="true" id="'+tagId+'">'+tagContent+'</span>';
			}
		}
		var eventHtml = '<div class="event_title" contenteditable="true">'+title+'</div><div class="event_date">'+cleanDate + ' ' + locationString + '</div><div class="event_text" contenteditable="true">'+desc+'</div><div class="tags"><img class="tagTrash" alt="Tag trash" src="img/trash.png"/>'+tagHtml+'</div>';
		$('#right_col').html(eventHtml);
	});
}
function custom_sort(b, a) {
	"use strict";
    return new Date(a.date).getTime() - new Date(b.date).getTime();
}
function drawEventList(e){	
	"use strict";
	$('#event_list').html('');
	$('#right_col').html('');
	//Sort by the date of the given events
	e.sort(custom_sort);
	
	//Fill out the HTML using the sorted array
	e.forEach(function(eventVal,c){
		var html = eventVal.htmlString;
		$('#event_list').append(html);
	});
	
	//Select the first event in the list
	var eventId = $('#event_list div').first().attr('id').substr(5);
	var calId = $('#event_list div').first().attr('alt');
	drawSelectedEvent(eventId,calId);
	$('#event_list div').first().addClass('selected');
	$('#eventSelect'+eventId).show();
	
}
function reqEventObj(dateFrom,dateTo){
	"use strict";
	//Load the calendar events given a calendar id array
	$.ajax({
		method: "GET",
		url: "eventList",
		data: {'dateTo':dateTo,'dateFrom':dateFrom,'type':'event'}
	}).done(function( response ) {
		drawEventList(response);
	});
}
function loadNewEvents(d){
	"use strict";
	//day
	var day = d.substr(0,2);
	var month = d.substr(3,2)-1;
	var year = d.substr(6,4);
	
	var dateEnd = new Date(year,month,day,23,59,59,0);
	var dateStart = new Date(dateEnd.toISOString());
	dateStart.setDate(dateStart.getDate()-1);
	
	reqEventObj(dateStart.toISOString(),dateEnd.toISOString());
}
function checkSignInState(){
	"use strict";
	$.ajax({
		method: "GET",
		url: "signedIn"
	}).done(function( msg ) {
		if (!msg){
			window.location.assign('http://localhost:55666/');
		}
		else if(msg==="nocal"){
			window.location.assign('http://localhost:55666/settings.html');
		}
		else{
			var $_GET = parseURLParams(window.location.href);
			if ($_GET){
				drawSelectedEvent($_GET.eid,"personal");
			}
			else{
				loadNewEvents(date);
			}
				
		}
	});
}
	
$(document).ready(function(){
	"use strict";
	//Check if the user is signed in
	checkSignInState();
	$( "#datepicker" ).datepicker({
		inline: true,
		dateFormat: "dd/mm/yy",
		onSelect: function (dateVal) {
			$('#event_list').html('');
			$('#right_col').html('<img src="img/loading.gif" />');
			loadNewEvents(dateVal);
		}
	});
	$( "#datepicker" ).val(date);
	$('#datepickericon').click(function(){
		$('#datepicker').focus();
	});

});
