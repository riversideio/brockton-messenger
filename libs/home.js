var levelup = require('levelup');

function Home ( dir, serial, io ) {
	// local version of database
	this.db = dir ? levelup( dir ) : {};
	this.serial = serial;
	this.io = io;
}

// this call is only for users already on board
// so no write to board are made
Home.prototype._addUser = function ( user, callback ) {

	function handlePut ( err ) {
		if ( err ) return callback ( err );
		callback( null, user );
	}
	// id should be based off id in arduino
	if ( user.id ) {
		this.db.put( user.id, user, handlePut );
	}
};

Home.prototype.updateUser = function ( id, data, callback, skipBoard ) {
	var _this = this,
		user,
		keys;

	function mergeAndPut ( user ) {
		var result = Object.create( user, data );
		this.db.put( id, result, handlePut );
	}

	function handleGet( err, res ) {
		if ( err ) return callback( err );
		// if key is here
		if ( data.key && !skipBoard ) {
			_this.serial.updateUser( id, data.key );
			// this need to be created vv
			return _this.serial.validateUpdate( function ( good ) {
				if ( !good ) {
					return callback ( new Error("Failed to update Board") );
				}
				mergeAndPut( res );
			});
		}
		mergeAndPut( res );
	}

	function handlePut( err ) {
		if ( err ) return callback( err );
		callback( null, user );
	}

	this.db.get( id, handleGet );
};

// convert to have error responses
Home.prototype.getBoardUsers = function ( callback ) {
	this.serial.getUsers();
	this.serial.once('user:list', function ( data ){
		callback( null, data );
	});
};
// convert to have error responses
Home.prototype.findBoardUser = function ( id, callback ) {
	function getUserById ( user ) {
		return ( user.id === id );
	}

	this.getSerialUsers(function( users ){
		var user = users.filter( getUserById )[0];
		callback( null, user );
	});
};

// syncs board and db
Home.prototype.syncUsers = function ( ) {
	var _this = this,
		users;

	function eachUser ( id ) {
		_this.updateUser( id, 
			users[id],
			function ( ){ }, 
			true );
	};

	function handleBoardUsers ( err, res ) {
		// might need to convert users data structure
		var keys = res.keys();
		users = res;
		keys.forEach( eachUser );
	}	

	this.getBoardUsers( handleBoardUsers );
}	

module.exports = Home;