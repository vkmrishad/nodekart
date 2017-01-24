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

function ensureAdmin(req, res, next){
	if(req.isAuthenticated()){
	  if (req.user.role == 'admin')
	  {	
		return next();
	  }
	  else {

	  	req.logout();
		res.redirect('/admin');
	   }

	} 
	else {
		res.redirect('/admin');
	}
}

/***********************************************************************************

Index Start

************************************************************************************/


// Register
router.get('/admin/register', function(req, res){

	if(!req.isAuthenticated()){
	
       res.render('admin/register');
      }

      else
      {
      	res.redirect('/admin/dashboard');
      }


});

// Login
router.get('/admin/', function(req, res){


      if(!req.isAuthenticated()){
	
       res.render('admin/login');
      }

      else
      {
      	res.redirect('/admin/dashboard');
      }

});

// Brand Page
router.get('/admin/404', function(req, res){
	res.render('admin/404');
});

// Dashboard Page
router.get('/admin/dashboard', ensureAdmin, function(req, res){
	res.render('admin/dashboard');
});

// Product Page
router.get('/admin/product', ensureAdmin, function(req, res){
	res.redirect('/admin/products');
});

// User Page
router.get('/admin/user', ensureAdmin, function(req, res){
	res.redirect('/admin/users');
});

// Category Page
router.get('/admin/category', ensureAdmin, function(req, res){
	res.redirect('/admin/categories');
});

// Brand Page
router.get('/admin/brand', ensureAdmin, function(req, res){
	res.redirect('/admin/brands');
});

// Brand Page
router.get('/admin/test', function(req, res){

Product.findOne({_id: "ED2592812E"},function(error, prod) {

  	Category.findOne({_id:prod.category_id},function(err,category){


    console.log(category.category_name);
    
        res.render('admin/test',{"prod":prod});
        });
        
      });
	
});

// Register Userlist
router.post('/admin/register', function(req, res){
	var id = zen_id.generate().toUpperCase();
	var salt = bcrypt.genSaltSync(10);
	var hash = bcrypt.hashSync(req.body.password, salt);
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = hash;
	var role = "admin";
	var status = "Active";


		var newUser = new Userlist({
			_id:id,
			fname: name,
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
				res.redirect('/admin');
				console.log(err);
				}
				else
				{
                req.flash('success_msg', 'You are Successfully Registered!');
			    res.redirect('/admin');
				}
		});		

});

passport.use('authAdminWeb', new LocalStrategy(
  function(username,password, done) {
   Userlist.getAdminByUsername(username, function(err, admin){
   	if(err) throw err;
   	if(!admin){
   		return done(null, false, {message: 'Invalid Username or Email'});
   	}

   	Userlist.comparePassword(password, admin.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, admin);
   		} else {
   			return done(null, false, {message: 'Invalid password'});
   		}
   	});
   });
 }));

passport.serializeUser(function(admin, done) {
  done(null, admin._id);
});

passport.deserializeUser(function(id, done) {
  Userlist.getAdminById(id, function(err, admin) {
    done(err, admin);
  });
});


router.post('/admin',
  passport.authenticate('authAdminWeb', {successRedirect:'/admin/dashboard', failureRedirect:'/admin',failureFlash: true}),
  function(req, res) {
    res.redirect('/admin/dashboard');
  });

router.get('/admin/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('/admin');
});






/***********************************************************************************

Product Start

************************************************************************************/


// Product's Page
router.get('/admin/products', ensureAdmin, function(req, res){

      Product.find({}, function(err, products) {

         if (err) throw err;

        res.render('admin/product/products',{"products":products});

      });

});

// Product Add Page
router.get('/admin/product/add', ensureAdmin, function(req, res){

		async.parallel({
				brands: function(cb){
					Brand.find({}, cb);
				},
				categories: function(cb){
					Category.find({}, cb);
				}
			}, function(err, results){
				res.render('admin/product/product-add', results);
			});

    });

// Product View Page
router.get('/admin/product/view/:id', ensureAdmin, function(req, res){

	async.parallel({
			product: function(cb){
				Product.findOne({_id: req.params.id}, cb);
			 },
			products: function(cb){
				Product.find({_id: req.params.id}, cb);
			 },
			},
			function(err, results){

				if(results.product != null)
				{
					res.render('admin/product/product-view',results);
				}
				else {
					res.redirect('/admin');
				}

		});

});

