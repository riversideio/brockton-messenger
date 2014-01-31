require('dotenv').load();

var connect = require('connect'),
	http = require('http'),
	api = process.env.API || 'http://localhost:3000/',
	router = require('./libs/router')
		( require('./libs/routes') ),
	Serial = require('./libs/serial'),
	qs = require('querystring'),
	port = process.env.PORT || 3000,
	createKeys = process.argv[2] === 'create',
	io = require('./libs/sdk')( process.env.API ),
	serial = new Serial( process.env.SERIALPORT, 
		{
			auth : process.env.SERIALAUTH
		}
	),
	home =  new ( require('./libs/home'))
		( process.env.DBDIR, serial, io );
	app = connect( );

app.use(function( req, res, next ){
	req.payload = {};
	// simple data parser
	req.on('data', function(chunk){
		req.payload= qs.parse(chunk);
	}).on('end', next )
	req.home = home;
});
app.use(router);

serial.on('user:granted', function ( user ) {
	console.log( user, 'granted access ');
	delete user.key;
	var opts = {
		rfid : user.id
	}
	// send a checkin
	io.users.checkin( opts, function( err, res ){
		console.log( res.status );
	})
});
var emptyUsers = {},
	emptyCount = 0;

serial.on('auth', function( isGood ) {
	if ( !isGood ) return;	
	home.syncUsers( );
});

// this is a quick way to associate muliple tags in a row
function associateKey ( key, user ) {
	console.log("Associating user id " + user.id + " with " + key );
	console.log(" in 10 sec, end node proccess to stop");
	setTimeout(function(){
		user.permission = '5';
		user.key = key;
		serial.updateUser( user, function( err, res ) {
			if ( err ) return console.log( err );
			delete emptyUsers[ user.id ];
		});
	}, 10000 );
}


serial.on('user:denied', function ( token ) {
	console.log( token, 'denied' );
	if ( createKeys ) {
		for ( var key in emptyUsers ) {
			var user = emptyUsers[ key ];
			return associateKey( token, user );
		}
	}
});

// home.updateUser( '9', { hello : 'world' }, function( err, res) {
// 	console.log( arguments )
// })

/*io.users.all(function( err, res ){
	console.log( arguments );
})*/


http.createServer( app )
	.listen( port );
console.log("server listening on " + port );


