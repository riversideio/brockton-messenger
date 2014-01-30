var delimiterStart = '{',
    delimiterEnd = '}',
    pattern = new RegExp( delimiterStart + '(.+?)' + delimiterEnd, 'g');

function Router ( paths ) {
	for ( var key in paths ) {
		// this sets up paths for variables
		var path = key,
			handle = paths[ key ],
			matches = path.match( pattern );
			variables = matches ? matches.map(function ( variable ) {
				path = path.replace( variable, '(.*)+');
				return variable.replace( delimiterStart, '' )
					.replace( delimiterEnd, '' )
			}) : [];
			handle.variables = variables;

		delete paths[ key ];
		paths[ path ] = {
			variables : variables,
			handle : handle
		};

	}
	return function ( req, res, next ) {
		var _path = req.method + ' ' + req.url,
			matches;
		// to allow for variables
		// we should 
		if ( paths[_path] ) {
			return paths[_path].handle.apply( null, arguments );
		}

		for ( var key in paths ) {
			matches = _path.match(key); 
			if ( matches ) {
				if ( matches.length >= 2 ) {
					req.params = {};
					matches.forEach(function( match, index ){
						if ( index === 0 ) return;
						req.params[ paths[ key ].variables[ index - 1 ] ] = match;
					})
					return paths[ key ].handle.apply( null, arguments );
				}
			}
		}
		next(); // continue
	}
}

module.exports = Router;
/* This is what I want my paths to look like
{
	'GET /users.json' : function ( req, res ) { },
	'POST /users/{id}.json' : function ( req, res ) { },
	'PUT /users.json' : function ( req, res ) { }
}

url.replace(/\//g, '\/').replace(/\./g, '\.')

/\/user\/(.*)+\.json
new RegExp('/users/(.*)+.')

/users/2.json /users/{id}.json
*/


