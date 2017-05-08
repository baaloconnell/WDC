$(document).ready(function(){
	//Check if the user is signed in
	checkSignInState();
	
	$('#authorize-button').click(function(){
	
		$.ajax({
			method: "GET",
			url: "redirecturl"
		}).done(function( msg ) {
			console.log( msg );
			window.location.assign(msg);
		});
	
	});

});


function checkSignInState(){
	$.ajax({
		method: "GET",
		url: "signedIn"
	}).done(function( msg ) {
		if (msg){
			window.location.assign('http://localhost:55666/events.html');
		}
	});
}