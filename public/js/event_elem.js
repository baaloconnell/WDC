//This drags the tags around on mouse hold
	
function removeEmptyTags(){
	"use strict";
	$('.tag').each(function(){
		
		if ($(this).html()==='' && !$(this).is(':last-child')){
			$(this).remove();
		}
		
	});
}
function submitTags(element,newHtml,eventId,calId){
	"use strict";
	$.ajax({
		method: "POST",
		url: "tagInsert",
		data: {'value' : newHtml , 'eventId' : eventId}
	}).done(function( response ) {
		var tagId = response.returnId;
		
		element.attr('id',tagId);
		
		var tagArr = [];
		
		$('.tag').each(function(){
			if ($(this).html()){
				tagArr.push($(this).attr('id'));
			}
		});
		console.log(JSON.stringify(tagArr,null,4));
		var tagList = tagArr.toString();
		console.log('Post data ' + tagList +"  "+ eventId +"  "+calId);
		$.ajax({
			method: "POST",
			url: "descUpdate",
			data: {'value' : tagList , 'id' : eventId,'calId' : calId,'type':'Tag'}
		}).done(function( response ) {
			console.log(response);
		});
	});
}
function custom_sort_search(a, b) {
	"use strict";
    return new Date(a.date).getTime() - new Date(b.date).getTime();
}
function drawEventListSearch(e){	
	"use strict";
	console.log("BEFORE SORT"+JSON.stringify(e,null,4));
	//Sort by the date of the given events
	e.sort(custom_sort_search);
	console.log("AFTER SORT"+JSON.stringify(e,null,4));
	var html;
	//Fill out the HTML using the sorted array
	e.forEach(function(eventVal,c){
		html = eventVal.htmlString;
		$('#event_list').append(html);
	});
	
	var eventId = $('.event_title').attr('id');
	$('#event'+eventId).addClass('selected');
	
}
function checkTag(el,pT){
	"use strict";
	$.ajax({
		method: "GET",
		url: "tagCheck",
		data: {'ss' : pT}
	}).done(function( response ) {
		if (response && response.length > 0){
			//Draw the dropdown box
			el.addClass('tagActiveDrop');
			console.log(JSON.stringify(response,null,4));
			var t = el.offset();
			
			$('.tagAutoComplete').css({
				'left':t.left,
				'top':(t.top+21)
			});
			$('.tagAutoComplete ul').html('');
			var li = '';
			var id;
			var tag;
			var tagClass;
			
			//e.forEach(function(eventVal,c){
			response.forEach(function(tagContent,key){
				id = tagContent.idtags;
				tag = tagContent.content;
				tagClass = '';
				
				if (key === 0){
					tagClass = 'class=activeAC';
				}
				
				if (pT !== tag && key === 0){
					li += '<li>'+pT+'</li>';
				}
				
				li += '<li id="'+id+'" '+tagClass+'>'+tag+'</li>';
			});
			$('.tagAutoComplete ul').html(li);
			$('.tagAutoComplete').show();
			el.width(($('.tagAutoComplete').width()-20));
		}
		else{
			el.removeClass('tagActiveDrop');
			$('.tagAutoComplete').hide();
			$('.tagAutoComplete ul').html('');
			el.width('auto');
		}
	});
}

