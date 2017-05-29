var dateObj = new Date();
var year = dateObj.getFullYear();
var month = dateObj.getMonth();

var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function genYear(){
	"use strict";
	var h = "";
	var i;
	for (i=2000;i<2023;i+=1){
		h += "<option>"+i+"</option>";
	}
	return h;
}
var yearHtml = genYear();
function custom_sort(a, b) {
	"use strict";
    return new Date(a.date).getTime() - new Date(b.date).getTime();
}
//Input the events into the given day
function inputEvent(eventId,calendarId,date,eventTitle,fullTitle){
	"use strict";
	var eventHtml = '<div class="eventCal" title="'+fullTitle+'" id="obj'+eventId+'" alt="'+calendarId+'">'+eventTitle+'</div>';
	if ($('.date[alt="'+date+'"] .eventCal').length > 3 && $('.date[alt="'+date+'"] .eventViewAll').length === 0){
		$('.date[alt="'+date+'"]').append('<a class="eventViewAll">View all...</a>');
	}
	else if($('.date[alt="'+date+'"] .eventCal').length <= 3){
		$('.date[alt="'+date+'"]').append(eventHtml);
	}
}
function drawMainCal(dateFrom,dateTo){
	"use strict";
	var eId;
	var calendarId;
	var title;
	var eventDate;
	var dateCal;
	var c;
	var titlePrev;
	//Load the calendar events given a calendar id array
	$.ajax({
		method: "GET",
		url: "eventList",
		data: {'dateTo':dateTo,'dateFrom':dateFrom,'type':'calendar'}
	}).done(function( response ) {
		response.sort(custom_sort);
		for (c=1;c<response.length;c+=1){
			
			eId = response[c].eventId;
			calendarId = response[c].calId;
			
			title = response[c].title;
			if (title.length > 14){
				titlePrev = title.substr(0,13) + '..';
			}
			else{
				titlePrev = title;
			}
			
			eventDate = response[c].date;
			
			dateCal = new Date(eventDate);
			inputEvent(eId,calendarId,dateCal.getDate(),titlePrev,title);
		}
	});
}
function drawEventList(e){	
	"use strict";
	//Sort by the date of the given events
	e.sort(custom_sort);
	var html;
	//Fill out the HTML using the sorted array
	e.forEach(function(eventVal,c){
		html = eventVal.htmlString;
		$('#event_list').append(html);
	});
	
	var eventId = $('.event_title').attr('id');
	$('#event'+eventId).addClass('selected');
	
}
function drawViewAll(dateFrom,dateTo){
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


//Sets the correct size for the calendar elements
function changeCalSize(){
	"use strict";
	var windowHeight = $( window ).height();
	
//Elements that need to adjust
	var offsetElem = 50;
	//Day List
	$('#dayList span').width((windowHeight-offsetElem)/7);
	//Calendar
	$('.calRow span').width(((windowHeight-offsetElem)/7)-2);
	$('.calRow span').height(((windowHeight-offsetElem)/7)-2);
	$('.calRow').width(windowHeight-offsetElem);
}
//Returns days in given month
function daysInMonth(month,year) {
	"use strict";
	return new Date(year, month, 0).getDate();
}

//Work out the number of days to skip
function skipDays(month, year){
	"use strict";
	return new Date(year,month,1).getDay();
}
	
function writeMonth(month,year){
	"use strict";

	month = Number(month);
	
	var monthNormalised = month + 1;
	var dateHtml='';
	var skip = skipDays(month,year);
	var priorMonth;
	var nextMonth;
	
	switch (month){
		case 0:
			priorMonth = 11;
			nextMonth = 1;
			break;
		case 11:
			nextMonth = 0;
			priorMonth = 10;
			break;
		default:
			nextMonth = month + 1;
			priorMonth = month - 1;
	}
	
	//Set the title to month and year
	var titleHtml = '<span id="leftMonth" alt="'+priorMonth+'"> < </span>'+
					'<span id="listMonth" alt="'+month+'">'+monthNames[month] + '</span>'+
					'<select id="listYear" name="year">' + yearHtml + '</select>'+
					'<span id="rightMonth" alt="'+nextMonth+'"> > </span>';
	$('#currPeriod').html(titleHtml);
	$('#listYear').val(year);
	
	
	//write the blank squares
	dateHtml += '<div class="calRow">';
	var c;
	for(c=0;c < skip;c+=1){
		dateHtml += '<span class="nodate">&nbsp;</span>';
	}
	var i;
	//write the days
	for (i=1;i<=daysInMonth(monthNormalised,year);i+=1){
		
		if (daysInMonth(monthNormalised,year) === i){
			//If its the last day of the month write the left over date squares (if any) and end the row div
			dateHtml += '<span class="date" alt="'+i+'">'+i+'</span>';
			for(c=(new Date(year,month,i).getDay());c < 6;c+=1){
				dateHtml += '<span class="nodate">&nbsp;</span>';
			}
			dateHtml += '</div>';
		}
		else if (new Date(year,month,i).getDay() === 6){
			//If its the last day of the week end the row div and start anew
			dateHtml += '<span class="date" alt="'+i+'">'+i+'</span>';
			dateHtml += '</div><div class="calRow">';
		}
		else{
			dateHtml += '<span class="date" alt="'+i+'">'+i+'</span>';
		}
	}
	
	$('#dateList').html(dateHtml);
	changeCalSize();
	
	var lastDay = daysInMonth(monthNormalised,year);
	
	if (monthNormalised < 10){
		monthNormalised = "0"+monthNormalised;
	}
	//alert('01-'+month+'-'+year +'     ,,,,       '+ lastDay+'-'+month+'-'+year);
	
		drawMainCal(monthNormalised+'-01-'+year,monthNormalised+'-'+lastDay+'-'+year);
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
			writeMonth(month,year);
		}
	});
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
$(document).ready(function(){
	"use strict";
	checkSignInState();
	
	//Sets the correct calendar size on window resize
	$( window ).resize(function() {
		changeCalSize();
	});
	
	//Fill the event col on the left when View All is clicked
	$(document).on('click','.eventViewAll',function(){
		
		//Generate the selected date objects
		var dayVal = $(this).parent('span').attr('alt');
		var monthVal = $('#listMonth').attr('alt');
		var yearVal = $('#listYear').val();
		var dateFrom = new Date(yearVal,monthVal,dayVal,0);
		var dateTo = new Date(yearVal,monthVal,dayVal,23,59,59);
		
		//Empty out any current events
		$('#event_list').html('');
		
		//Make the call to get the required calendar IDs and then onto the events
		drawViewAll((dateFrom).toISOString(),(dateTo).toISOString());
	});
	
	//Calendar event click
	$(document).on('click','.eventCal,.event',function(){
		
		//Draw in the events for the selected day
		var eventId = $(this).attr('id');
		var calId = $(this).attr('alt');
		var dayEvent;
		var monthEvent;
		var yearEvent;
		//Generate the selected date objects
		if ($(this).hasClass('eventCal')){
			dayEvent = $(this).parent('span').attr('alt');
			monthEvent = $('#listMonth').attr('alt');
			yearEvent = $('#listYear').val();
		}
		else{
			var unfDate = $('p:nth-child(2)',this).html();
			
			//Collect the date portion
			var myRegexp = /(\d+\/\d+\/\d+)/g;
			var match = myRegexp.exec(unfDate);
			var dateArr = match[0].split('/');
			dayEvent = dateArr[0];
			monthEvent = dateArr[1]-1;
			yearEvent = dateArr[2];
		}
		var dateFrom = new Date(yearEvent,monthEvent,dayEvent,0);
		var dateTo = new Date(yearEvent,monthEvent,dayEvent,23,59,59);
		
		//Empty out any current events
		$('#event_list').html('');
		
		//Make the call to get the required calendar IDs and then onto the events
		drawViewAll((dateFrom).toISOString(),(dateTo).toISOString());
		
		if ($(this).hasClass('eventCal')){
			//Prevent duplicate IDs so have to remove the first three characters 'obj'
			eventId = eventId.substr(3);
		}
		else if ($(this).hasClass('event')){
			//Prevent duplicate IDs so have to remove the first three characters 'event'
			eventId = eventId.substr(5);
		}
		$('#right_col').html('<img src="img/loading.gif" />');
		$.ajax({
			method: "GET",
			url: "drawSpecEvent",
			data: {'eventId' : eventId , 'calId' : calId}
		}).done(function( response ) {
			console.log("event: " +JSON.stringify(response,null,4));
			var title = response.summary;
			var date = response.start.dateTime;
			if (!date){
				date = response.start.date + 'T00:00:00+0930';
			}
			var cleanDateObj = new Date(date);
			
			var cleanDate = fixNth(cleanDateObj.getDate()) + ' of ' + niceDay((cleanDateObj.getMonth()+1)) + ' ' + cleanDateObj.getFullYear();
					
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
				//<span class="tag" style="position: relative;" contenteditable="true">sdf</span>
				for (i=0;i<tag.length;i+=1){
					
					tagId = tag[i].id;
					tagContent = tag[i].content;
					
					tagHtml += '<span class="tag" style="position: relative;" contenteditable="true" id="'+tagId+'">'+tagContent+'</span>';
				}
			}
			var eventHtml = '<div class="event_title" contenteditable="true" id="'+eventId+'">'+title+'</div><div class="event_date">'+cleanDate + ' ' + locationString + '</div><div class="event_text" contenteditable="true">'+desc+'</div><div class="tags"><img class="tagTrash" alt="Tag trash" src="img/trash.png"/>'+tagHtml+'</div>';
			$('#right_col').html(eventHtml).css({'width':'80%','max-width': '700px'});
			$('#event'+eventId).addClass('selected');
		});
		
	});
	//Navigate months
	$(document).on('click','#leftMonth,#rightMonth',function(){
		var nextYear;
		$('#leftMonth,#rightMonth').stop(true, true);
		var currMonth = $(this).attr('alt');
		//Re-write for the new month
		if (Number(currMonth) === 0 && $(this).attr('id') === 'rightMonth'){
			nextYear = Number($('#listYear').val()) + 1;
			$('#listYear').val(nextYear);
		}
		else if (Number(currMonth) === 0 && $(this).attr('id') === 'leftMonth'){
			nextYear = Number($('#listYear').val()) - 1;
			$('#listYear').val(nextYear);
		}
		writeMonth(currMonth,$('#listYear').val());
	});
});
