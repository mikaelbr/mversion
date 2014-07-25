var chalk = require('chalk');

var message = [
  chalk.bold(chalk.green("Usage:")) + chalk.yellow(" mversion [ <newversion> | major | minor | patch | prerelease ] [ -m <optional message> ] [ -n | --no-prefix ]"),
  chalk.underline("(run in package dir) - (Also supports premajor, preminor and prepatch, see semver summary)"),

  "",
  "Update module version in either one or all of package.json,",
  "component.json, bower.json, manifest.json and *.jquery.json.",

  "",
  "Run without arguments to get current version.",
  "",

  chalk.bold(chalk.green("# Semver Summary")),
  "Given a version number " + chalk.yellow("MAJOR.MINOR.PATCH") + ", increment the:",
  "- " + chalk.yellow("MAJOR") + " version when you make incompatible API changes,,",
  "- " + chalk.yellow("MINOR") + " version when you add functionality in a backwards-compatible manner, and,",
  "- " + chalk.yellow("PATCH") + " version when you make backwards-compatible bug fixes.,",
  "Additional labels for pre-release and build metadata are available as extensions to the " + chalk.yellow("MAJOR.MINOR.PATCH") + " format.,",
  "",

  chalk.bold(chalk.green("# Update version")),
  "Update version by defining new semver valid version ",
  "or a release string (major, minor, patch, build).",
  "--",
  "Ex: \"mversion minor\"",
  "Ex: \"mversion 1.0.1-beta\"",
  "--",
  "",

  chalk.bold(chalk.green("# Git")),
  "Use " + chalk.yellow("-m") + " to auto commit and tag. Apply optional message and ",
  "use '" + chalk.magenta("%s") + "' as placeholder for the updated version. Default ",
  "message is 'v" + chalk.magenta("%s") + "' where " + chalk.magenta("%s") + " is replaced with new version.",
  "",

  chalk.yellow("--tag") + " (or " + chalk.yellow("-t") + " for short) allows for overriding the tag name used. This does not",
  "change behaviour of the message, just the tag name. As with " + chalk.yellow("-m") + ", all occurances of " + chalk.magenta("%s"),
  "is replaced with the newly bumped version.",
  "",

  chalk.yellow("--no-prefix") + " (or " + chalk.yellow("-n") + " for short) is a short hand for setting",
  "a tag name without v as prefix. This does not change behaviour of",
  "the message, just the tag name.",
  "",
  "--",
  "Ex: \"mversion minor -m\"",
  "Ex: \"mversion minor -m 'Bumped to v%s' --tag 'v%s-src'\"",
  "--",
  ""
].join("\n");

module.exports.log = function (logger) {
  logger = logger || console.log.bind(console);
  logger(message);
};

module.exports.text = message;