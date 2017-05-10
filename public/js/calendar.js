var dateObj = new Date();
var year = dateObj.getFullYear();
var month = dateObj.getMonth();

var date = dateObj.getDate();
var day = dateObj.getDay();

var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function genYear(){
	var h;
	for (i=2000;i<2023;i+=1){
		h += "<option>"+i+"</option>";
	}
	return h;
}
var yearHtml = genYear();
function drawMainCal(calIdArr,dateFrom,dateTo){
	//Load the calendar events given a calendar id array
	$.ajax({
		method: "GET",
		url: "eventList",
		data: {'calId' : calIdArr,'dateTo':dateTo,'dateFrom':dateFrom,'type':'calendar'}
	}).done(function( response ) {
		console.log(JSON.stringify(response,null,4));
		response.sort(custom_sort);
		for (var c in response){
			
			var eId = response[c].eventId;
			var calendarId = response[c].calId;
			
			var title = response[c].title;
			if (title.length > 14){
				titlePrev = title.substr(0,13) + '..';
			}
			else{
				titlePrev = title;
			}
			
			var eventDate = response[c].date;
			
			var dateObj = new Date(eventDate);
			inputEvent(eId,calendarId,dateObj.getDate(),titlePrev,title);
		}
	});
}
function drawViewAll(calIdArr,dateFrom,dateTo){
	//Load the calendar events given a calendar id array
	$.ajax({
		method: "GET",
		url: "eventList",
		data: {'calId' : calIdArr,'dateTo':dateTo,'dateFrom':dateFrom,'type':'event'}
	}).done(function( response ) {
	console.log("BEFORE SEND"+JSON.stringify(response,null,4));
		drawEventList(response);
	});
}
function custom_sort(a, b) {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
}
function drawEventList(e){	
	console.log("BEFORE SORT"+JSON.stringify(e,null,4));
	//Sort by the date of the given events
	e.sort(custom_sort);
	console.log("AFTER SORT"+JSON.stringify(e,null,4));
	
	//Fill out the HTML using the sorted array
	e.forEach(function(eventVal,c){
		var html = eventVal.htmlString;
		$('#event_list').append(html);
	});
	
}
function getCalIds(type,dateFrom,dateTo){
	//Load the calendar events given a calendar id from the back end
	$.ajax({
		method: "GET",
		url: "calIdList"
	}).done(function( response ) {
		//response now holds a JSON object of all the calendar IDs
		//Depending on the type of the call change the callback function
		if (type === "mainCal"){
			drawMainCal(response,dateFrom,dateTo);
		}
		else if(type === "viewAll"){
			drawViewAll(response,dateFrom,dateTo);
		}
	});
}


//Sets the correct size for the calendar elements
function changeCalSize(){
	
	var windowHeight = $( window ).height();
	var windowWidth = $( window ).width();
	
//Elements that need to adjust
	var offsetElem = 500;
	//Day List
		$('#dayList span').width((windowWidth-offsetElem)/7);
	//Calendar
	var calendarPosition = $('#dateList').offset().top;
	var calendarHeight = $('#dateList').height();
		$('.calRow span').width(((windowWidth-offsetElem)/7)-2);
		$('.calRow span').height(((windowWidth-offsetElem)/7)-2);
		$('.calRow').width(windowWidth-offsetElem);
}
//Returns days in given month
function daysInMonth(month,year) {
	return new Date(year, month, 0).getDate();
}

//Work out the number of days to skip
function skipDays(month, year){
	return new Date(year,month,1).getDay();
}
	
