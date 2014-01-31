var levelup = require('levelup');

function Home ( dir, serial, io ) {
	// local version of database
	var db = dir ? levelup( dir ) : {};
	this.db = db;
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

	function mergeAndPut ( _user ) {
		var opts = _user;
		for( var key in data ) {
			opts[key] = data[key];
		}
		_this.db.put( id, JSON.stringify(opts), handlePut );
	}

	function handleGet( err, res ) {
		var payload = {};
		// if key is here
		// there is something going on with this
		// install and not showing errors
		//console.log( arguments );
		if ( err ) return mergeAndPut( payload );
		try {
			res = JSON.parse( res );
		} catch ( e ) {
			res = null;
		}
		if ( 
			( data.key || data.permission ) &&
		 	!skipBoard && 
		 	res 
		) {
			payload.key = data.key || res.key;
			payload.permission = data.permission || res.permission;
			payload.id = id;
			return _this.serial.updateUser( payload, function ( err ) {
				if ( err ) return callback ( err );
				mergeAndPut( res );
			});
		}
		// replace with blank object if unable to parse
		mergeAndPut( res || {} );
	}

	function handlePut( err ) {
		if ( err ) return callback( err );
		_this.getUser( id, callback );
	}
	this.db.get( id, handleGet );
};

// convert to have error responses
Home.prototype.getBoardUsers = function ( callback ) {
	this.serial.getUsers( callback );
};
// convert to have error responses
Home.prototype.findBoardUser = function ( id, callback ) {
	this.serial.getUser( id, callback );
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
		var keys = Object.keys(res);
		users = res;
		keys.forEach( eachUser );
	}	

	this.getBoardUsers( handleBoardUsers );
}

Home.prototype.getUsers = function ( opts, callback ) {
	var options = opts;
	var rs = this.db.createReadStream( );
	var results = [];

	if ( typeof opts === 'function' ) {
		callback = opts;
		options = {};
	}

	function filterEmpty ( user ) {
		return user.permission === '255';
	}

	function sortId ( user, prev ) {
		return ( +user.id < +prev.id ) ? -1 : 1;
	}

	rs.on('data', function( data ){
		var values;
		try {
			values = JSON.parse(data.value);
		} catch ( e ) { }
		if ( values ) {
			values.id = data.key;
			results.push( values );
		}
	}).on('end', function ( ) {
		if ( options.empty ) {
			results = results.filter( filterEmpty );
		}
		results = results.sort( sortId );
		callback( null, results );
	})
};

Home.prototype.getUser = function ( id, callback ) {
	var returned;
	this.db.get( id, function ( err, res ) {
		if ( err ) return callback( err );
		try {
			res = JSON.parse( res );
		} catch ( e ) {
			returned = true;
			callback ( e );
		}
		if ( !returned ) callback( null, res );
	})
};	

module.exports = Home;