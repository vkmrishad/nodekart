'use strict';
var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var async = require('async');
var bcrypt = require('bcryptjs');
var _ = require('underscore');
var changeCase = require('change-case');

var format = 'hhhhhhhhhh';
var zen_id = require('zen-id').create(format);

var Userlist = require('../models/user');
var Product = require('../models/product');
var Category = require('../models/category');


function ensureUser(req, res, next){
	if(req.isAuthenticated()){
    if (req.user.role == 'user')
	  {
		return next();
	  }
	  else 
    {
	  req.logout();
		res.redirect('/');
	  }

	} else {
    req.logout();
		res.redirect('/');
	}
}


// Register
router.get('/register', function(req, res){

	if(!req.isAuthenticated()){

       res.render('shop/register',{cart:req.session.cart});
      }

      else
      {
      	res.redirect('/');
      }


});

// Login
router.get('/login', function(req, res){


      if(!req.isAuthenticated()){

       res.render('shop/login',{cart:req.session.cart});
      }

      else
      {
      	res.redirect('/');
      }

});


// Homepage
router.get('/', function(req, res){
    
    async.parallel({

        //Homepage Men  
        products_men: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":"Men"}]}, cb).limit(10);
        },
        //Homepage Women 
        products_women: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":"Women"}]}, cb).limit(10);
        },
        //Homepage Kids
        products_kids: function(cb){
          Product.find({$or:[{gender:"Boy"},{gender:"Girl"}],status:"Published",$and:[{"pricing.stock":{$gte:1}}]}, cb).limit(10);
        },
        //Homepage New
        products_new: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}}]}, cb).limit(10).sort({date:-1});
        },
        //Homepage Featured 
        products_featured: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}}]}, cb).limit(10).sort({date:1});
        },
        cart: function(cb){
          cb(null,req.session.cart);
        }
        }, function(err, results){
        res.render('shop/index',results);
      });
      
});

// Register
router.get('/test', function(req, res){
    res.render('shop/test');
});

// Register
router.get('/register', function(req, res){
    res.render('shop/register');
});

// Login
router.get('/login', function(req, res){
    res.render('shop/login');
});

// Product redirection
router.get('/product', function(req, res){
    res.redirect('/products');
});
// Product redirection
router.get('/shop', function(req, res){
    res.redirect('/products');
});

// User Page
router.get('/dashboard', ensureUser, function(req, res){
	res.render('shop/dashboard');
});



// Register Userlist
router.post('/register', function(req, res){
	var id = zen_id.generate().toUpperCase();
	var salt = bcrypt.genSaltSync(10);
	var hash = bcrypt.hashSync(req.body.password, salt);
	var fname = req.body.fname;
	var lname = req.body.lname;
	var email = req.body.email;
	var username = req.body.username;
	var password = hash;
	var role = "user";
	var status = "Active";


		var newUser = new Userlist({
			_id:id,
			fname: fname,
			lname: lname,
			email:email,
			username: username,
			password: password,
			status: status,
			role: role
		});

		newUser.save(function(err) {

			if (err)
            {
              req.flash('error_msg', 'Something went Wrong / Username and Email already Exists!');
              res.redirect('/register');
            }

            else
            {
              req.flash('success_msg', 'User Added Succesfully!');
              res.redirect('/login');

            }


			});
});

passport.use('customer', new LocalStrategy(
  function(username,password, done) {
   Userlist.getUserByUsername(username, function(err, userauth){
   	if(err) throw err;
   	if(!userauth){
   		return done(null, false, {message: 'Invalid Username or Email'});
   	}

   Userlist.comparePassword(password, userauth.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, userauth);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
 }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Userlist.getUserById(id, function(err, user) {
    done(err, user);
  });
});


router.post('/login',
  passport.authenticate('customer', {successRedirect:'/', failureRedirect:'/login',failureFlash: true}),
  function(req, res) {
    res.redirect('/');
  });

router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out Successfully!');

	res.redirect('/login');
});


/***********************************************************************************

Account Start

************************************************************************************/

router.get('/account',ensureUser,function(req,res){

  res.render('shop/account',{cart: req.session.cart});


});

router.get('/account/edit',ensureUser,function(req,res){

  res.render('shop/account-edit',{cart: req.session.cart});


});

router.get('/account/change-password',ensureUser,function(req,res){

  res.render('shop/account-change-password',{cart: req.session.cart});


});