// Product Edit Page
router.get('/admin/product/edit/:id', ensureAdmin, function(req, res){

	async.parallel({
			product: function(cb){
			  Product.findOne({_id: req.params.id}, cb);
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
					res.render('admin/product/product-edit',results);
				}
				else {
					res.redirect('/admin');
				}

		 });

	});

// Product Delete Page
router.get('/admin/product/delete/:id', ensureAdmin, function(req, res){

      var pid = req.params.id;

      Product.findOne({_id : req.params.id}).remove(function(){

        rimraf('./public/uploads/products/'+pid, function(err) {

        });

        req.flash('success_msg', 'Product Deleted Successfully!');
        res.redirect('/admin/products');
      });


    });


// Add Product
router.post('/admin/product/add', ensureAdmin, function(req, res){

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
													res.redirect('/admin/product/add');
												}
												else
												{
                                                	req.flash('success_msg', 'Product Added Successfully!');
			                                    	res.redirect('/admin/product/edit/'+id);
												}

			                                });
								



    });

// Edit Product
router.post('/admin/product/edit/:id', ensureAdmin, function(req, res){

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
													res.redirect('/admin/product/add');
												}
												else
												{
                                                	req.flash('success_msg', 'Product Updated Successfully!');
			                                    	res.redirect('/admin/product/edit/'+id);
												}

							        });


         });
    });

// Add Product Image

router.post('/admin/product/upload/:id', ensureAdmin, function(req, res){

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
            res.redirect('/admin/product/edit/'+id);
          }
        });

         
  });

// Delete Product Image
router.get('/admin/product/deleteimage/:id/:pimg', ensureAdmin, function(req, res){

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
            res.redirect('/admin/product/edit/'+id);
          }

        });

    });


  });



/***********************************************************************************

Brand Start

************************************************************************************/


// Brand's Page
router.get('/admin/brands', ensureAdmin, function(req, res){

      Brand.find({}, function(err, brands) {

         if (err) throw err;

  // object of all the brands
        res.render('admin/brand/brands',{"brands":brands});
      });

});

// Brand Add Page
router.get('/admin/brand/add', ensureAdmin, function(req, res){

        res.render('admin/brand/brand-add');

    });

// Brand View Page
router.get('/admin/brand/view/:id', ensureAdmin, function(req, res){

        Brand.findOne({_id: req.params.id}, function(err, brand) {

        	if(brand != null)
				{
					res.render('admin/brand/brand-view',{"brand": brand});
				}
				else {
					res.redirect('/admin');
				}
        

        });
    });

// Brand Edit Page
router.get('/admin/brand/edit/:id', ensureAdmin, function(req, res){
	
	Brand.findOne({_id: req.params.id}, function(err, brand) {

		if(brand != null)
				{
					res.render('admin/brand/brand-edit',{"brand": brand});
				}
				else {
					res.redirect('/admin');
				}
		    

	});

 });



// Brand Delete Page
router.get('/admin/brand/delete/:id', ensureAdmin, function(req, res){


      Brand.findOne({_id : req.params.id}, function(err,logo){

      	var img = logo.brand_img;

        Brand.findOne({_id : req.params.id}).remove(function(){

          rimraf('./public/uploads/brands/'+img, function(err) {

          });

        });

        req.flash('success_msg', 'Brand Deleted Successfully!');
        res.redirect('/admin/brands');
      });

  });


// Add Brand
router.post('/admin/brand/add', ensureAdmin, function(req, res){

                  var id = zen_id.generate().toUpperCase();
                  var brand_name = req.body.brand_name;
                  var brand_slug = req.body.brand_slug;


			
							 var newBrand = new Brand ({
                                                _id: id,
												brand_name: brand_name,
												brand_slug: brand_slug

			                        });

							newBrand.save(function(err){

			                        if (err)
									{
										req.flash('error_msg', 'Brand already Exists!');
				                    	res.redirect('/admin/brand/add');
									}
									else
									{
										req.flash('success_msg', 'Brand Added Succesfully!');
				                    	res.redirect('/admin/brand/edit/'+id);
									}
			                });
				



    });

