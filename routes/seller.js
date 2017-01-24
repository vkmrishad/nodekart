var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var async = require('async');
var multer  = require('multer');
var rimraf = require('rimraf');
var bcrypt = require('bcryptjs');
var fs = require('fs');
var changeCase = require('change-case');

var format = 'hhhhhhhhhh';
var zen_id = require('zen-id').create(format);


var Product = require('../models/product');
var Brand = require('../models/brand');
var Category = require('../models/category');
var Userlist = require('../models/user');

function ensureSeller(req, res, next){
	if(req.isAuthenticated()){
	  if (req.user.role == 'seller')
	  {	
		return next();
	  }
	  else {

	  	req.logout();
		res.redirect('/seller');
	   }

	} 
	else {
		res.redirect('/seller');
	}
}

/***********************************************************************************

Index Start

************************************************************************************/


// Register
router.get('/seller/register', function(req, res){

	if(!req.isAuthenticated()){
	
       res.render('seller/register');
      }

      else
      {
      	res.redirect('/seller/dashboard');
      }


});

// Login
router.get('/seller', function(req, res){


      if(!req.isAuthenticated()){
	
       res.render('seller/login');
      }

      else
      {
      	res.redirect('/seller/dashboard');
      }

});

// Brand Page
router.get('/seller/404', function(req, res){
	res.render('seller/404');
});

// Dashboard Page
router.get('/seller/dashboard', ensureSeller, function(req, res){
	res.render('seller/dashboard');
});

// Product Page
router.get('/seller/product', ensureSeller, function(req, res){
	res.redirect('/seller/products');
});

// User Page
router.get('/seller/user', ensureSeller, function(req, res){
	res.redirect('/seller/users');
});

// Category Page
router.get('/seller/category', ensureSeller, function(req, res){
	res.redirect('/seller/categories');
});

// Brand Page
router.get('/seller/brand', ensureSeller, function(req, res){
	res.redirect('/seller/brands');
});

// Register Userlist
router.post('/seller/register', function(req, res){
	var id = zen_id.generate().toUpperCase();
	var salt = bcrypt.genSaltSync(10);
	var hash = bcrypt.hashSync(req.body.password, salt);
	var name = req.body.name;
	var company = req.body.company;
	var email = req.body.email;
	var username = req.body.username;
	var password = hash;
	var role = "seller";
	var status = "Active";


		var newUser = new Userlist({
			_id:id,
			fname: name,
			company: company,
			email:email,
			username: username,
			password: password,
			status: status,
			role: role
		});

		newUser.save(function(err){
			if (err)
				{
				req.flash('error_msg', 'Something went Wrong!');
				res.redirect('/seller');
				console.log(err);
				}
				else
				{
                req.flash('success_msg', 'You are Successfully Registered!');
			    res.redirect('/seller');
				}
		});		

});

passport.use('authSellerWeb', new LocalStrategy(
  function(username,password, done) {
   Userlist.getSellerByUsername(username, function(err, seller){
   	if(err) throw err;
   	if(!seller){
   		return done(null, false, {message: 'Invalid Username or Email'});
   	}

   	Userlist.comparePassword(password, seller.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, seller);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
 }));

passport.serializeUser(function(seller, done) {
  done(null, seller._id);
});

passport.deserializeUser(function(id, done) {
  Userlist.getSellerById(id, function(err, seller) {
    done(err, seller);
  });
});


router.post('/seller',
  passport.authenticate('authSellerWeb', {successRedirect:'/seller/dashboard', failureRedirect:'/seller',failureFlash: true}),
  function(req, res) {
    res.redirect('/seller/dashboard');
  });

router.get('/seller/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/seller');
});






/***********************************************************************************

Product Start

************************************************************************************/


// Product's Page
router.get('/seller/products', ensureSeller, function(req, res){

      Product.find({seller:req.user._id}, function(err, products) {

         if (err) throw err;

        res.render('seller/product/products',{"products":products});

      });

});