// Edit Userlist
router.post('/account/edit', ensureUser, function(req, res){

  Userlist.findOne({_id : req.user._id}, function (err, userlist){

          
                userlist.fname = req.body.fname;
                userlist.lname = req.body.lname;
                userlist.mname = req.body.mname;
                userlist.address1 = req.body.address1;
                userlist.address2 = req.body.address2;
                userlist.address3 = req.body.address3;
                userlist.place = req.body.place;
                userlist.landmark = req.body.landmark;
                userlist.district = req.body.district;
                userlist.state = req.body.state;
                userlist.country = req.body.country;
                userlist.pin = req.body.pin;
                userlist.lnumber = req.body.lnumber;
                userlist.mnumber = req.body.mnumber;



      userlist.save(function(err) {

      if (err)
            {
              req.flash('error_msg', 'Something went Wrong / Username and Email already Exists!');
              res.redirect('/account');
            }

            else
            {
              req.flash('success_msg', 'User Updated Succesfully!');
              res.redirect('/account');

            }

              
          });


        });

    });


// Change Password

router.post('/account/change-password', ensureUser, function(req, res){

    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.cfmpassword, salt);

    Userlist.findOne({_id : req.user._id}, function(err,password){

            password.password = hash;

       bcrypt.compare(req.body.curpassword,req.user.password,function(err, isMatch) {

        if(isMatch)
        {
          bcrypt.compare(req.body.cfmpassword,req.user.password,function(err, isSame) {

            if(isSame)
            {

              req.flash('error_msg', 'Old and New Passwords are Same!');
              res.redirect('/account');

            }
            else
            {

              password.save(function(err){

              if (err)
              {
                req.flash('error_msg', 'Something went Wrong!');
                res.redirect('/account');
              } 
              else
              {
                
                req.flash('success_msg', 'Password Changed Successfully!');
                req.logout();
                res.redirect('/login');
                
              } 

              });

            }
            

            });

        }
        else
        {
          req.flash('error_msg', 'Wrong Current Password');
              res.redirect('/account');        }

       });
            
    });   

  });



/***********************************************************************************

Cart Start

************************************************************************************/
// Cart Page

router.get('/cart', function(req, res){
    res.render('shop/cart',{cart: req.session.cart});

});

// Add Cart
router.post('/cart/add/:id', function(req, res){

	   	try {
        // Get product from database for given id
        Product.findOne({_id : req.params.id}, function (err, product){

            var size = req.param.size;
            if (err) {console.log(err)}

            // Initalise cart
            if (!req.session.cart) {
                req.session.cart = {
                    products: {},
                    count: 0,
                    total: 0
                };
            }

            // Check if product already in cart
            if (!req.session.cart.products[req.params.id]) {

                // Add product if not
                req.session.cart.products[req.params.id] = {
                    id: product._id,
                    name: product.name,
                    price: product.pricing.sale,
										image: product.image,
                    quantity: 1
                };

            } else {

                // Increment count if already added
                req.session.cart.products[req.params.id].quantity = req.session.cart.products[req.params.id].quantity + 1;

            }

            // Total cart
            req.session.cart.count = 0;
            req.session.cart.total = 0;
            _.each(req.session.cart.products, function (product) {
                req.session.cart.count = req.session.cart.count + 1;
                req.session.cart.total = req.session.cart.total + (product.price * product.quantity);
            });

            // Respond with rendered cart
            res.render('partials/shop/header',{cart: req.session.cart});

        });
        } catch(err) {
            console.log(err);
        }



	});

/***********************************************************************************

Product Search Start

************************************************************************************/

router.get('/search' , function(req ,res){

        res.render('shop/products-by-gender');

});


router.post('/search' , function(req ,res){

        var q = req.body.q;

        Product.find({"$text": {"$search": q}}, function (err, products){

        res.render('shop/products-by-gender',{cart:req.session.cart,products:products});
      });


});




/***********************************************************************************

Product Single Page Start

************************************************************************************/

router.get('/product/:id' , function(req ,res){

  Product.findOne({_id : req.params.id}, function (err, single){


    Userlist.findOne({_id:single.seller}, function (err, seller){

      res.render('shop/product-single',{cart:req.session.cart,
        single:single,seller:seller});

    })  


  });

/*
  async.parallel({
        categories: function(cb){
          Category.find(cb);
        },
        single: function(cb){
          Product.findOne({_id : req.params.id}, cb);
        },
        cart: function(cb){
          cb(null,req.session.cart);
        }
        }, function(err, results){
        res.render('shop/product-single',results);
  });
  */


});

