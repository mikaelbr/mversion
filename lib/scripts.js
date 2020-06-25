var spawn = require('child_process').spawn;

module.exports.run = function (script, cb) {
  var proc = spawn(script, {
    cwd: process.cwd()
  });

  proc.stdout.on('data', function (data) {
    console.log(data);
  });

  proc.stderr.on('data', function (data) {
    console.error(data);
  });

  return proc.on('close', function (code) {
    cb(code)
  });
};