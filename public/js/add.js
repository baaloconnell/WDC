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
var timeHour = dateObj.getHours();
if (timeHour < 10){
	timeHour = '0' + timeHour;
}
var timeMinute = dateObj.getMinutes();
if (timeMinute < 10){
	timeMinute = '0' + timeMinute;
}
var date = dayDate + '/' + globMonth + '/' + dateObj.getFullYear() + ' ' + timeHour + ':' + timeMinute;

//var date = dayDate + '/' + globMonth + '/' + dateObj.getFullYear();
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
	});
}
$(document).ready(function(){
	//Check if the user is signed in
	checkSignInState();
	$('#datepicker').datetimepicker({
		controlType: 'select',
		oneLine: true,
		inline: true,
		dateFormat: "dd/mm/yy",
		timeFormat: 'HH:mm',
		hour : timeHour,
		minute: timeMinute
	});
	$( "#datepicker" ).val(date);
	$('#datepickericon').click(function(){
		$('#datepicker').focus();
	});
	$('#submit').click(function(){
		var title =  $('.event_title').text();
		var dateSub = $('#datepicker').val();
		var loc = $('#location').val();
		var desc = $('.event_text').text();
		if (title === "Enter Title" || !dateSub || !loc || !desc){
			alert("Please make sure all fields are filled out!");
			return false;
		}
		var tagId;
		var tagContent;
		var tagArr = [];
		$('.tag').each(function(){
			tagId = $(this).attr('id');
			if (!tagId){
				tagId = 'new';
			}
			tagContent = $(this).text();
			if (tagContent){
				tagArr.push({'id': tagId , 'content' : tagContent});
			}
		});
		//checkInput(data);
		$.ajax({
			method: "POST",
			url: "addEvent",
			data: {'title':title,'date':dateSub,'loc':loc,'desc':desc,'tagArr':tagArr}
		}).done(function( response ) {
			if (response){
				window.location.assign('http://localhost:55666/events.html?eid='+response.newId);
			}
		});
	});
});