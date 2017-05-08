$(document).ready(function(){
	
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
	
		
	
	//Sets the correct left column height on load and window resize
	changeLeftCol();
	$( window ).resize(function() {
		changeLeftCol();
	});
	
	function changeLeftCol(){
		
		var currentHeight = $('#event_list').height();
		var windowHeight = $( window ).height();
		var desiredHeight = windowHeight - ( 80 + 50 + 40 + 25 + 25);
		$('#event_list').height(desiredHeight);
	}
	
	//Auto removes/adds the search value
	$('#search input').focus(function(){
		
		$(this).css({
			'color': 'black',
			'font-style': 'normal'
		});
		var search = $(this).val();
		
		if (search == 'Search'){
			$(this).val('');
		}
	}).blur(function(){
		var search = $(this).val();
		
		if(search == ''){
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
	};
	
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
				
				var id = $(this).attr('id').substr(5);
				var calId = $(this).attr('alt')
				drawSelectedEvent(id,calId)
				
			}
			
			//Show a loading symbol in the main event page
			
			//Grab the full event data from the DB and draw it
			
			//Update the URL in the address bar for easy linking to pages
		}
	}, ".event:not(.selected)");
	
	/*
	//This section resizes the events on hover and click
	function animateHeight(elemObj,desHeight,time,check){
		$(elemObj).animate({
			height: desHeight
		}, time, function() {
			if ($(elemObj).children("p:nth-child(3)").is(":visible") && check == 1){
				$(elemObj).children("p:nth-child(3)").hide();
			}
			else if (check == 1){
				$(elemObj).children("p:nth-child(3)").show();
			}
		});
	};
	
	//Change the event height on hover and process the click
	$(document).on({
		mouseenter: function () {
			if (!$(this).hasClass('selected')){
				animateHeight($(this),80,50,1);
			}
		},
		mouseleave: function () {
			if (!$(this).hasClass('selected')){
				animateHeight($(this),40,50,1);
			}
		},
		click: function() {
			//This section processes the clicks on the event titles
			$('.event').removeClass('selected');
			$(this).addClass('selected').trigger('eventClick');

			//Place holder for showing the event in the right col on the event page
			if (window.location.pathname.indexOf('events') !== -1){
				
				var id = $(this).attr('id').substr(5,1);
				
				$('#right_col span').hide();
				$('#eventSelect'+id).show();
				
			}
		}
	}, ".event");
	
	//Custom event required to control order of operation
	$('.event').on('eventClick',function(){
		
		//Clear out the prior selected events and any expanded events from rollover
		$('.event:not(.selected)').each(function(){
			$(this).children("p:nth-child(3)").hide();
			animateHeight($(this),40,50,0);
		});
		
		//Show a loading symbol in the main event page
		
		//Grab the full event data from the DB
		
		//Populate the main event page
		
		//Update the URL in the address bar for easy linking to pages
	});*/
});
