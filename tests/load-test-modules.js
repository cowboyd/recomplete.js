var TestLoader = require('ember-cli/test-loader')['default'];
TestLoader.prototype.shouldLoadModule = function(moduleName) {
  return moduleName.match(/\/.*[-_]test$/);
};
// TestLoader.prototype.moduleLoadFailure = function(moduleName, error) {
//   QUnit.module('TestLoader Failures');
//   QUnit.test(moduleName + ': could not be loaded', function() {
//     throw error;
//   });
// };
TestLoader.load();