// Product Add Page
router.get('/seller/product/add', ensureSeller, function(req, res){

		async.parallel({
				brands: function(cb){
					Brand.find({}, cb);
				},
				categories: function(cb){
					Category.find({}, cb);
				}
			}, function(err, results){
				res.render('seller/product/product-add', results);
			});

    });

// Product View Page
router.get('/seller/product/view/:id', ensureSeller, function(req, res){

	async.parallel({
			product: function(cb){
				Product.findOne({$and:[{_id: req.params.id},{seller: req.user._id} ]}, cb);
			 },
			products: function(cb){
				Product.find({$and:[{_id: req.params.id},{seller: req.user._id} ]}, cb);
			 },
			},
			function(err, results){

				if(results.product != null)
				{
					res.render('seller/product/product-view',results);
				}
				else {
					res.redirect('/seller');
				}

		});

});

// Product Edit Page
router.get('/seller/product/edit/:id', ensureSeller, function(req, res){

	async.parallel({
			product: function(cb){
			  Product.findOne({$and:[{_id: req.params.id},{seller: req.user._id} ]}, cb);
			 },
			brands: function(cb){
				Brand.find({}, cb);
			 },
			categories: function(cb){
				Category.find({}, cb);
			 },
		  },
      function(err, results){

				if(results.product != null)
				{
					res.render('seller/product/product-edit',results);
				}
				else {
					res.redirect('/seller');
				}

		 });

	});

// Product Delete Page
router.get('/seller/product/delete/:id', ensureSeller, function(req, res){

      var pid = req.params.id;

      Product.findOne({$and:[{_id: req.params.id},{seller: req.user._id} ]}).remove(function(){

        rimraf('./public/uploads/products/'+pid, function(err) {

        });

        req.flash('success_msg', 'Product Deleted Successfully!');
        res.redirect('/seller/products');
      });


    });


// Add Product
router.post('/seller/product/add', ensureSeller, function(req, res){

					var id = zen_id.generate().toUpperCase();
                  	var name = req.body.name;
                  	var brand = req.body.brand;
                  	var gender = req.body.gender;
				  	var description = req.body.description;
				  	var short_description = req.body.short_description;
                  	var sku = req.body.sku;
					var status = req.body.status;
                  	var category = req.body.category;
                  	var size = req.body.size;
                  	var seller = req.user._id;
                  	var retail = req.body.retail;
                  	var sale = req.body.sale;
                  	var stock = req.body.stock;
					var weight = req.body.weight;
					var length = req.body.length;
					var breadth = req.body.breadth;
					var height = req.body.height;


			                               var newProduct = new Product ({
                                                            _id: id,
															name: name,
															brand: brand,
															sku: sku,
															category: category,
															size: size,
															seller: seller,
															status: status,
															gender: gender,
															pricing: {
																	retail: retail,
																	sale: sale,
																	stock: stock
															},
															details: {
																	description: description,
																	short_description: short_description
															},
															shipping: {
																  weight: weight,
																	length: length,
																	breadth: breadth,
																	height: height
															},
												});


											newProduct.save(function(err){
												if (err)
												{
													req.flash('error_msg', 'Something went Wrong!');
													res.redirect('/seller/product/add');
												}
												else
												{
                                                	req.flash('success_msg', 'Product Added Successfully!');
			                                    	res.redirect('/seller/product/edit/'+id);
												}

			                                });
								



    });

