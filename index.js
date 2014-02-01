require('dotenv').load();

var connect = require('connect'),
	http = require('http'),
	api = process.env.API || 'http://localhost:3000/',
	Serial = require('./libs/serial'),
	env = process.env,
	port = env.PORT || 3000,
	createKeys = process.argv[2] === 'create',
	io = require('./libs/sdk')( env.API ),
	app = connect( ),
	router = require('./libs/router')( require('./libs/routes') ),
	serial = new Serial( env.SERIALPORT, {
		auth : env.SERIALAUTH
	}),
	home =  new ( require('./libs/home') )( env.DBDIR, serial, io );


if ( env.NODE_ENV === 'production' ) {
	app.use(function( req, res, next ) {
		var auth = req.headers.authorization;
		if ( auth && auth === env.SECRETAUTH ) {
			return next();
		}
		res.statusCode = 401;
		res.end('Not Authorized');
	});
}

app
	.use(connect.bodyParser())
	.use(connect.query())
	.use(function( req, res, next ){
		req.home = home;
		next();
	})
	.use(router);

serial.on('user:granted', function ( user ) {
	var opts = {
		rfid : user.id
	};
	console.log( user.id + ' access granted' );
	// send a checkin
	io.users.checkin( opts, function( err, res ){
		if ( err ) return;
		console.log( 'sync with api ' + res.status );
	});
});

serial.on('auth', function( isGood ) {
	if ( !isGood ) return;	
	home.syncUsers( );
});

serial.on('user:denied', function ( token ) {
	console.log( token + ' denied' );
});

http.createServer( app ).listen( port );
console.log("server listening on " + port );