// View Brand
router.post('/admin/brand/edit/:id', ensureAdmin, function(req, res){

	var id = req.params.id;

  					Brand.findOne({_id : req.params.id}, function (err, brand){



					brand.brand_name = req.body.brand_name;
					brand.brand_slug = req.body.brand_slug;


					brand.save(function(err) {

						if (err)
						{
							req.flash('error_msg', 'Brand name or slug already Exists!');
							res.redirect('/admin/brand/edit/'+id);
							
						}
						else
						{
							req.flash('success_msg', 'Brand Updated Succesfully!');
							res.redirect('/admin/brand/edit/'+id);
         			    }

		    	});

       });
   });


// Add Logo

router.post('/admin/brand/upload/:id', ensureAdmin, function(req, res){

  var id = req.params.id;
  var dir = './public/uploads/brands';
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
  var upload = multer({ storage : storage}).single('brand_img');


                Brand.findOne({_id : req.params.id}, function (err, logo){

                var img = logo.brand_img;	
          
                logo.brand_img = "brand_img" + "-" + date + ".jpg";


				upload(req, res, function (err) {
                if (err) {
                 console.log(err)
                return
                }
                else{}

                // Everything went fine
                });


        	fs.unlink('./public/uploads/brands/'+img, function(err) {

              logo.save(function(err){
        		if (err)
          		{
           			req.flash('error_msg', 'Something went Wrong!');
           	 		res.redirect('/admin/brand/edit/'+id);
          		}	
          		else
          		{
            		req.flash('success_msg', 'Logo Added Successfully!');
            		res.redirect('/admin/brand/edit/'+id);
          		}	

              });
            });	


         });

  });

// Delete Logo

router.get('/admin/brand/deleteimage/:id/:pimg', ensureAdmin, function(req, res){

    var id = req.params.id;
    var img = req.params.pimg;

    Brand.findOne({_id : req.params.id}, function(err,logo){

    	logo.brand_img = "";

        fs.unlink('./public/uploads/brands/'+img, function(err) {

            logo.save(function(err){
        		if (err)
          		{
           			req.flash('error_msg', 'Something went Wrong!');
           	 		res.redirect('/admin/brand/edit/'+id);
          		}	
          		else
          		{
            		req.flash('success_msg', 'Logo Deleted Successfully!');
            		res.redirect('/admin/brand/edit/'+id);
          		}	

            });
        });
    });    


  });

/***********************************************************************************

Account Start

************************************************************************************/

router.get('/admin/account',ensureAdmin,function(req,res){

  res.render('admin/account',{cart: req.session.cart});


});

router.get('/admin/account/edit',ensureAdmin,function(req,res){

  res.render('admin/account-edit',{cart: req.session.cart});


});

router.get('/admin/account/change-password',ensureAdmin,function(req,res){

  res.render('admin/account-change-password',{cart: req.session.cart});


});

// Edit Userlist
router.post('/admin/account/edit', ensureAdmin, function(req, res){

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
              res.redirect('/admin/account');
            }

            else
            {
              req.flash('success_msg', 'User Updated Succesfully!');
              res.redirect('/admin/account');

            }

              
          });


        });

    });


// Change Password

router.post('/admin/account/change-password', ensureAdmin, function(req, res){

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
              res.redirect('/admin/account');

            }
            else
            {

              password.save(function(err){

              if (err)
              {
                req.flash('error_msg', 'Something went Wrong!');
                res.redirect('/admin/account');
              } 
              else
              {
                
                req.flash('success_msg', 'Password Changed Successfully!');
                req.logout();
                res.redirect('/admin');
                
              } 

              });

            }
            

            });

        }
        else
        {
          req.flash('error_msg', 'Wrong Current Password');
              res.redirect('/admin/account');        }

       });
            
    });   

  });


/***********************************************************************************

User Start

************************************************************************************/


// Userlist's Page
router.get('/admin/users', ensureAdmin, function(req, res){

      Userlist.find({}, function(err, userlists) {

         if (err) throw err;
  
        res.render('admin/user/users',{"userlists":userlists});

      });

});

// Userlist Add Page
router.get('/admin/user/add', ensureAdmin, function(req, res){


        res.render('admin/user/user-add');

    });

// Userlist View Page
router.get('/admin/user/view/:id', ensureAdmin, function(req, res){

        Userlist.findOne({_id: req.params.id}, function(err, userlist) {

        	if(userlist != null)
				{
					res.render('admin/user/user-view',{"userlist": userlist});
				}
				else {
					res.redirect('/admin');
				}

        });
    });

