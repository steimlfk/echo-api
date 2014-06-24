/**
 * Demoapp: Patients Index Init-Script
 */
$(document).ready(function() {
	var queryDict = {};
	location.search.substr(1).split("&").forEach(function(item) {queryDict[item.split("=")[0]] = item.split("=")[1]});

	var base = window.location.href;
	base = base.split("?")[0];
	document.getElementById('id_sort').href 		= base+'?sortBy=patientId';
	document.getElementById('name_sort').href 		= base+'?sortBy=firstName';
	document.getElementById('surname_sort').href 	= base+'?sortBy=lastName';
	document.getElementById('birthday_sort').href	= base+'?sortBy=dateOfBirth';
	if (queryDict['sortBy']){
		if (queryDict['sortBy']=='patientId' && queryDict['order']!='desc')  document.getElementById('id_sort').href += "&order=desc";
		if (queryDict['sortBy']=='firstName'&& queryDict['order']!='desc') document.getElementById('name_sort').href += "&order=desc";
		if (queryDict['sortBy']=='lastName'&& queryDict['order']!='desc')  document.getElementById('surname_sort').href += "&order=desc";
		if (queryDict['sortBy']=='dateOfBirth'&& queryDict['order']!='desc')  document.getElementById('birthday_sort').href += "&order=desc";
	}
	if (queryDict['page']){
		var page = '&page='+queryDict['page'];
		document.getElementById('id_sort').href += page;
		document.getElementById('name_sort').href += page;
		document.getElementById('surname_sort').href += page;
		document.getElementById('birthday_sort').href += page;
		if (queryDict['pageSize']){
			var pageSize = '&pageSize='+queryDict['pageSize'];
			document.getElementById('id_sort').href += pageSize;
			document.getElementById('name_sort').href += pageSize;
			document.getElementById('surname_sort').href += pageSize;
			document.getElementById('birthday_sort').href += pageSize;
		}
	}


	
	if (!queryDict['page']){
		document.getElementById('nav').style.display = 'none';
	}
	else {
		var next_page = parseInt(queryDict['page'])+1;
		var back_page = parseInt(queryDict['page'])-1;
		document.getElementById('btn-next').href = base + '?page='+next_page;
		document.getElementById('btn-back').href = base + '?page='+back_page;
		var pgSize = (queryDict['pageSize'] || 20);
		if (document.getElementById("tab-patient").rows.length < pgSize){
			document.getElementById('btn-next').style.display = 'none';
		}
		
		if (queryDict['page'] == '1'){
			document.getElementById('btn-back').style.display = 'none';
		}
		if (queryDict['sortBy']){
			document.getElementById('btn-next').href += '&sortBy='+ queryDict['sortBy'];
			document.getElementById('btn-back').href += '&sortBy='+ queryDict['sortBy'];
			if (queryDict['order']){
				document.getElementById('btn-next').href += '&order='+ queryDict['order'];
				document.getElementById('btn-back').href += '&order='+ queryDict['order'];
			}
		}
		if (queryDict['pageSize']){
			document.getElementById('btn-next').href += '&pageSize='+queryDict['pageSize'];
			document.getElementById('btn-back').href += '&pageSize='+queryDict['pageSize'];
		}
	} 
	
});

