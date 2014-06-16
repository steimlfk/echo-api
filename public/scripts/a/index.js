/**
 * Demoapp: Accounts Index Init-Script
 */

$(document).ready(function() {
	var queryDict = {};
	location.search.substr(1).split("&").forEach(function(item) {queryDict[item.split("=")[0]] = item.split("=")[1]});

	var base = window.location.href;
	base = base.split("?")[0];
	document.getElementById('id_sort').href 		= base+'?sortBy=accountId';
	document.getElementById('name_sort').href 		= base+'?sortBy=username';
	document.getElementById('mail_sort').href 		= base+'?sortBy=email';
	document.getElementById('role_sort').href		= base+'?sortBy=role';
	if (queryDict['sortBy']){
		if (queryDict['sortBy']=='accountId' && queryDict['order']!='desc')  document.getElementById('id_sort').href += "&order=desc";
		if (queryDict['sortBy']=='username'&& queryDict['order']!='desc') document.getElementById('name_sort').href += "&order=desc";
		if (queryDict['sortBy']=='email'&& queryDict['order']!='desc')  document.getElementById('mail_sort').href += "&order=desc";
		if (queryDict['sortBy']=='role'&& queryDict['order']!='desc')  document.getElementById('role_sort').href += "&order=desc";
	}
	if (queryDict['page']){
		var page = '&page='+queryDict['page'];
		document.getElementById('id_sort').href += page;
		document.getElementById('name_sort').href += page;
		document.getElementById('mail_sort').href += page;
		document.getElementById('role_sort').href += page;
		if (queryDict['pageSize']){
			var pageSize = '&pageSize='+queryDict['pageSize'];
			document.getElementById('id_sort').href += pageSize;
			document.getElementById('name_sort').href += pageSize;
			document.getElementById('mail_sort').href += pageSize;
			document.getElementById('role_sort').href += pageSize;
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
		if (document.getElementById("tab-account").rows.length < pgSize){
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

