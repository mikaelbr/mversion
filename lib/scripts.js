var exec = require('child_process').exec;

module.exports.run = function (script, cb) {
  return exec(script, {
    cwd: process.cwd()
  }, cb);
};