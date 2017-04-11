
import cheerio from 'cheerio';
import request from  'request';
import mongojs from 'mongojs';

const db = mongojs('products', ['products']);

let subUrl =[];  // for sub url
let productData = []; // check the number of products and their details
let failedUrl = [];  // list of url which reqest is not succeed

export default async function run() {

  // Menu url for electrical category 
  app.get('/login', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });
}

