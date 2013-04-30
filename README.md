Version -- A NPM and Bower module version handler
===

Imitates ```npm version``` to also work on component.json. For those times you have both package.json and component.json and
want to easily bump the version and optionally commit and create a tag. 

Also works with only package.json or component.json. 

## Usage CLI

```
npm install -g version
```

```
$ version -h

Usage: version [ <newversion> | major | minor | patch | build ] [ -m <optional message> ]
(run in package dir).

Update module version in both package.json and component.json.

Run without arguments to get current version.

# Update version
Update version by defining new semver valid version
or a release string (major, minor, patch, build).
--
Ex: "version minor"
Ex: "version 1.0.1-beta"
--

# Git
Use -m to auto commit and tag. Apply optional message and
use '%s' as placeholder for the updated version. Default
message is 'v%s' where %s is replaced with new version.
--
Ex: "version minor -m"
Ex: "version minor -m 'Bumped to v%s'"
--
```

### Examples

```
$ version patch
New Version: 0.0.6
Updated package.json
Updated component.json
```

```
$ version 0.0.5 -m
New Version: 0.0.5
Updated package.json
Updated component.json
Commited to git and created tag v0.0.5
```

```
$ version 1.0.0-rc1 -m "Now in wopping v%s"
New Version: 1.0.0-rc1
Updated package.json
Updated component.json
Commited to git and created tag v1.0.0-rc1
```


## Usage API

```
npm install version
```

```javascript
var version = require('version');

version.get(function (err, data) {
  /*
    data = {
      'package.json': VERSION,
      'component.json': VERSION
    }
  */
});

version.update('minor', function (err, data) { })
version.update('major', function (err, data) { })
version.update('patch', function (err, data) { })
version.update('build', function (err, data) { })
version.update('0.0.1', function (err, data) { })
version.update('v1.0.1', function (err, data) { })
version.update('v1.0.1-beta', function (err, data) { })
version.update('v1.0.1-010988', function (err, data) { })
```

