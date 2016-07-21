var mobile = require('../controllers/switch_mobile');

module.exports = function(app){
  app.use('/', mobile);
};
