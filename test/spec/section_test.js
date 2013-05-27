'use strict';

var grunt = require('grunt');
var path = require('path');

exports.section = {
  structure: function(test) {
    test.expect(2);

    var actualMain = [];
    grunt.file.recurse('tmp/main', function(abs, root, subdir, file) {
      actualMain.push(path.join(subdir || '', file));
    });
    actualMain.sort();

    var actualBuild = [];
    grunt.file.recurse('tmp/main', function(abs, root, subdir, file) {
      actualBuild.push(path.join(subdir || '', file));
    });
    actualBuild.sort();

    var expected = [];
    grunt.file.recurse('test/expected', function(abs, root, subdir, file) {
      expected.push(path.join(subdir || '', file));
    });
    expected.sort();

    test.deepEqual(actualMain, expected, 'Expected different file structure for main task.');
    test.deepEqual(actualBuild, expected, 'Expected different file structure for build task.');

    test.done();
  }
};
