if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

/* Require external APIs and start our application instance */
var express = require('express');
var mysql = require('mysql');
var app = express();
var session = require('express-session');
var passport = require('passport');
var bodyParser = require('body-parser');

/* Configure our server to read public folder and ejs files */
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine', 'ejs');
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

/* Configure MySQL DBMS */
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'ericg',
    password: 'ericg',
    database: 'quotes_db'
});
connection.connect();

/* The handler for the DEFAULT route */
app.get('/', function(req, res){
    res.render('home');
});

/* The handler for the /author route */
app.get('/author', function(req, res){
    var stmt = 'select * from l9_author where firstName=\'' 
                + req.query.firstname + '\' and lastName=\'' 
                + req.query.lastname + '\';'
	connection.query(stmt, function(error, found){
	    var author = null;
	    if(error) throw error;
	    if(found.length){
	        author = found[0];
	        // Convert the Date type into the String type
	        author.dob = author.dob.toString().split(' ').slice(0,4).join(' ');
	        author.dod = author.dod.toString().split(' ').slice(0,4).join(' ');
	    }
	    res.render('author', {author: author});
	});
});

/* The handler for the /author/name/id route */
app.get('/author/:aid', function(req, res){
    var stmt = 'select quote, firstName, lastName ' +
               'from l9_quotes, l9_author ' +
               'where l9_quotes.authorId=l9_author.authorId ' + 
               'and l9_quotes.authorId=' + req.params.aid + ';'
    connection.query(stmt, function(error, results){
        if(error) throw error;
        var name = results[0].firstName + ' ' + results[0].lastName;
        res.render('quotes', {name: name, quotes: results});      
    });
});

/* The handler for the /quoteByCategory route */
app.get('/category', function(req, res){
    console.log(req.query.title);
     var stmt = 'select * from l9_quotes where category=\'' 
                + req.query.category + '\';';
    console.log(stmt);
    var quotes = null;
    connection.query(stmt, function(error, results){
        if(error){
            throw error;
        } else if(results.length){      //book is in db
            quotes = results;
            console.log(quotes);
            res.render('quotes', {quotes: quotes});
        } else {                        //book is not in db - do this as a pop up later
            console.log("category not found");
            res.render("error");
        }
    });
});

/* The handler for the /quoteByCategory route */
app.get('/keyword', function(req, res){
    var keyword = req.query.keyword;
    var stmt = 'select * from l9_quotes;';
    console.log(stmt);
    connection.query(stmt, function(error, results){
        if(error){
            throw error;
        } else if(results.length){      //book is in db
            var allQuotes = results;
            console.log(allQuotes);
            var quotes = [];
            for(var i = 0; i < results.length; i++){
                if(results[i].quote.includes(keyword)){
                    quotes.push(results[i]);
                    console.log("pushing: " + results[i].quote);
                }
            }
            res.render('quotes', {quotes: quotes});
        } else {                        //book is not in db - do this as a pop up later
            console.log("category not found");
            res.render("error");
        }
    });
});

/* The handler for the /quoteByGender route */
app.get('/gender', function(req, res){
    console.log(req.query.title);
    var stmt = 'SELECT * FROM l9_quotes, l9_author where l9_quotes.authorId=l9_author.authorId;';
                
    console.log(stmt);
    var quotes = [];
    connection.query(stmt, function(error, results){
        if(error){
            throw error;
        } else if(results.length){      //book is in db
            for(var i = 0; i < results.length; i++){
                if(results[i].sex == req.query.gender){
                    quotes.push(results[i]);
                    console.log("Pushing: " + results[i].sex);
                }
            }
            // console.log(quotes);
            res.render('quotes', {quotes: quotes});
        } else {                        //book is not in db - do this as a pop up later
            console.log("category not found");
            res.render("error");
        }
    });
});

app.get('/login', function(req, res){
    res.render('login');
});