function addTag(element){
	"use strict";
	//Set the Element to the selected tag
	if ($('.tagAutoComplete .activeAC').html()){
		element.attr('id',$('.tagAutoComplete .activeAC').attr('id'));
		element.html($('.tagAutoComplete .activeAC').html());
	}
	
	var newHtml = element.html();
	$('.tagAutoComplete').hide();
	$('.tagAutoComplete ul').html('');
	$('.tag').removeClass('tagActiveDrop');
	var tagHtml;
	var whitePatt;
	tagHtml = '<span class="tag" contenteditable="true"></span>';
	
	//Check for empty tag
	whitePatt = new RegExp(/\s/);
	if (whitePatt.test(element.html()) && element.html() !== ''){
		
		//Remove whitespace
		newHtml = element.html().replace(/&nbsp/g, '');
		newHtml = newHtml.replace(/\s/g, '');
		
		element.html(newHtml);
	}
	//If this is the EVENT or CALENDAR page add tag to DB
	if ((window.location.pathname.indexOf('events') !== -1 || window.location.pathname.indexOf('calendar') !== -1) && newHtml !== ''){
		var eventId = $('.selected').attr('id').substr(5);
		var calId = $('.selected').attr('alt');
		submitTags(element,newHtml,eventId,calId);
	}
	if (element.html() !== ''){
		element.after(tagHtml).next('span').focus();
	}
}
$(document).ready(function(){
	"use strict";
	$('.tagAutoComplete').hide();
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
				if (pos){
					var x = e.clientX;
					var	y = e.clientY;
					
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
		var x = evt.clientX;
		var y = evt.clientY;
		
		var mouseSel = document.elementFromPoint(x, y);
		if (mouseSel.className === 'tagTrash'){
			$(elem).remove();
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
	
	//Stops line breaks on tag edit, removes spaces, adds new tag when enter is pressed
	$(document).on('keypress',".tag",function(e){
		var element = $(this);
		var partialTag;
		var act;
		switch (e.which){
			case 13:
				//Add new tag if enter is pressed
				addTag(element);
				//Suppress the line break
				e.preventDefault();
				break;
			case 32:
				//Ignore spaces
				return false;
			case 0:
				//Process the arrow keys, ensure you cant move past the first and last li
				if (e.key === "ArrowDown" && !$('.tagAutoComplete li').last().hasClass('activeAC')){
					act = $('.tagAutoComplete .activeAC');
					act.removeClass('activeAC');
					act.next('.tagAutoComplete li').addClass('activeAC');
				}
				else if (e.key === "ArrowUp"&& !$('.tagAutoComplete li').first().hasClass('activeAC')){
					act = $('.tagAutoComplete .activeAC');
					act.removeClass('activeAC');
					act.prev('.tagAutoComplete li').addClass('activeAC');
				}
				else if (e.key === "ArrowDown" || e.key === "ArrowUp"){
					//Suppress the cursor moving
					e.preventDefault();
				}
				break;
			//check for pre-existing tags from the DB here, have to assign to backspace or it wont fire for whatever reason
			case 8:
				partialTag = element.html();
				//Stop the browser from going back
				if (partialTag === ''){
					$('.tagAutoComplete').hide();
					$('.tagAutoComplete ul').html('');
					$('.tag').removeClass('tagActiveDrop');
					element.prev('.tag').focus();
					element.remove();
					e.preventDefault();
				}
				else if (partialTag.slice(0,-1) !== ''){
					checkTag(element,partialTag.slice(0,-1));
				}
				break;
			default:
				partialTag = element.html() + e.key;
				checkTag(element,partialTag);
		}
		removeEmptyTags();
	}); 
	$(document).on({
		mouseenter: function () {
			$('.activeAC').removeClass('activeAC');
			$(this).addClass('activeAC');
		},
		mouseleave: function () {
			$(this).removeClass('activeAC');
		}
	}, ".tagAutoComplete li");
	
	
	$(document).on('click','.tagAutoComplete li',function(){
		var element = $('.tagActiveDrop');
		$(this).addClass('activeAC');
		addTag(element);
	});
	//This adds a new tag when the tags section is clicked
	$(document).on('click','.tags',function(evt){
		var tagHtml = '<span class="tag" contenteditable="true"></span>';
		
		var x = evt.clientX;
		var y = evt.clientY;
		
		var mouseSel = document.elementFromPoint(x, y);
		console.log(mouseSel);
		
		//Only add if the correct area was clicked and there are no empty tags at the end
		if ((mouseSel.className === 'tags' && $(this).children('span:last-of-type').html() !== '') || $('.tag').length === 0){
			
			$(this).append(tagHtml).children('span:last-of-type').focus();
		}
		removeEmptyTags();
	});
	//Performs a search
	$(document).on('keyup',".search",function(e){
		
		//If enter is pressed
		var searchVal;
		switch (e.which){
			case 13:
				searchVal = $(this).val();
				//Loading screen
				$('#right_col').html('<img src="img/loading.gif" />');
				$('#event_list').html('');
				//Search for the given string
				$.ajax({
					method: "GET",
					url: "search",
					data: {'value' : searchVal}
				}).done(function( response ) {
					$('#right_col').html('');
					if (response.length === 0){
						$('#event_list').html('No Events Found');
					}
					else{
						drawEventListSearch(response);
					}
					console.log(JSON.stringify(response,null,4));
				});
				break;
		}
	});
	//Stops line breaks on event Title edit
	$(document).on('keypress',".event_title",function(e){
		$(this).attr('title',$(this).html());
		
		return e.which !== 13;
	});
		//Updates the event title on change
	$(document).on('keyup',".event_title",function(){
		
		if (window.location.pathname.indexOf('events') !== -1 || window.location.pathname.indexOf('calendar') !== -1){
			var textAdd;
			var rawInput = $(this).html();
			if ($(this).html().length < 16){
				textAdd = $(this).html();
			}
			else{
				textAdd = $(this).html().substr(0,15) + '..';
			}
			var id = $('.selected').attr('id').substr(5);
			var calId = $('.selected').attr('alt');
			$('#event'+id+' p:first-of-type').html(textAdd);
			//Load the stored title
			$.ajax({
				method: "POST",
				url: "descUpdate",
				data: {'id' : id , 'calId':calId, 'value' : rawInput,type:'Title'}
			}).done(function( response ) {
				console.log(response);
			});
		}
	});
	//Updates the event text on change
	$(document).on('keyup',".event_text",function(){
		
		if (window.location.pathname.indexOf('events') !== -1 || window.location.pathname.indexOf('calendar') !== -1){
			
			var textAdd;
			var rawInput = $(this).html();
			if ($(this).text().length < 42){
				textAdd = $(this).text();
			}
			else{
				textAdd = $(this).text().substr(0,39) + '...';
			}
			var id = $('.selected').attr('id').substr(5);
			var calId = $('.selected').attr('alt');
			$('#event'+id+' p:nth-of-type(3)').html(textAdd);
			//Update the stored description
			$.ajax({
				method: "POST",
				url: "descUpdate",
				data: {'id' : id , 'calId':calId,'value' : rawInput , 'type' :'Description'}
			}).done(function( response ) {
				console.log(response);
			});
		}
	});
});