// Userlist Edit Page
router.get('/admin/user/edit/:id', ensureAdmin, function(req, res){

		    Userlist.findOne({_id: req.params.id}, function(err, userlist) {

		    	if(userlist != null)
				{
					res.render('admin/user/user-edit',{"userlist": userlist});
				}
				else {
					res.redirect('/admin');
				}
		    

		    });
		});


// Userlist Delete Page
router.get('/admin/user/delete/:id', ensureAdmin, function(req, res){

      Userlist.findOne({_id : req.params.id}, function(err,avatar){

        var img = avatar.avatar;

        Userlist.findOne({_id : req.params.id}).remove(function(){

          rimraf('./public/uploads/users/'+img, function(err) {

          });

        });

        req.flash('success_msg', 'User Deleted Successfully!');
        res.redirect('/admin/users');
      });

});


// Add Userlist
router.post('/admin/user/add', ensureAdmin, function(req, res){

				  var id = zen_id.generate().toUpperCase();
	              var salt = bcrypt.genSaltSync(10);
				  var hash = bcrypt.hashSync(req.body.cpassword, salt);
				  var fname = req.body.fname;
				  var mname = req.body.mname;
				  var lname = req.body.lname;
                  var username = req.body.username;
                  var email = req.body.email;
                  var password = hash;
                  var address1 = req.body.address1;
                  var address2 = req.body.address2;
                  var address3 = req.body.address3;
                  var place = req.body.place;
                  var landmark = req.body.landmark;
                  var district = req.body.district;
                  var state = req.body.state;
                  var country = req.body.country;
                  var pin = req.body.pin;
                  var lnumber = req.body.lnumber;
                  var mnumber = req.body.mnumber;
                  var status = req.body.status;
                  var role = req.body.role;


           				var newUserlist = new Userlist ({
           					    _id:id,
								fname:fname,
								lname:lname,
								mname:mname,
								username:username,
								email:email,
								password:password,
								address1:address1,
								address2:address2,
								address3:address3,
								place:place,
								landmark:landmark,
								district:district,
								state:state,
								country:country,
								pin:pin,
								lnumber:lnumber,
								mnumber:mnumber,
								status:status,
								role:role,

			                    });

			newUserlist.save(function(err) {

			if (err)
            {
              req.flash('error_msg', 'Something went Wrong / Username and Email already Exists!');
              res.redirect('/admin/user/add');
            }

            else
            {
              req.flash('success_msg', 'User Added Succesfully!');
              res.redirect('/admin/user/edit/'+id);

            }

							
			});





    });

// Edit Userlist
router.post('/admin/user/edit/:id', ensureAdmin, function(req, res){

	Userlist.findOne({_id : req.params.id}, function (err, userlist){

				id = req.params.id;
          
                userlist.fname = req.body.fname;
                userlist.lname = req.body.lname;
                userlist.mname = req.body.mname;
                userlist.status = req.body.status;
                userlist.username = req.body.username;
                userlist.email = req.body.email;
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
                userlist.role = req.body.role;



			userlist.save(function(err) {

			if (err)
            {
              req.flash('error_msg', 'Something went Wrong / Username and Email already Exists!');
              res.redirect('/admin/user/edit/'+id);
            }

            else
            {
              req.flash('success_msg', 'User Updated Succesfully!');
              res.redirect('/admin/user/edit/'+id);

            }

							
			});


         });
    });


// Change Password

router.post('/admin/user/changepassword/:id', ensureAdmin, function(req, res){

    var id = req.params.id;
    var salt = bcrypt.genSaltSync(10);
	var hash = bcrypt.hashSync(req.body.cpassword, salt);

    Userlist.findOne({_id : req.params.id}, function(err,password){

    	    password.password = hash;

            password.save(function(err){
        		if (err)
          		{
           			req.flash('error_msg', 'Something went Wrong!');
           	 		res.redirect('/admin/user/edit/'+id);
          		}	
          		else
          		{
            		req.flash('success_msg', 'Password Changed Successfully!');
            		res.redirect('/admin/user/edit/'+id);
          		}	

            });

    });    


  });


// Add Avatar

