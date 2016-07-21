var auth = require('../controllers/auth/auth');
var users = require('../controllers/users');
var ranking = require('../controllers/ranking');
var monthly = require('../controllers/monthly');
var reviews = require('../controllers/reviews');
var search = require('../controllers/search');
var contact = require('../controllers/contact');
var support = require('../controllers/support');

module.exports = function(app){
  //app.use('/reviews', reviews);
  //app.use('/search', search);
  //app.use('/auth', auth);
  //app.use('/', ranking);
  app.use('/monthly', monthly);
  app.use('/users', users);
  app.use('/ranking', ranking);
  app.use('/contact', contact);
  app.use('/support', support);
};
