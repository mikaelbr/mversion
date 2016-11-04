var spawn = require('child_process').spawn;

module.exports.run = function (script, cb) {
  var process = spawn(script, {
    cwd: process.cwd()
  });

  process.stdout.on('data', function (data) {
    console.log(data);
  });

  process.stderr.on('data', function (data) {
    console.error(data);
  });

  return process.on('close', function (code) {
    cb(code)
  });
};