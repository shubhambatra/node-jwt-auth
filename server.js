//import packeges;
import express from 'express';

// import routes from './app/routes';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import database from './config/database'
import User from './app/modal/user';

const port = process.env.PORT || 8080;
const app = express();

mongoose.connect(database.url);
app.set('jwttoken', database.key); // secret variable

let user = new User({ 
    name: 'admin', 
    password: 'admin',
  });

// save the sample user
user.save((err) => {
	if (err) throw err;
	console.log('User Created');
});


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// set up our express application
app.set('view engine', 'ejs'); // set up ejs for templating



// app.use(morgan('dev'));


const routes = express.Router();

routes.get('/', (req, res) => {
	res.render('login.ejs', { message: '' });
});

routes.post('/login/', (req, res) => {

	console.log(req.body);
  // find the user
  User.findOne({
    name: req.body.email
  }, (err, user) => {
  	console.log('err ', err, 'user ', user)
    if (err) throw err;
    console.log ( !user, user.password != req.body.password );

    if (!user || user.password != req.body.password) {
      res.json({ success: false, message: 'Authentication failed.' });

    } else {
    	console.log(' create token ');
        // create a token
        const token = jwt.sign(user, app.get('jwttoken'), {
          expiresIn: '1h' // expires in 1 hour
        });

        res.redirect('/profile?token='+token);
      }   
    });
});

routes.use((req, res, next) => {

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	// decode token
	if (token) {

		// verifies secret and checks exp
		jwt.verify(token, app.get('jwttoken'), (err, decoded) => {			
			if (err) {
				res.redirect('/');
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;	
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		res.redirect('/');
		
	}
	
});








routes.get('/profile', (req, res) => {
	res.send('<h1> Authentication success full</h1>');
});


app.use('/', routes);

app.listen(port);
console.log(' Server is running on port 8080');