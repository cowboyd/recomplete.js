var pickFiles  = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var compileES6 = require('broccoli-es6modules');
var babel    = require('broccoli-babel-transpiler');
var concat   = require('broccoli-sourcemap-concat');

// --- Compile ES6 modules ---

var loader = pickFiles('bower_components', {
  srcDir: 'loader.js',
  files: ['loader.js'],
  destDir: '/assets'
});

var lib = pickFiles('lib', {
  include: ['*.js']
});

var tests = pickFiles('tests', {
  include: ['*-test.js'],
  destDir: '/tests'
});

var main = mergeTrees([lib, tests]);
main = new compileES6(main);
main = new babel(main);

main = concat(main, {
  inputFiles: ['**/*.js'],
  outputFile: '/assets/complete-tests.amd.js'
});

// --- Select and concat vendor / support files ---

var vendor = concat('bower_components', {
  inputFiles: [
    'immutable/dist/immutable.js',
    'immstruct/dist/immstruct.js'
  ],
  outputFile: '/assets/vendor.js'
});

var mocha = pickFiles('bower_components', {
  srcDir: 'mocha',
  files: ['mocha.js', 'mocha.css'],
  destDir: '/assets'
});

var chai = pickFiles('bower_components', {
  srcDir: 'chai',
  files: ['chai.js'],
  destDir: '/assets'
});

var testSupport = concat('bower_components', {
  inputFiles: ['ember-cli-test-loader/test-loader.js'],
  outputFile: '/assets/test-support.js'
});

var loadTests = pickFiles('tests', {
  files: ['load-test-modules.js'],
  destDir: '/assets'
});

module.exports = mergeTrees([main, vendor,  mocha, chai, loader, testSupport, loadTests]);
