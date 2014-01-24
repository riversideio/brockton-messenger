var serialport = require('serialport'),
	SerialPort = serialport.SerialPort,
	EventEmitter = require('events').EventEmitter,
	util = require('util');


function Serial ( port, options ) {
	var _this = this;
	this.state = 0;
	this.authAttempts = 0;
	this.maxAuthAttempts = options.maxAuthAttempts || 3;
	this.auth = options.auth;
	// options.parser = serialport.parsers.readline("\n")
	// create a new serial port connection.
	this.port = new SerialPort( port, options );
	function open ( ) {
		_this.listenToPort( );
		_this.state = 1;
	};
	this.port.on('open', open);
};

util.inherits(Serial, EventEmitter);

Serial.prototype.listenToPort = function ( ) {
	this.port.on('data', function( data ) {
    	// need to see what this data looks like
    	// from system
    	// should probably try to infer functions
    	// based of returns
  	});
};

Serial.prototype.checkin__ = function ( data ) {
	this.emit('user:checkin', data);
};

Serial.prototype.users__ = function ( data ) {
	this.emit('user:list', data);
};

Serial.prototype.authenticate = function ( ) {
	// writes auth to login
	this.authAttempts += 1;
	if ( this.authAttempts < this.maxAuthAttempts ) {
		return this.port.write( 'e ' + this.auth + '\r');
	}
	this.emit('auth:fail');
};

Serial.prototype.getUsers = function ( callback ) {
	// fetch data
	// somthing like this 
	this.port.write( 'l\r' );
	this.once("user:list", function ( res ) {
		// parse fail or something could be error.
		callback( null, res );
	})
};

Serial.prototype.getUser = function ( id, callback ) {
	function getUserById ( user ) {
		return ( user.id === id );
	}
	this.getUsers(function( err, res ) {
		var user = users.filter( getUserById )[0];
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

Serial.prototype.updateUser = function ( userId, key, callback ) {
	this.port.write( 'm ' + userId + ' ' + key + '\r' );
	this.validateUpdate( {
		id : userId,
		key : key
	}, function ( updated ) {
		if ( updated ) return callback( null );
		// need to pass back better errors
		callback( new Error("User Not Updated") );
	})
};

module.exports = Serial;
