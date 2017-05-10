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




function fixNth(d) {
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
	$('#right_col').html('<img src="img/loading.gif" />');
	$.ajax({
		method: "GET",
		url: "drawSpecEvent",
		data: {'eventId' : id , 'calId' : calId}
	}).done(function( response ) {
		console.log("event: " +JSON.stringify(response,null,4));
		var title = response.summary;
		date = response.start.dateTime;
		if (typeof(date) === 'undefined'){
			date = response.start.date + 'T00:00:00+0930';
		}
		var cleanDateObj = new Date(date);
		
		var cleanDate = fixNth(cleanDateObj.getDate()) + ' of ' + niceDay(cleanDateObj.getMonth()+1) + ' ' + cleanDateObj.getFullYear();
				
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
	});
}
function custom_sort(b, a) {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
}
function drawEventList(e){	
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
function reqEventObj(calIdArr,dateFrom,dateTo){
	//Load the calendar events given a calendar id array
	$.ajax({
		method: "GET",
		url: "eventList",
		data: {'calId' : calIdArr,'dateTo':dateTo,'dateFrom':dateFrom,'type':'event'}
	}).done(function( response ) {
		drawEventList(response);
	});
}
function getCalIds(dateFrom,dateTo){
	$('#right_col,#event_list').html('');
	$.ajax({
		method: "GET",
		url: "calIdList"
	}).done(function( response ) {
		//response now holds a JSON object of all the calendar IDs
		reqEventObj(response,dateFrom,dateTo);
	});
}
function loadNewEvents(d){
	//day
	var day = d.substr(0,2);
	var month = d.substr(3,2)-1;
	var year = d.substr(6,4);
	
	var dateEnd = new Date(year,month,day,23,59,59,0);
	var dateStart = new Date(dateEnd.toISOString());
	dateStart.setDate(dateStart.getDate()-7);
	
	getCalIds(dateStart.toISOString(),dateEnd.toISOString(),1000);
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
			loadNewEvents(date);
		}
	});
}
function removeEmptyTags(){
	$('.tag').each(function(){
		
		if ($(this).html()==='' && !$(this).is(':last-child')){
			$(this).remove();
		}
		
	});
}



	

	
$(document).ready(function(){
	//Check if the user is signed in
	checkSignInState();
	$( "#datepicker" ).datepicker({
		inline: true,
		dateFormat: "dd/mm/yy",
		onSelect: function (dateVal) {
			loadNewEvents(dateVal);
		}
	});
	$( "#datepicker" ).val(date);
	$('#datepickericon').click(function(){
		$('#datepicker').focus();
	});
	//This drags the tags around on mouse hold
	
	var elem;
	$(document).on("mousedown",'.tag' , function(ev){
		
		elem = $(this);
		
		//First the mousemove in here to limit load
		$('body').mousemove(function(e){
			
			//Check if the mouse button is held, otherwise it gets stuck
			if (e.which===1){
				
				$(elem).css({
					'position':'absolute',
					'left':(e.pageX-210)+'px',
					'top':(e.pageY-70)+'px'
				});
				
				//make the trash large if hovering over it
				var pos = $('.tagTrash').offset();				
				var x = e.clientX, y = e.clientY;
				
				var tWidth = $('.tagTrash').width();
				var tHeight = $('.tagTrash').height();
			
				if ( (x > pos.left && x <= (pos.left + tWidth) ) && (y > pos.top && y <= (pos.top+tHeight) ) ){
					$('.tagTrash').css({
						'height':'25px',
						'position': 'relative',
						'left': '-2px',
						'top': '-2px'
					});
				}
				else{
					$('.tagTrash').css({
						'height':'',
						'position': '',
						'left': '-',
						'top': '-'
					});
				}
			}
			
		});
	}).mouseup(function(evt){
		//Reset the position on mouse up
		$(elem).css({
			'position':'relative',
			'left':'',
			'top':''
		});	
		$('.tagTrash').css('height','');
		
		//Remove the tag if the mouse up event occurred over the trash
		var x = evt.clientX, y = evt.clientY;
		
		var mouseSel = document.elementFromPoint(x, y);
		if (mouseSel.className === 'tagTrash'){
			$(elem).fadeOut().remove();
					
		}
		elem = '';
		removeEmptyTags();
	});
	
	//Reset the tag elements if the mouse leaves the document
	$('body').mouseleave(function(){
		if (elem !== ''){
			$(elem).css({
				'position':'relative',
				'left':'',
				'top':''
			});	
			$('.tagTrash').css('height','');
		}
	});
	//Stops line breaks on event Title edit
	$(document).on('keypress',".event_title",function(e){
		$(this).attr('title',$(this).html());
		
		return e.which !== 13;
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
	
	//Stops line breaks on tag edit, removes spaces, adds new tag when enter is pressed
	$(document).on('keypress',".tag",function(e){
		var tagHtml;
		var whitePatt;
		var newHtml;
		switch (e.which){
			case 13:
			//Add new tag if enter is pressed
				tagHtml = '<span class="tag" contenteditable="true"></span>';
				
				//Check for empty tag
				whitePatt = new RegExp(/\s/);
				if (!whitePatt.test($(this).html()) && $(this).html() !== ''){
					//Remove whitespace
					newHtml = $(this).html().replace(/&nbsp/g, '');
					newHtml = newHtml.replace(/\s/g, '');
					$(this).html(newHtml);
				}
				if ($(this).html() !== ''){
					$(this).after(tagHtml).next('span').focus();
				}
				return false;
			case 32:
			//Ignore spaces
				return false;
			/* //check for pre-existing tags from the DB here
			default:
				break; */
				
		}
		removeEmptyTags();
	}); 
	
	
	//This adds a new tag when the tags section is clicked
	$(document).on('click','.tags',function(evt){
		var tagHtml = '<span class="tag" contenteditable="true"></span>';
		
		var x = evt.clientX, y = evt.clientY,
		mouseSel = document.elementFromPoint(x, y);
		console.log(mouseSel);
		
		//Only add if the correct area was clicked and there are no empty tags at the end
		if (mouseSel.className === 'tags' && $(this).children('span:last-of-type').html() !== ''){
			
			$(this).append(tagHtml).children('span:last-of-type').focus();
		}
		removeEmptyTags();
	});
	
	
});
