var serialport = require('serialport'),
	SerialPort = serialport.SerialPort,
	EventEmitter = require('events').EventEmitter,
	util = require('util');


function Serial ( port, options ) {
	options = options || { };
	var _this = this;
	this.state = 0;
	this.authAttempts = 0;
	this.maxAuthAttempts = options.maxAuthAttempts || 3;
	this.auth = options.auth;
	options.parser = serialport.parsers.readline("\n")
	// create a new serial port connection.
	this.port = new SerialPort( port, options );
	function open ( ) {
		_this.listenToPort( );
		_this.state = 1;
	};
	this.port.on('open', open);
};

util.inherits(Serial, EventEmitter);

Serial.prototype.parseUser = function ( user ) {
	if ( typeof user === 'string' ) {
		user = user.replace('\r', '').split('\t');
		if ( user ) {
			return {
				id : user[0],
				permission : user[1],
				key : user[2]
			}
		}
	}
	return
};

Serial.prototype.listenToPort = function ( ) {
	var _this = this;
		users = {};
		getUserData;

	this.port.on('data', function( data ) {
		console.log( data );
		// login successfull
		if ( /Priveleged mode enabled/.test(data) ) {
			//port.write('a\r');
			_this.emit('auth', true);

		}
		// logout or unsuccessful auth
		if ( /Priveleged mode disabled/.test( data ) ) {
			_this.emit('auth', false);
		}
		// start listing users
		if ( /User dump started/.test(data)) {
			getUserData = true;	
		}

		// catch user if list started
		if ( /^[0-9]+\s/.test(data) && getUserData ) {
			data = data.split('\t');
			users.push(data)
		}
		
		// end list on list user
		if ( /^199\s/.test(data) ) {
			users.push( _this.parseUser( data ) );
			_this.emit('user:list', users);
			getUserData = false;
			users = [];
		}

		var checkinPattern = /User (.*) presented tag/;
		var authenticatedPattern = /User (.*) authenticated/;
		if ( checkinPattern.test(data) ){
			var match = data.match( checkinPattern ) || [];
			userPresented = match[ 1 ];
			console.log( 'presented tag', data.match(checkinPattern))	
		}

		if ( authenticatedPattern.test( data ) && userPresented ) {
			var match = data.match( authenticatedPattern );
			// user id, user key, message;
			_this.emit('user:granted', { id : match[1], userPresented } );
			console.log( match[1], user, "has access" );
			userPresented = false;
		}

		if ( /denied access/.test( data ) && userPresented ) {
			var user = userPresented;
			_this.emit('user:denied', user );
			console.log( user, "has no access" );
			userPresented = false;
		}

  	});
};

Serial.prototype.authenticate = function ( callback ) {
	// writes auth to login
	function handle ( isGood ) {
		callback ( isGood );
	}
	this.port.write( 'e ' + this.auth + '\r');
	this.once( 'auth', handle )
};

Serial.prototype.getUsers = function ( callback ) {
	// fetch data
	// somthing like this 
	this.port.write( 'a\r' );
	this.once("user:list", function ( users ) {
		// parse fail or something could be error.
		callback( null, users );
	})
};

Serial.prototype.getUser = function ( id, callback ) {
	this.getUsers(function( err, users ) {
		if ( err ) return callback( err );
		var user = users[id];
		if ( user ) return callback( null, res );
		callback( new Error("User Not Found") );
	})
};

Serial.prototype.validateUpdate = function ( user, callback ) {
	if( typeof user === 'object' ) {
		this.getUser( user.id, function ( err, res ) {
			if ( user.key === res.key ) return callback( true );
			callback( false );
		})
	}
};

Serial.prototype.updateUser = function ( user, callback ) {
	this.port.write( 'm ' + user.id + ' ' + user.permission + ' ' + user.key + '\r' );
	this.validateUpdate( {
		id : user.id,
		key : user.key
	}, function ( updated ) {
		if ( updated ) return callback( null );
		// need to pass back better errors
		callback( new Error("User Not Updated") );
	})
};

module.exports = Serial;
