require('dotenv').load();

var connect = require('connect'),
	app = connect( ),
	http = require('http'),
	api = process.env.API || 'http://localhost:3000/',
	router = require('./libs/router')( require('./libs/routes') ),
	Serial = require('./libs/serial'),
	port = process.env.PORT || 3000,
	io = require('./libs/sdk')(process.env.API),
	serial = new Serial( process.env.SERIALPORT, {
			auth : process.env.SERIALAUTH
		}),
	home = require('./libs/home')( process.env.DBDIR, serial );

app.use(function( req, res, next ){
	req.serial = serial;
	req.io = io;
	next( );
});
app.use(router);

/*io.users.all(function( err, res ){
	console.log( arguments );
})*/


http.createServer( app )
	.listen( port );
console.log("server listening on " + port );


