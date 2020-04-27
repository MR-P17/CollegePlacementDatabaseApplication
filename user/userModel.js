var mongoose = require('mongoose');
//   bcrypt = require('bcryptjs');

var userSchema = new mongoose.Schema({
  email: {
      type:String,
      required:true,
      unique:true
  },
  pw: {
      type:String,
      required:true
  }
});

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.pw);
    // return (password === this.pw);
};

module.exports = mongoose.model('real_users', userSchema);