router.post('/admin/user/upload/:id', ensureAdmin, function(req, res){

  var id = req.params.id;
  var dir = './public/uploads/users';
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
  var upload = multer({ storage : storage}).single('avatar');


                Userlist.findOne({_id : req.params.id}, function (err, avatar){

                var img = avatar.avatar;	
          
                avatar.avatar = "avatar" + "-" + date + ".jpg";


				upload(req, res, function (err) {
                if (err) {
                 console.log(err)
                return
                }
                else{}

                // Everything went fine
                });


        	fs.unlink('./public/uploads/users/'+img, function(err) {

              avatar.save(function(err){
        		if (err)
          		{
           			req.flash('error_msg', 'Something went Wrong!');
           	 		res.redirect('/admin/user/edit/'+id);
          		}	
          		else
          		{
            		req.flash('success_msg', 'Avatar Added Successfully!');
            		res.redirect('/admin/user/edit/'+id);
          		}	

              });
            });	


         });

  });

// Delete Avatar

router.get('/admin/user/deleteimage/:id/:pimg', ensureAdmin, function(req, res){

    var id = req.params.id;
    var img = req.params.pimg;

    Userlist.findOne({_id : req.params.id}, function(err,avatar){

    	avatar.avatar = "";

        fs.unlink('./public/uploads/users/'+img, function(err) {

            avatar.save(function(err){
        		if (err)
          		{
           			req.flash('error_msg', 'Something went Wrong!');
           	 		res.redirect('/admin/user/edit/'+id);
          		}	
          		else
          		{
            		req.flash('success_msg', 'Avatar Deleted Successfully!');
            		res.redirect('/admin/user/edit/'+id);
          		}	

            });
        });
    });    


  });


/***********************************************************************************

Category Start

************************************************************************************/


// Category's Page
router.get('/admin/categories', ensureAdmin, function(req, res){

      Category.find({}, function(err, categories) {

         if (err) throw err;

  // object of all the categories
        res.render('admin/category/categories',{"categories":categories});
      });

});

// Category Add Page
router.get('/admin/category/add', ensureAdmin, function(req, res){

        res.render('admin/category/category-add');

    });

// Category View Page
router.get('/admin/category/view/:id', ensureAdmin, function(req, res){

        Category.findOne({_id: req.params.id}, function(err, category) {

				 if(category != null)
 				 {
 			     res.render('admin/category/category-view',{"category": category});
 		     }
 				 else {
 				 	 res.redirect('/admin');
 				 }

        });
    });

// Category Edit Page
router.get('/admin/category/edit/:id', ensureAdmin, function(req, res){

	async.parallel({
			category: function(cb){
				Category.findOne({_id: req.params.id}, cb);
			 }
			},
			function(err, results){

				 if(results.category != null)
				 {
			     res.render('admin/category/category-edit',results);
		     }
				 else {
				 	 res.redirect('/admin');
				 }

		 });

 });


// Category Delete Page
router.get('/admin/category/delete/:id', ensureAdmin, function(req, res){

      Category.findOne({_id : req.params.id}).remove(function(){

				req.flash('success_msg', 'Category Deleted Succesfully!');
				res.redirect('/admin/categories');});

  });

// Add Category
router.post('/admin/category/add', ensureAdmin, function(req, res){

									var id = zen_id.generate().toUpperCase();
                                    var category_name = req.body.category_name;
                                    var category_slug = req.body.category_slug;



								var newCategory = new Category ({
									_id:id,
			                        category_name: category_name,
			                        category_slug: category_slug,

			                    });


								newCategory.save(function(err){

			                    if (err)
									{
										req.flash('error_msg', 'Category already Exists!');
				                    	res.redirect('/admin/category/add');
									}
									else
									{
										req.flash('success_msg', 'Category Added Succesfully!');
				                    	res.redirect('/admin/category/edit/'+id);
									}

			                });


    });

// View Category
router.post('/admin/category/edit/:id', ensureAdmin, function(req, res){

        	   var id = req.params.id;

  					Category.findOne({_id : req.params.id}, function (err, category){


					 // Update found category
					category.category_name = req.body.category_name;
					category.category_slug = req.body.category_slug;


					category.save(function(err) {

						if (err)
						{
							req.flash('error_msg', 'Category name or slug already Exists!');
							res.redirect('/admin/category/edit/'+id);
							
						}
						else
						{
							req.flash('success_msg', 'Category Updated Succesfully!');
							res.redirect('/admin/category/edit/'+id);
         			    }

		    	});

       });
  });







module.exports = router;
