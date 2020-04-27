/* Require external APIs and start our application instance */
var express = require('express');
var mysql = require('mysql');
var app = express();

/* Configure our server to read public folder and ejs files */
app.use(express.static('public'));
app.set('view engine', 'ejs');

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

/* The handler for undefined routes */
app.get('*', function(req, res){
   res.render('error'); 
});

/* Start the application server */
app.listen(process.env.PORT || 3000, function(){
    console.log('Server has been started');
})
