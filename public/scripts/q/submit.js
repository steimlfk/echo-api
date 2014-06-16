/**
 * Demo App: Questions Add-Answer-Script
 */


function isInt(value) {
	return !isNaN(value) && parseInt(value) == value;
}

$(document).ready(function(){

	$(document).on('click', "input.btn-add", function() {

		$("input.btn-add").hide();
		var row = document.getElementById('add-question').insertRow(-1);
		row.insertCell(0);
		var cell1 = row.insertCell(1);
		
		var element0 = document.createElement("label");
		element0.className = 'control-label';
		element0.for = ctr;
		element0.innerHTML = "Answer " + ++ctr; ;
		row.cells[0].appendChild(element0);
		
		var element1 = document.createElement("input");
		element1.type = "text";
		element1.className = "question-text";
		element1.id = 'answertext['+ctr+']';
		element1.name = 'answertext['+ctr+']';
		cell1.appendChild(element1);
		var cell2 = row.insertCell(2);
		var element2 = document.createElement("input");
		element2.type = "text";
		element2.id = 'answervalue['+ctr+']';
		element2.name = 'answervalue['+ctr+']';
		element2.className = "question-value";
		cell2.appendChild(element2);
		var cell3 = row.insertCell(3);
		var element3 = document.createElement("input");
		element3.type = "button";
		element3.value  = "Add";
		element3.className = "btn btn-success btn-add";
		cell3.appendChild(element3);
	});


}

);
var ctr = 2;