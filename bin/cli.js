var chalk = require('chalk'),
    path = require('path'),
    mversion = require('../'),
    thisVersion = require('../package.json').version,
    usage = require('cli-usage');

usage(__dirname + '/usage.md');

var defaultMessage = "v%s";

module.exports = function (argv, loggers, processCallback) {
  if (typeof loggers === 'function' || !loggers) {
    processCallback = loggers;
    loggers = {};
  }
  var logger = loggers.logger || console.log.bind(console);
  var errorLogger = loggers.errorLogger || console.error.bind(console);

  processCallback = processCallback || function () { };

  var parsedArguments = require('minimist')(argv, {
    'string': ['t', 'tag'],
    'boolean': ['n']
  });

  if (argv.length === 0) {
    return get();
    return;
  }

  return update();

  function get() {
    mversion.get(function (err, data) {
      if (err) {
        errorLogger(chalk.red(err.message));
      }

      for(file in data) {
        if (data[file]) {
          logger(chalk.green(file) + ': ' + chalk.yellow(data[file]));
        }
      }

      if (err) processCallback(err);
    });
  }

  function update () {
    var updateOptions = {
      version: parsedArguments._[0],
      noPrefix: !!parsedArguments.n || parsedArguments.prefix === false
    };

    if (isArgumentPassed('v', 'version')) {
      logger('mversion v' + thisVersion);
      return processCallback();
    }

    // Check for git:
    if (isArgumentPassed('m')) {
      updateOptions.commitMessage =
        parsedArguments.m === true
          ? defaultMessage
          : parsedArguments.m;
    }

    // Check for overriding tag name
    if (isArgumentPassed('t', 'tag')) {
      updateOptions.tagName = parsedArguments.t || parsedArguments.tag;
    }

    mversion.update(updateOptions, function (err, data) {
      if (err) {
        errorLogger(chalk.red('Failed updating:'));

        if (!data) {
          errorLogger(err.message);
        } else {
          errorLogger(constructError(
            err.message,
            data.updatedFiles,
            updateOptions.commitMessage,
            updateOptions.noPrefix,
            data.newVersion
          ));
        }
        return processCallback(err);
      }

      if (data && data.newVersion) {
        logger(chalk.green('Updated to new version: ') + chalk.yellow('v' + data.newVersion));
        logger(data.message);
      }
    });
  }

  function isArgumentPassed () {
    var args = Array.prototype.slice.apply(arguments);
    for(var i = 0, len = args.length; i < len; i++) {
      if (!!parsedArguments[args[i]]) {
        return true;
      }
    }
    return false;
  }
};

function constructError (errors, files, commitMessage, isNoPrefix, updatedVersion) {
  var commitFlag = commitMessage ? '-m "' + commitMessage + '"' : '';
  var noPrefixFlag = isNoPrefix ? '--no-prefix' : '';

  var ret = 'Some files contains errors:\n';

  ret += chalk.red(errors);

  if (files && files.length) {
    ret += '\n\nOther files (' + files.map(function (file) {
          return chalk.green(path.basename(file));
        }).join(', ') + ') got updated to version ' + chalk.yellow('v' + updatedVersion) + '.\n\n';
  }

  if (!!commitMessage) {
    ret += '\nThe changes were not commited, as there were errors.\n';
  }

  ret += 'Fix erros and try again to synchronize:\n';
  ret += chalk.bold(chalk.yellow(['$ mversion', updatedVersion, commitFlag, noPrefixFlag].join(' ')));
  return ret;
}
