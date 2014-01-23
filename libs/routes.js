var fs = require('fs');
module.exports = {
	"GET /" : function ( req, res ) {
		var file = '/index.html';
		fs.readFile( __dirname + '/..' + file, function ( err, data ) {
			if( err ) return res.end( err.message )
			res.end( data );
		})
	},
	"GET /users.json" : function ( req, res ) {
		res.end( JSON.stringify({}) );
	}
};