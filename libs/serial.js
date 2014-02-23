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
		console.log("serial port open")
		_this.listenToPort( );
		_this.state = 1;
		_this.authenticate( function ( isGood) {
			if ( isGood ) {
				_this.state = 2;
			}
		})

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
	var _this = this,
		users = {},
		getUserData,
		userPresented,
		checkinPattern = /User (.*) presented tag/,
		authenticatedPattern = /User (.*) authenticated/,
		modifiedSuccessPattern = /User (.*) successfully modified/;

	this.port.on('data', function( data ) {
		var _user;
		// login successfull
		if ( /Access Control System rebooted/.test(data) ){
			_this.authenticate();
		}

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
			_user =  _this.parseUser( data );
			users[_user.id] = _user;
		}
		
		// end list on list user
		if ( /^199\s/.test(data) ) {
			_user =  _this.parseUser( data );
			users[_user.id] = _user;
			_this.emit('user:list', users);
			getUserData = false;
			users = [];
		}

		if ( checkinPattern.test(data) ){
			var match = data.match( checkinPattern ) || [];
			userPresented = match[ 1 ];
		}

		if ( authenticatedPattern.test( data ) && userPresented ) {
			var match = data.match( authenticatedPattern );
			// user id, user key, message;
			_this.emit('user:granted', { id : match[1], key : userPresented } );
			userPresented = false;
		}

		if ( modifiedSuccessPattern.test( data ) ) {
			var match = data.match( modifiedSuccessPattern );
			_this.emit('user:modified', { id : match[1] } );
		}

		if ( /denied access/.test( data ) && userPresented ) {
			var user = userPresented;
			_this.emit('user:denied', user );
			console.log( user, "has no access" );
			userPresented = false;
		}

		if ( /Door 1 unlocked/.test( data ) ) {
			_this.emit('door:unlocked');
		}

		if ( /Door 1 locked/.test( data ) ) {
			_this.emit('door:locked');
		}

  	});
};

Serial.prototype.authenticate = function ( callback ) {
	// writes auth to login
	function handle ( isGood ) {
		if ( callback ) callback ( isGood );
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
		var user = users[ id ];
		if ( user ) return callback( null, user );
		callback( new Error("User Not Found") );
	})
};

Serial.prototype.validateUpdate = function ( user, callback ) {
	var key,
		permission;
	if( typeof user === 'object' ) {
		key = user.key;
		permission = user.permission;
		this.getUser( user.id, function ( err, res ) {
			if ( err ) return callback( null, err );
			if ( key ) {
				if ( key !== res.key ) return callback( false );
			}
			if ( permission ) {
				if ( permission !== res.permission ) return callback( false );
			}
			callback( true );
		})
	}
};

Serial.prototype.updateUser = function ( user, callback ) {
	this.port.write( 'm ' + 
		user.id + 
		' ' +
		( user.permission || '255' ) + 
		' ' + 
		// apparently this is the default
		( user.key || '4294967295' ) + 
		'\r' );

	this.on('user:modified', function ( updated ) {
		if ( updated ) {
			if ( updated.id === user.id ) {
				return callback( null, updated );
			}
		}
		callback( new Error("User Not Updated") );
	});
};

Serial.prototype.openDoor = function ( callback ) {
	this.port.write( 'o 1' );
	this.once( 'door:unlocked', function ( ) {
		callback( true );
	});
};

module.exports = Serial;
