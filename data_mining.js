var db = require('./utils.js').db;
var C45 = require('c4.5');

db.getConnection(function(err, con){
	if (err) { return done(null, false); }
	
	// This query fetches all account information about accounts
	// which are available and have set a reminder time within the time slot range of 30 minutes
	var qry = 'SELECT * FROM data_extraction_view';
	
	// Query database and notify flow engine with result
	con.query(qry, function(err, result) {
		if (err) { return done(null, false); }
		if(result.length > 0) {
			
			var headers = result[0];
			var features = ['']; // ["attr1", "attr2", "attr3"] 
			var featureTypes = ['category','number','cateogry'];
			var trainingData = result.slice(1).map(function(d) {
			      return d.slice(1);
			});
			
			var target = 'daysExacerbation'; // "class" 
			var c45 = C45();
			
			c45.train({
			        data: trainingData,
			        target: target,
			        features: features,
			        featureTypes: featureTypes
			    }, function(error, model) {
			      if (error) {
			        console.error(error);
			        return false;
			      }
 
			      var testData = [
			        ['B',71,'False'],
			        ['C',70,'True'],
			      ];
 
			      console.assert(model.classify(testData[0]) ===  'CLASS1');
			      console.assert(model.classify(testData[1]) ===  'CLASS2');
			 });
			
		}
	});
	
	con.release();
});