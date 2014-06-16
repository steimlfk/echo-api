/**
 * Demoapp: Patient new/edit script
 */

function verify(){
	var pwd = document.getElementById('password');
	var pwd2 = document.getElementById('verification');
	if (pwd.value != pwd2.value) {
		alert ('Passwords dont match!');
		return false;
	}
	return true;
}

$(document).ready(function() {
	var fieldset = document.getElementById('account');
	if (fieldset != null){
		document.getElementById('Editform').onsubmit = function(){return verify()};
	};
});