app.post('/login', function(req, res){
    console.log(req.body.password);
    
    if(req.body.password == 'pass'){
        req.session.login = 'admin';
            var stmt = 'select * from l9_author;';
            connection.query(stmt, function(error, found){
    	    var authors = null;
    	    if(error) throw error;
    	    if(found.length){
    	        authors = found;
    	        // Convert the Date type into the String type
    	       // authors.dob = authors.dob.toString().split(' ').slice(0,4).join(' ');
    	       // authors.dod = authors.dod.toString().split(' ').slice(0,4).join(' ');
    	    }
    	    res.render('adminPage', {authors: authors});
    	});
    }
});

app.get('/newAuthor', function(req, res){
    res.render('author_new');
});

/* Create a new author - Add author into DBMS */
app.post('/author/new', function(req, res){
   //console.log(req.body);
   var stmt = 'SELECT COUNT(*) FROM l9_author;';
   connection.query(stmt, function(error, result){
       if(error) throw error;
       if(result.length){
            var authorId = result[0]['COUNT(*)'] + 1;
            //insert to DB
            var stmt = 'INSERT INTO l9_author ' +
                      '(authorId, firstName, lastName, dob, dod, sex, profession, country, biography) '+
                      'VALUES ' +
                      '(' + 
                       authorId + ',"' +
                       req.body.firstname + '","' +
                       req.body.lastname + '","' +
                       req.body.dob + '","' +
                       req.body.dod + '","' +
                       req.body.sex + '","' +
                       req.body.profession + '","' +
                       req.body.country + '","' +
                       req.body.biography + '"' +
                       ');';
            console.log(stmt);
            connection.query(stmt, function(error, result){
                if(error) throw error;
                res.redirect('/');
            })
       }
   });
});

/* Delete an author record */
app.get('/author/:aid/delete', function(req, res){
    var stmt = 'DELETE from l9_author WHERE authorId='+ req.params.aid + ';';
    connection.query(stmt, function(error, result){
        if(error) throw error;
        res.redirect('/');
    });
});

/* Delete an author record */
app.get('/uSure/:aid', function(req, res){
    var stmt = 'select * from l9_author WHERE authorId='+ req.params.aid + ';';
    connection.query(stmt, function(error, result){
         var author = null;
        if(error) throw error;
        author = result[0];
        res.render('uSure', {author: author});
    });
});


app.get('/author/:aid/edit', function(req, res){
    var stmt = 'SELECT * FROM l9_author WHERE authorId=' + req.params.aid + ';';
    connection.query(stmt, function(error, results){
       if(error) throw error;
       if(results.length){
           var author = results[0];
           author.dob = author.dob.toISOString().split('T')[0];
           author.dod = author.dod.toISOString().split('T')[0];
           res.render('author_edit', {author: author});
       }
    });
});

/* Edit an author record - Update an author in DBMS */
app.post('/author/:aid', function(req, res){
    console.log(req.body);
    var stmt = 'UPDATE l9_author SET ' +
                'firstName = "'+ req.body.firstname + '",' +
                'lastName = "'+ req.body.lastname + '",' +
                'dob = "'+ req.body.dob + '",' +
                'dod = "'+ req.body.dod + '",' +
                'sex = "'+ req.body.sex + '",' +
                'profession = "'+ req.body.profession + '",' +
                'portrait = "'+ req.body.portrait + '",' +
                'country = "'+ req.body.country + '",' +
                'biography = "'+ req.body.biography + '"' +
                'WHERE authorId = ' + req.params.aid + ";"
    //console.log(stmt);
    connection.query(stmt, function(error, result){
        if(error) throw error;
        res.redirect('/');
    });
});

/* The handler for undefined routes */
app.get('*', function(req, res){
   res.render('error'); 
});

/* Middleware for authentication */
function check_auth(req, res, next) {
  //  if the user isn't logged in, redirect them to a login page
  if(!req.session.login) {
    res.redirect("/login");
    return; 
  }
  //  the user is logged in, so call next()
  next();
}


/* Start the application server */
app.listen(process.env.PORT || 3000, function(){
    console.log('Server has been started');
})
