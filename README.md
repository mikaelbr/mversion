mversion -- A NPM and Bower module version handler
===

Imitates [```npm version```](https://npmjs.org/doc/version.html) to also work on component.json. For those times you have both package.json and component.json and
want to easily bump the version and optionally commit and create a tag. 

Also works with only package.json or component.json. 

## Usage CLI

```
npm install -g mversion
```

```
$ mversion -h

Usage: mversion [ <newversion> | major | minor | patch | build ] [ -m <optional message> ]
(run in package dir).

Update module version in both package.json and component.json.

Run without arguments to get current version.

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
--
Ex: "mversion minor -m"
Ex: "mversion minor -m 'Bumped to v%s'"
--
```

### Examples

```
$ mversion patch
New Version: 0.0.6
Updated package.json
Updated component.json
```

```
$ mversion 0.0.5 -m
New Version: 0.0.5
Updated package.json
Updated component.json
Commited to git and created tag v0.0.5
```

```
$ mversion 1.0.0-rc1 -m "Now in wopping v%s"
New Version: 1.0.0-rc1
Updated package.json
Updated component.json
Commited to git and created tag v1.0.0-rc1
```


## Usage API

```
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
mversion.update('patch', function (err, data) { })
mversion.update('build', function (err, data) { })
mversion.update('0.0.1', function (err, data) { })
mversion.update('v1.0.1', function (err, data) { })
mversion.update('v1.0.1-beta', function (err, data) { })
mversion.update('v1.0.1-010988', function (err, data) { })
```

