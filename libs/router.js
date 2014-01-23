function Router ( paths ) {
	return function ( req, res, next ) {
		var _path = req.method + ' ' + req.url;
		if ( typeof paths[_path] === 'function' ) {
			return paths[_path].apply( null, arguments );
		}
		next(); // continue
	}
}

module.exports = Router;
/* This is what I want my paths to look like
{
	'GET /users.json' : function ( req, res ) { },
	'POST /users.json' : function ( req, res ) { },
	'PUT /users.json' : function ( req, res ) { }
}
*/
