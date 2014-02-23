var fs = require('fs'),
	_timer;

module.exports = {
	"GET /" : function ( req, res ) {
		var file = '/index.html';
		fs.readFile( __dirname + '/..' + file, function ( err, data ) {
			if( err ) {
				res.statusCode = 500;
				return res.end( err.message )
			}
			res.end( data );
		})
	},
	"GET /users.json" : function ( req, res ) {
		req.home.getUsers( function( err, users ){
			if( err ) {
				res.statusCode = 500;
				return res.end( err.message )
			}
			res.end( JSON.stringify( users ) );
		})
	},
	"GET /users/{id}.json" : function ( req, res ) {
		var params = req.params;
		req.home.getUser( params.id, function( err, user ){
			if( err ) {
				res.statusCode = 500;
				return res.end( err.message )
			}
			res.end( JSON.stringify(user) );
		})
	},
	"PUT /users/{id}.json" : function ( req, res ) {
		var params = req.params,
			payload = req.body;

		req.home.updateUser( params.id, payload, function( err, user ){
			if( err ) {
				res.statusCode = 500;
				return res.end( err.message )
			}
			res.end( JSON.stringify( user ) );
		})
	},
	"POST /users/{id}.json" : function ( req, res ) {
		var params = req.params,
			payload = req.body,
			user;

		req.home.getUsers( { empty : true }, function ( err, users ) {
			if( err ) {
				res.statusCode = 500;
				return res.end( err.message )
			}
			if ( !user.length ) {
				res.status = 507;
				return res.end("no available slots to write user");
			}
			user = users[0];
			// generate key
			// check unique
			payload.key = '1234';
			req.home.updateUser( user.id, payload, function ( err, user ) {
				if( err ) {
					res.statusCode = 500;
					return res.end( err.message )
				}
				res.end( JSON.stringify( user ));
			});
		});

	},
	"POST /signals.json" : function ( req, res ) {
		var payload = req.body || {},
			good = true,
			returned;

		function createUser ( key ) {
			req.home.createUser( key , function ( err, user ) {
				if ( err ) return res.end( '{"error":"Failed to create user"}' );
				res.end( JSON.stringify( user ) );
			})
		}


		if ( payload.mode === 'create' ) {
			req.home.serial.once( 'user:denied', function ( key ) {
				if ( !good ) return;
				returned = true;
				process.nextTick(function(){
					createUser( key );
				});
			})
			return setTimeout( function(){
				good = false;
				if ( returned ) return;
				res.end( '{"error":"Timeout"}' )
			}, 10000 )
		}

		if ( payload.mode === 'open' ) {
			// unlock door
			res.end( '{"error":"Not yet implemented"}' );
		}

		res.end( '{"error":"No action specified"}' );
	}
};
