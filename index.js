require('dotenv').load();

var connect = require('connect'),
	http = require('http'),
	api = process.env.API || 'http://localhost:3000/',
	router = require('./libs/router')
		( require('./libs/routes') ),
	Serial = require('./libs/serial'),
	port = process.env.PORT || 3000,
	io = require('./libs/sdk')( process.env.API ),
	serial = new Serial( process.env.SERIALPORT, 
		{
			auth : process.env.SERIALAUTH
		}
	),
	home = require('./libs/home')
		( process.env.DBDIR, serial, io );
	app = connect( );

// seperate app out to a sperate file ./libs/server
// this will allow us to use clusters to make sure the
// app does not go down.. it should only support one child

app.use(function( req, res, next ){
	req.serial = serial;
	req.io = io;
	next( );
});
app.use(router);

serial.on('user:granted', function ( user ) {
	console.log( user, 'granted access ');
	delete user.key;
	user.ts = +new Date;
	// send a checkin
	io.users.checkin(user, function(){})
});
var emptyUsers = {},
	emptyCount = 0;
serial.on('auth', function( isGood ) {
	if ( !isGood ) return;	
	serial.getUsers(function( err, users ){
		if ( err ) return;
		for ( var key in users ) {
			var user = users[ key ];
			if ( user.permission === '255' ) {
				emptyCount += 1;
				emptyUsers[ key ] = user;
			}
		} 
	});
});

// this is a quick way to associate muliple tags in a row
// function associateKey ( key, user ) {
// 	console.log("Associating user id " + user.id + " with " + key );
// 	console.log(" in 10 sec, end node proccess to stop");
// 	setTimeout(function(){
// 		user.permission = '5';
// 		user.key = key;
// 		serial.updateUser( user, function( err, res ) {
// 			if ( err ) return console.log( err );
// 			console.log( "user updated ", res )
// 			delete emptyUsers[ user.id ];
// 		});
// 	}, 10000 );
// }


serial.on('user:denied', function ( token ) {
	console.log( token, 'denied' );
	// for ( var key in emptyUsers ) {
	// 	var user = emptyUsers[ key ];
	// 	return associateKey( token, user );
	// }
});

/*io.users.all(function( err, res ){
	console.log( arguments );
})*/


http.createServer( app )
	.listen( port );
console.log("server listening on " + port );