function writeMonth(month,year){

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
	
	for(var c=0;c < skip;c++){
		dateHtml += '<span class="nodate">&nbsp;</span>';
	}
	
	//write the days
	for (i=1;i<=daysInMonth(monthNormalised,year);i++){
		
		if (daysInMonth(monthNormalised,year) === i){
			//If its the last day of the month write the left over date squares (if any) and end the row div
			dateHtml += '<span class="date" alt="'+i+'">'+i+'</span>';
			for(var c=(new Date(year,month,i).getDay());c < 6;c++){
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
	
	lastDay = daysInMonth(monthNormalised,year);
	
	if (monthNormalised < 10) monthNormalised = "0"+monthNormalised;
	//alert('01-'+month+'-'+year +'     ,,,,       '+ lastDay+'-'+month+'-'+year);
	getCalIds('mainCal',monthNormalised+'-01-'+year,monthNormalised+'-'+lastDay+'-'+year);
}

//Input the events into the given day
function inputEvent(eventId,calendarId,date,eventTitle,fullTitle){
	
	var eventHtml = '<div class="eventCal" title="'+fullTitle+'" id="obj'+eventId+'" alt="'+calendarId+'">'+eventTitle+'</div>';
	if ($('.date[alt="'+date+'"] .eventCal').length > 3 && $('.date[alt="'+date+'"] .eventViewAll').length === 0){
		$('.date[alt="'+date+'"]').append('<a class="eventViewAll">View all...</a>');
	}
	else if($('.date[alt="'+date+'"] .eventCal').length <= 3){
		$('.date[alt="'+date+'"]').append(eventHtml);
	}
}
function checkSignInState(){
	$.ajax({
		method: "GET",
		url: "signedIn"
	}).done(function( msg ) {
		if (!msg){
			window.location.assign('http://localhost:55666/');
		}
		else{
			writeMonth(month,year);
		}
	});
}
function fixNth(d) {
	if(d>3 && d<21) return d+'th';
	switch (d % 10) {
		case 1:	return d+"st";
		case 2:	return d+"nd";
		case 3:	return d+"rd";
		default: return d+"th";
	}
}
function niceDay(d){
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
	
	checkSignInState();
	
	//Sets the correct calendar size on window resize
	$( window ).resize(function() {
		changeCalSize();
	});
	
	//Fill the event col on the left when View All is clicked
	$(document).on('click','.eventViewAll',function(){
		
		//Generate the selected date objects
		var day = $(this).parent('span').attr('alt');
		var month = $('#listMonth').attr('alt');
		var year = $('#listYear').val();
		var dateFrom = new Date(year,month,day,0);
		var dateTo = new Date(year,month,day,23,59,59);
		
		//Empty out any current events
		$('#event_list').html('');
		
		//Make the call to get the required calendar IDs and then onto the events
		getCalIds('viewAll',(dateFrom).toISOString(),(dateTo).toISOString());	
	});
	
	//Calendar event click
	$(document).on('click','.eventCal,.event',function(){
		
		//Draw in the events for the selected day
		var eventId = $(this).attr('id');
		var calId = $(this).attr('alt');
		
		//Generate the selected date objects
		var day = $(this).parent('span').attr('alt');
		var month = $('#listMonth').attr('alt');
		var year = $('#listYear').val();
		var dateFrom = new Date(year,month,day,0);
		var dateTo = new Date(year,month,day,23,59,59);
		
		//Empty out any current events
		$('#event_list').html('');
		
		//Make the call to get the required calendar IDs and then onto the events
		getCalIds('viewAll',(dateFrom).toISOString(),(dateTo).toISOString());
		
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
			if (typeof(date)==='undefined'){
				date = response.start.date + 'T00:00:00+0930';
			}
			var cleanDateObj = new Date(date);
			
			var cleanDate = fixNth((cleanDateObj.getDate())) + ' of ' + niceDay((cleanDateObj.getMonth()+1)) + ' ' + cleanDateObj.getFullYear();
					
			var locationString = response.location;
			if (typeof(locationString)==='undefined'){
				locationString = '';
			}
			var desc = response.description;
			if (typeof(desc)==='undefined'){
				desc = '';
			}
			
			var eventHtml = '<div class="event_title" contenteditable="true">'+title+'</div><div class="event_date">'+cleanDate + ' ' + locationString + '</div><div class="event_text" contenteditable="true">'+desc+'</div><div class="tags"><div><img class="tagTrash" alt="Tag trash" src="img/trash.png"/></div><span class="tag" contenteditable="true">tag</span></div>';
			$('#right_col').html(eventHtml);
			$('#event'+eventId).addClass('selected');
		});
		
	});
	//Updates the event title on change
	$(document).on('keyup',".event_title",function(){
		
		var textAdd;
		var rawInput = $(this).html();
		if ($(this).html().length < 16){
			textAdd = $(this).html();
		}
		else{
			textAdd = $(this).html().substr(0,15) + '..';
		}
		var id = $('.selected').attr('id').substr(5);
		$('#event'+id+' p:first-of-type').html(textAdd);
		//Load the stored title
		$.ajax({
			method: "POST",
			url: "descUpdate",
			data: {'id' : id , 'value' : rawInput,type:'title'}
		}).done(function( response ) {
			console.log(response);
		});
	});
	//Updates the event text on change
	$(document).on('keyup',".event_text",function(){
		
		var textAdd;
		var rawInput = $(this).html();
		if ($(this).text().length < 42){
			textAdd = $(this).text();
		}
		else{
			textAdd = $(this).text().substr(0,39) + '...';
		}
		var id = $('.selected').attr('id').substr(5);
		$('#event'+id+' p:nth-of-type(3)').html(textAdd);
		//Update the stored description
		$.ajax({
			method: "POST",
			url: "descUpdate",
			data: {'id' : id , 'value' : rawInput , 'type' :'desc'}
		}).done(function( response ) {
			console.log(response);
		});
	});
	//Navigate months
	$(document).on('click','#leftMonth,#rightMonth',function(){
		
		$('#leftMonth,#rightMonth').stop(true, true);
		var currMonth = $(this).attr('alt');
		//Re-write for the new month
		if (Number(currMonth) === 0 && $(this).attr('id') === 'rightMonth'){
			var nextYear = Number($('#listYear').val()) + 1;
			$('#listYear').val(nextYear);
		}
		else if (Number(currMonth) === 0 && $(this).attr('id') === 'leftMonth'){
			var nextYear = Number($('#listYear').val()) - 1;
			$('#listYear').val(nextYear);
		}
		writeMonth(currMonth,$('#listYear').val());
	});
});
