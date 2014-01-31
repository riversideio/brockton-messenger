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
		req.home.getUsers( function( err, users ){
			if( err ) return res.end( err.message );
			res.end( JSON.stringify( users ) );
		})
	},
	"GET /users/{id}.json" : function ( req, res ) {
		var params = req.params;
		req.home.getUser( params.id, function( err, user ){
			if( err ) return res.end( err.message );
			res.end( JSON.stringify(user) );
		})
	},
	"PUT /users/{id}.json" : function ( req, res ) {
		var params = req.params,
			payload = req.payload;

		console.log( payload );

		req.home.updateUser( params.id, payload, function( err, user ){
			if( err ) return res.end( err.message );
			res.end( JSON.stringify( user ) );
		})
	}
	// have a post that creates a user
	// behind the scenes it finds a open slot
	// then apply the user to the open slot
};