/***********************************************************************************

Products Start

************************************************************************************/

router.get('/products' , function(req ,res){

    async.parallel({
        categories: function(cb){
          Category.find(cb);
        },
        count: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}}]}).count(cb);
        },
        products: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}}]}, cb);
        },
        cart: function(cb){
          cb(null,req.session.cart);
        }
      }, function(err, results){
        res.render('shop/products',results);
      });


});

/***********************************************************************************

Product By Gender Start

************************************************************************************/

router.get('/shop/:gen' , function(req ,res){

    var gen = changeCase.titleCase(req.params.gen);
    var url = req.params.gen;
    var category = req.query.category;
    var brand = req.query.brand;
    var sort = req.query.sort;
/*
 
    else if (sort)
    {
      if (sort=='lowtohigh')
      {  

      async.parallel({
        count: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen}]}).count(cb).sort({"pricing.sale" : 1 });
        },
        products: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen}]}, cb).sort({"pricing.sale" : 1 });
        },
        cart: function(cb){
          cb(null,req.session.cart);
        }
        }, function(err, results){
        res.render('shop/product-by-gender',results);
       });
      }

      else if (sort=='hightolow')
      {  

      async.parallel({
        count: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen}]}).count(cb).sort({"pricing.sale" : -1 });
        },
        products: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen}]}, cb).sort({"pricing.sale" : -1 });
        },
        cart: function(cb){
          cb(null,req.session.cart);
        }
        }, function(err, results){
        res.render('shop/product-by-gender',results);
       });
      }

      else if (sort=='latest')
      {  

      async.parallel({
        count: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen}]}).count(cb).sort({"_id" : 1 });
        },
        products: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen}]}, cb).sort({"_id" : 1 });
        },
        cart: function(cb){
          cb(null,req.session.cart);
        }
        }, function(err, results){
        res.render('shop/men',results);
       });
      }

      else
      {  

      async.parallel({
        count: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen}]}).count(cb);
        },
        products: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen}]}, cb) ;
        },
        cart: function(cb){
          cb(null,req.session.cart);
        }
        }, function(err, results){
        res.render('men',results);
       });
      }

    }  


*/  
     if (gen!="Kids")
     {
      async.parallel({
        categories: function(cb){
          Category.find(cb);
        },
        count: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen}]}).count(cb);
        },
        products: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen}]}, cb);
        },
        product: function(cb){
          cb(null,{slug:url,title:gen});
        },
        cart: function(cb){
          cb(null,req.session.cart);
        }
        }, function(err, results){
        res.render('shop/products-by-gender',results);
      });
     }
     else
     {
      async.parallel({
        categories: function(cb){
          Category.find(cb);
        },
        count: function(cb){
          Product.find({$or:[{gender:"Boy"},{gender:"Girl"}],status:"Published",$and:[{"pricing.stock":{$gte:1}}]}).count(cb);
        },
        products: function(cb){
          Product.find({$or:[{gender:"Boy"},{gender:"Girl"}],status:"Published",$and:[{"pricing.stock":{$gte:1}}]}, cb);
        },
        product: function(cb){
          cb(null,{slug:url,title:gen});
        },
        cart: function(cb){
          cb(null,req.session.cart);
        }
        }, function(err, results){
        res.render('shop/products-by-gender',results);
      });

     }
      


});



/***********************************************************************************

Product By Category Start

************************************************************************************/

router.get('/shop/:gen/:cat' , function(req ,res){

    var gen = changeCase.titleCase(req.params.gen);
    var url = req.params.gen;
    var cat = req.params.cat;
    var brand = req.query.brand;
    var sort = req.query.sort;


    async.parallel({
        categories: function(cb){
          Category.find(cb);
        },
        category: function(cb){
          Category.findOne({category_slug:cat},cb);
        },
        count: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen},{"category":cat}]}).count(cb);
        },
        products: function(cb){
          Product.find({status:"Published",$and:[{"pricing.stock":{$gte:1}},{"gender":gen},{"category":cat}]}, cb);
        },
        product: function(cb){
          cb(null,{slug:url,title:gen,category:cat});
        },
        cart: function(cb){
          cb(null,req.session.cart);
        }
        }, function(err, results){
        res.render('shop/products-by-category',results);
      });


});



module.exports = router;
