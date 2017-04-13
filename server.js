//import packeges;
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

// importing config files and scheema
import database from './config/database';
import User from './app/modal/user';
import Email from './app/modal/email';

// creating global variable
const port = process.env.PORT || 8000; // port
// set up our express application
const app = express(); // express app

mongoose.connect( database.url ); // connecting to mongodb database

app.set( 'jwttoken', database.key ); // set key
app.set( 'view engine', 'ejs' ); // set up ejs for templating

// allow sending data from post request
app.use(bodyParser.urlencoded({ extended: false }));
app.use( bodyParser.json());
app.use( cookieParser()); // allow cookie


// inserting first user fro login
let user = new User({ 
    name: 'admin', 
    password: 'admin',
  });

// add single user condition here

// save the sample user
user.save(( err ) => {
	if ( err ) throw err;
	console.log( 'User Created' );
});

const routes = express.Router(); // create another global variable

routes.get( '/', ( req, res ) => {

	if ( req.cookies && req.cookies.jwttoken && req.cookies.jwttoken !== "notoken" ) {
		res.redirect( '/profile' );
	} else {
		res.render( 'login.ejs', { message: '' });
	}
});

routes.get( '/login', ( req, res ) => {
	res.render( 'login.ejs', { message: '' });
});

routes.get( '/logout', ( req, res ) => {

	const token = jwt.sign( user, app.get( 'jwttoken' ), {
			          expiresIn: '1h' // expires in 1 hour
			        });

    res.render( 'login.ejs', {message: '' },
	    ( err, rendered ) => {
	        res.writeHead( 200, {
			    'Set-Cookie': 'jwttoken=notoken',
			    'Content-Type': 'text/html'
			  });
	        res.end( rendered );
	    });
});

routes.post( '/login/', async( req, res ) => {

  // find the user
  User.findOne({ name: req.body.email }, async( err, user ) => {

    if ( err ) throw err;

    if ( !user || user.password != req.body.password ) {

      res.json({ success: false, message: 'Authentication failed.' });

    } else {
        // create a token
        const token = jwt.sign(user, app.get('jwttoken'), {
				          expiresIn: '1h' // expires in 1 hour
				        });

        const emails = await getEmails();

        res.render( 'profile', { message: '', 'emails' : emails },
		    ( err, rendered ) => {
		        res.writeHead( 200, {
				    'Set-Cookie': 'jwttoken='+token,
				    'Content-Type': 'text/html'
				  });
		        res.end( rendered );
		     });
      }   
    });
});

routes.use(( req, res, next ) => {

	// check header or url parameters or post parameters for token
	const token = req.body.token || req.cookies.jwttoken;

	// decode token
	if ( token ) {

		// verifies secret and checks exp
		jwt.verify( token, app.get( 'jwttoken' ), ( err, decoded ) => {			
			if ( err ) {
				if ( err.name === 'TokenExpiredError' ) {
					res.redirect( '/login' );
				} else {
					res.redirect( '/' );
				}
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;	
				next();
			}
		});

	} else {
		
		// if there is no token return to login page
		res.redirect( '/login' );
	}
});

////////////////////////////////////////////////////////////
///////////////// after authentication Url /////////////////
////////////////////////////////////////////////////////////

// profile provide the list emails with name
routes.get( '/profile', async ( req, res ) => {
	const emails = await getEmails();
	res.render( 'profile', { message: '', 'emails' : emails });
});

// add the email and name into mongodb database 
// @params need two parameter
// name as String
// email as String
routes.post( '/add/', async ( req, res ) => {
	// build structure for inhsertion
	const emp = new Email({
			name: req.body.name,
			email: req.body.email
		});
	// insert onto dta base
	emp.save(( err ) => {
		if ( err ) throw err;
	});

	res.redirect( '/profile' );  // redirecting to profile url
});

// purge delete the document from email collection
// @params need one paramerter
// id as String
routes.post( '/delete/', async ( req, res ) => {

	Email.findOneAndRemove({ '_id': req.body.id}, ( err, res ) => {
		if ( err ) throw err;
	});
	res.redirect( '/profile' ); // redirecting to the profile
});

// render update page
routes.get( '/update', async ( req, res ) => {
	res.render( 'update', { 'body' : req.query } );
});

// update the document name and email 
// @params 3 parameter need
// id to be updated as string
// name as string
// email as string
routes.post( '/update/', async ( req, res ) => {

	Email.findOneAndUpdate({ '_id': req.body.id }, 
		{ 'name':req.body.name, 'email': req.body.email }, ( err, docs ) => {
	});
	const emails = await getEmails(); // get the list of emails
	res.render( 'profile', { 'emails': emails, 'message': 'Successfully Updated' });
});

// call all the routes
app.use('/', routes);

// deploye the server on port
app.listen(port);
console.log(' Server is running on port ', port);

// function that call all documents from email collections
async function getEmails() {
	return Email.find(( err, emails ) => {
		return emails;
	})
}