$(document).ready(function(){
	"use strict";
	$.ajax({
		method: "GET",
		url: "name"
	}).done(function( msg ) {
		$('.username').html('Hi, '+msg.name);
	});
	//Sets the correct icon in the menu
	if (window.location.pathname.indexOf('events') !== -1){
		$('#homeIcon').css({
				'background-image':'url(../img/icon/home.png)',
				'cursor' : 'auto'
		});
	}
	else if (window.location.pathname.indexOf('calendar') !== -1){
		$('#calIcon').css({
			'background-image':'url(../img/icon/calendar.png)',
			'cursor' : 'auto' 
		});
	}
	else if (window.location.pathname.indexOf('add') !== -1){
		$('#addIcon').css({
			'background-image':'url(../img/icon/add.png)',
			'cursor' : 'auto' 
		});
	}
	
	//Signs the user out
	$('#signout-button').click(function(){
		$.ajax({
			method: "POST",
			url: "signOut"
		}).done(function( msg ) {
			window.location.assign('http://localhost:55666/');
		});
	});
	function changeLeftCol(){
		
		var windowHeight = $( window ).height();
		var desiredHeight = windowHeight - ( 80 + 50 + 40 + 25 + 25);
		$('#event_list').height(desiredHeight);
	}
	//Sets the correct left column height on load and window resize
	changeLeftCol();
	$( window ).resize(function() {
		changeLeftCol();
	});
	

	
	//Auto removes/adds the search value
	$('#search input').focus(function(){
		
		$(this).css({
			'color': 'black',
			'font-style': 'normal'
		});
		var search = $(this).val();
		
		if (search === 'Search'){
			$(this).val('');
		}
	}).blur(function(){
		var search = $(this).val();
		
		if(search === ''){
			$(this).val('Search');
			$(this).css({
				'color': 'lightgrey',
				'font-style': 'italic'
			});
		}
	});
	
	
	//This section resizes the events on hover and click
	function animateHeight(elemObj,desHeight,time){
		$('.event').stop(true, true);
		$(elemObj).animate({
			height: desHeight
		}, time, function() {
			//not used
		});
	}
	$(document).on({
		mouseenter: function () {
			animateHeight($(this),80,50);
			$(this).children("p:nth-child(3)").stop(false, true).slideDown("fast");
		},
		mouseleave: function () {
			animateHeight($(this),50,50);
			$(this).children("p:nth-child(3)").hide();
		},
		click: function() {
			var id = $(this).attr('id');
			$(this).addClass('selected');
			$('.event:not(#'+id+')').removeClass('selected').height(50).children("p:nth-child(3)").hide();
			
			//Place holder for showing the event in the right col on the event page
			if (window.location.pathname.indexOf('events') !== -1){
				
				id = $(this).attr('id').substr(5);
				var calId = $(this).attr('alt');
				drawSelectedEvent(id,calId);
				
			}
		}
	}, ".event:not(.selected)");

});
