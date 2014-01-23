require('dotenv').load();

var request = require('request'),
	api = process.env.API || 'http://localhost:3000/',
	Serial = require('./libs/serial'),
	serial = new Serial()

function syncCheckin ( data ) {
	var options = { data : data };
	options.url = api + 'api/v0/checkins.json';
	request( options, function( err, res, body ) {
		if ( err ) return console.log( err );
		console.log( body );
	})
}


connectSerial('/dev/ttyUSB0', function ( ) {
	console.log('Serial Port Connected');
});


