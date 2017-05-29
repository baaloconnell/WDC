function processSelectCal(){
	"use strict";
	$.ajax({
		method: "GET",
		url: "calIdList"
	}).done(function( response ) {
		console.log(JSON.stringify(response,null,4));
		var htmlVar = 'Select the calendars you wish to display: <ul>';
		var id;
		var calName;
		var calDesc;
		var sel;
		var i;
		var checked;
		for (i=0;i<response.length;i+=1){
			id = response[i].id;
			calName = response[i].name;
			checked = '';
			sel = response[i].selected;
			if (sel === 1){
				checked = 'checked';
			}
			htmlVar += '<label><li><input type="checkbox" '+checked+' name="calSelect" value="'+id+'" alt="'+calName+'"> '+calName;
			calDesc = '';
			if (response[i].desc){
				calDesc = response[i].desc;
				htmlVar += ' - ' + calDesc;
			}
			htmlVar += '</li></label>';
		}
		htmlVar += '</ul><input id="subCalId" type="button" value="submit" /><span class="trigger"></span><svg version="1.1" id="tick" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 37 37" style="enable-background:new 0 0 37 37;" xml:space="preserve"><path class="circ path" style="fill:none;stroke:green;stroke-width:3;stroke-linejoin:round;stroke-miterlimit:10;" d="M30.5,6.5L30.5,6.5c6.6,6.6,6.6,17.4,0,24l0,0c-6.6,6.6-17.4,6.6-24,0l0,0c-6.6-6.6-6.6-17.4,0-24l0,0C13.1-0.2,23.9-0.2,30.5,6.5z"/><polyline class="tick path" style="fill:none;stroke:green;stroke-width:3;stroke-linejoin:round;stroke-miterlimit:10;" points="11.6,20 15.9,24.2 26.4,13.8 "/></svg>';
		$('#right_col').html(htmlVar);
	});
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
		else{
			processSelectCal();
		}
	});
}
$(document).ready(function(){
	"use strict";
	checkSignInState();
	//Get the available calendar IDs and their names
	$('.leftMenu li').click(function(){
		$('.leftMenu li').css('color','black');
		$(this).css('color','red');
	});
	$('#selCal').click(function(){
		$('#right_col').html('<img src="img/loading.gif" />');
		processSelectCal();
	});
	
	$(document).on('click','#subCalId',function(){
		$("#tick").hide();
		$('.trigger').removeClass("drawn");
		var calId={};
		$('[name="calSelect"]').each(function(){
			if ($(this).is(':checked')){
				calId[$(this).val()]=$(this).attr('alt');
			}
		});
		//console.log(JSON.stringify(calId,null,4));
		$.ajax({
			method: "POST",
			url: "calIdSet",
			data: calId
		}).done(function( response ) {
			$("#tick").show();
			console.log('done');	
			$(".trigger").addClass("drawn");
		});
	});
	
	
	$('#selDel').click(function(){
		$('#right_col').html('<h1 style="color: red;">WARNING, THIS CANNOT BE UNDONE.</h1> <input type="button" id="deleteAccount" value="DELETE ACCOUNT" />');
	});
	
	
	$(document).on('click','#deleteAccount',function(){
		if (confirm('Are you 100% sure you want to delete all account data?')){
			$.ajax({
				method: "POST",
				url: "delAcc"
			}).done(function( response ) {
				window.location.assign('http://localhost:55666/');
			});
		}
	});
	
});