// Edit Product
router.post('/seller/product/edit/:id', ensureSeller, function(req, res){

          var id = req.params.id;

	   Product.findOne({_id : req.params.id}, function (err, product){


                 // Update found product
								product.name = req.body.name;
								product.brand = req.body.brand;
								product.details.description = req.body.description;
								product.details.short_description = req.body.short_description;
								product.sku = req.body.sku;
								product.status = req.body.status;
								product.gender = req.body.gender;
								product.category = req.body.category;
								product.size = req.body.size;
								product.pricing.retail = req.body.retail;
							    product.pricing.sale = req.body.sale;
								product.pricing.stock = req.body.stock;
								product.shipping.weight = req.body.weight;
								product.shipping.length = req.body.length;
								product.shipping.breadth = req.body.breadth;
								product.shipping.height = req.body.height;


									product.save(function(err) {

												if (err)
												{
													req.flash('error_msg', 'Something went Wrong!');
													res.redirect('/seller/product/add');
												}
												else
												{
                                                	req.flash('success_msg', 'Product Updated Successfully!');
			                                    	res.redirect('/seller/product/edit/'+id);
												}

							        });


         });
    });

// Add Product Image

router.post('/seller/product/upload/:id', ensureSeller, function(req, res){

  var id = req.params.id;
  var dir = './public/uploads/products/'+id;
  var date = Date.now();

  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, dir);
    },
    filename: function (req, file, callback) {
      callback(null, file.fieldname + '-' + date + '.jpg');
    }
  });
  var upload = multer({ storage : storage}).single('product_image');



     image = "product_image" + "-" + date + ".jpg";


 

        upload(req, res, function (err) {
             if (err) {
               console.log(err)
               return
             }
             else{}

                // Everything went fine
              });

         Product.findByIdAndUpdate({_id:id},
        {$push: {"image": {img: image}}},
        {safe: true, upsert: true, new : true},
        function(err, model) {
  
          if (err)
          {
            // Redirect back to brands
            res.redirect('/error');
          }
          else
          {
            // Redirect back to edit product
            req.flash('success_msg', 'Product Image Added Successfully!');
            res.redirect('/seller/product/edit/'+id);
          }
        });

         
  });

// Delete Product Image
router.get('/seller/product/deleteimage/:id/:pimg', ensureSeller, function(req, res){

    var id = req.params.id;
    var pimg = req.params.pimg;


    Product.findByIdAndUpdate({_id:id},
        {$pull: {"image": {img: pimg}}},
        {safe: true, upsert: true, new : true},
        function(err, model) {

       fs.unlink('./public/uploads/products/'+id+"/"+pimg, function(err) {
  
          if (err)
          {
            // Redirect back to brands
            res.redirect('/error');
          }
          else
          {
            // Redirect back to edit product
            req.flash('success_msg', 'Product Image Deleted Successfully!');
            res.redirect('/seller/product/edit/'+id);
          }

        });

    });


  });

/***********************************************************************************

Account Start

************************************************************************************/

router.get('/seller/account',ensureSeller,function(req,res){

  res.render('seller/account',{cart: req.session.cart});


});

router.get('/seller/account/edit',ensureSeller,function(req,res){

  res.render('seller/account-edit',{cart: req.session.cart});


});

router.get('/seller/account/change-password',ensureSeller,function(req,res){

  res.render('seller/account-change-password',{cart: req.session.cart});


});

// Edit Userlist
router.post('/seller/account/edit', ensureSeller, function(req, res){

  Userlist.findOne({_id : req.user._id}, function (err, userlist){

                userlist.company = req.body.company;
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
              res.redirect('/seller/account');
            }

            else
            {
              req.flash('success_msg', 'User Updated Succesfully!');
              res.redirect('/seller/account');

            }

              
          });


        });

    });


// Change Password

router.post('/seller/account/change-password', ensureSeller, function(req, res){

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
              res.redirect('/seller/account');

            }
            else
            {

              password.save(function(err){

              if (err)
              {
                req.flash('error_msg', 'Something went Wrong!');
                res.redirect('/seller/account');
              } 
              else
              {
                
                req.flash('success_msg', 'Password Changed Successfully!');
                req.logout();
                res.redirect('/seller');
                
              } 

              });

            }
            

            });

        }
        else
        {
          req.flash('error_msg', 'Wrong Current Password');
              res.redirect('/seller/account');        }

       });
            
    });   

  });


module.exports = router;
