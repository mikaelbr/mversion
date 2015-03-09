mversion - A cross packaging manager module version handler/bumper
===

[![npm](https://img.shields.io/npm/v/mversion.svg?style=flat)](https://npmjs.com/package/mversion) [![Travis](https://img.shields.io/travis/mikaelbr/mversion.svg?style=flat)](https://travis-ci.org/mikaelbr/mversion) [![Gemnasium](https://img.shields.io/gemnasium/mikaelbr/mversion.svg?style=flat)](https://gemnasium.com/mikaelbr/mversion)

Imitates [```npm version```](https://npmjs.org/doc/version.html) to
also work on other packaging files. For those times you have either
have multiple packaging files (like ```bower.json```, ```component.json```,
```manifest.json```) or just not a ```package.json``` file.
```mversion``` can easily bump your version and optionally commit and create a tag.

## `mversion` file support
- `package.json`
- `npm-shrinkwrap.json`
- `component.json`
- `bower.json`
- `manifest.json`
- `*.jquery.json` (jquery plugin files, e.g `plugin.jquery.json`)

## Usage CLI

```shell
npm install -g mversion
```

### Examples

```shell
$ mversion patch
New Version: 0.0.6
Updated package.json
Updated component.json
```

```shell
$ mversion 0.0.5 -m
New Version: 0.0.5
Updated package.json
Updated component.json
Updated manifest.json
Commited to git and created tag v0.0.5
```

```shell
$ mversion 1.0.0-rc1 -m "Now in wopping v%s"
New Version: 1.0.0-rc1
Updated package.json
Updated component.json
Commited to git and created tag v1.0.0-rc1
```

### Help

```shell
$ mversion -h

Usage: mversion [ <newversion> | major | minor | patch | prerelease ] [ -m <optional message> ] [ -n | --no-prefix ]
(run in package dir) - (Also supports premajor, preminor and prepatch, see semver summary)

Update module version in either one or all of package.json,
component.json, bower.json, manifest.json and *.jquery.json.
```

Run without arguments to get current version.

# Semver Summary
Given a version number MAJOR.MINOR.PATCH, increment the:
- MAJOR version when you make incompatible API changes,,
- MINOR version when you add functionality in a backwards-compatible manner, and,
- PATCH version when you make backwards-compatible bug fixes.,
Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.,

# Update version
Update version by defining new semver valid version
or a release string (major, minor, patch, build).
--
Ex: "mversion minor"
Ex: "mversion 1.0.1-beta"
--

# Git
Use -m to auto commit and tag. Apply optional message and
use '%s' as placeholder for the updated version. Default
message is 'v%s' where %s is replaced with new version.

--tag (or -t for short) allows for overriding the tag name used. This does not
change behaviour of the message, just the tag name. As with -m, all occurances of %s
is replaced with the newly bumped version.

--no-prefix (or -n for short) is a short hand for setting
a tag name without v as prefix. This does not change behaviour of
the message, just the tag name.

--
Ex: "mversion minor -m"
Ex: "mversion minor -m 'Bumped to v%s' --tag 'v%s-src'"
--

## Version aliases

If you are lazy you can also use aliases for the version release type.

```
mversion p
```

The full list of aliases:

```
"pa": "patch",
"pr": "prerelease",
"ma": "major",
"mi": "minor",
// one char might be controversial, but it saves key strokes
"m": "major",
"p": "patch",
"i": "minor"
```

## Default settings

Create a `.mversionrc` file in your root with default settings
as defined in the README.md of the project.
```

## Default Settings

You can provide default settings by creating a `.mversionrc` file
in the root of your project (or in a directory higher up in the hierarchy).
This way you can define project specific tag names or commit messages.

See API below to see what options are accepted.

### Example `.mversionrc`

```json
{
  "commitMessage": "Bumped to %s",
  "tagName": "v%s-src"
}
```

Now, when doing this in the Terminal:
```shell
$ mversion minor
```

would now be the same as doing:

```shell
mversion minor -m "Bumped to %s" -t "v%s-src"
```

**Note:** CLI arguments take precedence over default options.
So doing this (with the `.mversionrc` file as defined above):

```shell
mversion minor -m "Kicked version to %s"
```

Would leed to the commit message being `Kicked version to %s`,
and tag name to be `v%s-src`.

## Hooks

`.mversionrc` will also allow you to define hooks before (`preupdate`)
and after (`postupdate`) version is updated.

### Example

```json
{
  "scripts": {
    "preupdate": "echo 'Bumping version'",
    "precommit": "sh ./someHook.sh",
    "postcommit": "git push && git push --tags && npm publish",
    "postupdate": "echo 'Updated to version %s in manifest files'"
  }
}
```

If precommit fails (returns something other that `exit 0`) the commit will be
checked out (removing the version bump changes).

## Usage API

```shell
npm install mversion
```

```javascript
var mversion = require('mversion');

mversion.get(function (err, data) {
  /*
    data = {
      'package.json': VERSION,
      'component.json': VERSION
    }
  */
});

mversion.update('minor', function (err, data) { })
mversion.update('major', function (err, data) { })
mversion.update({
    version: 'major',
    commitMessage: 'Some commit message for version %s'
  }, function (err, data) { }) // Will commit/tag
mversion.update({
    version: 'major',
    commitMessage: 'Some commit message for version %s',
    noPrefix: true
  }, function (err, data) { }) // Make tag without v prefix
mversion.update('patch', function (err, data) { })
mversion.update('prerelease', function (err, data) { })
mversion.update({
    version: '0.0.1',
    commitMessage: 'Bumping version'
  }, function (err, data) { }) // Will commit/tag
mversion.update('v1.0.1', function (err, data) { })
mversion.update('v1.0.1-beta', function (err, data) { })
mversion.update('v1.0.1-010988', function (err, data) { })
```


### `mversion.get(callback(err, data))`
Get version of all the different package files. See example above.

### `mversion.update([options, ]callback(err, data))`
Update version of found package files.

Example of the `data` returned from the callback:

```json
{
  "newVersion": "1.0.0",
  "versions": { "package.json": "1.0."},
  "message": "Updated package.json",
  "updatedFiles": ["/mversion/example/package.json"]
}
```

Some times both `data` and `err` has values. In this case
some package files were updated and some not.

#### `options : Undefined`
If options is undefined a standard bump of `minor` will be used.

#### `options : String`
If options is a string, this string is used as the version bump.

Example:
```javascript
mversion.update('major')
```

#### `options.version : String`
Used to bump version. See above.

#### `options.commitMessage : String`
Used as message when creating commit in Git. Also used as message for
the annotated tag created. If undefined, no commit will be made.

Occurances of `%s` in commit message will be replaced with new version number.

Example:
```javascript
mversion.update({
  version: 'major',
  commitMessage: 'Bumps to version %s'
});
```

#### `options.tagName : String`
Default: `v%s`

Allows for overriding of tagName. For instance adding a suffix and
changeing tag to be named `v%s-src`.

__Will only take affect if commitMessage is defined.__

Occurances of `%s` in tag name will be replaced with new version number.

Example:
```javascript
mversion.update({
  version: 'major',
  commitMessage: 'Bumps to version %s',
  tagName: 'v%s-src'
});
// Might produce annotated tag named v1.0.0-src
```

#### `options.noPrefix : Boolean`
If true and commit message is defined, the annotated tag created
will not have 'v' as prefix. This is a short hand for defining
setting tag name to `%s`. Do not work if tag name is overriden
(`options.tagName` is defined).

Example:
```javascript
mversion.update({
  version: 'major',
  commitMessage: 'Bumps to version %s',
  noPrefix: true
});
// Might produce annotated tag named 1.0.0
```

This would be the same as:
```javascript
mversion.update({
  version: 'major',
  commitMessage: 'Bumps to version %s',
  tagName: '%s'
});
// Might produce annotated tag named 1.0.0
```

### `mversion.isPackageFile(filename) : Boolean`
Checks whether or not the given filename is a valid package file type.

Examples:
```javascript
assert.equal(mversion.isPackageFile('package.json'), true);
assert.equal(mversion.isPackageFile('component.json'), true);
assert.equal(mversion.isPackageFile('bower.json'), true);
assert.equal(mversion.isPackageFile('foobar.json'), false);
assert.equal(mversion.isPackageFile('foobar.jquery.json'), true);
assert.equal(mversion.isPackageFile('foojquery.json'), false);
```

## Changelog

### 1.9.0
1. Adds aliases for bumps (`p`, `m`, `i`) (#20)

### 1.8.0
1. Adds Composer support. (#19)

### 1.7.0
1. Replaces %s with `newVersion` in post scripts. Fixes #18

### 1.6.1
1. Adds support for git staging files with spaces. Fixes #17

### 1.6.0
1. Adds auto-updater to `mversion`.

### 1.5.0
1. Fixes issue with version bump being parsed as number and running string operations.
2. Improves error given on invalid version input
3. Bumps minimatch and semver to latest versions.

### 1.4.0
1. Adds pre-/postcommit hooks allowing for commands to be run before and after
   version bump git commit.

### 1.3.0
1. Adds `.mversionrc` file for defining default settings
2. Adds pre-/postupdate hooks allowing for commands to be run before and after version bump.
   Useful for instance for doing `npm publish` or `git push`.

### 1.2.0
1. Adds option to override tag name (options.tagName) in `#update`.
2. Misc. refactoring and further testing.

### 1.1.0
1. Improves CLI arguments. Now arguments is indifferent to order
2. Adds better error handling and user feedback on partial version update (not all files).

### 1.0.0
1. Changes API to use an object literal, avoiding magic strings/primitives.


### 0.5.0
1. Adds `noPrefix` flag. Allowing to define whether or not to prefix tags with "v".


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
