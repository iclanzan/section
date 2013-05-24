'use strict';

var grunt = require('grunt');
var path = require('path');

exports.section = {
  main: function(test) {
    test.expect(1);

    var actual = [];
    grunt.file.recurse('tmp', function(abs, root, subdir, file) {
      actual.push(path.join(subdir || '', file));
    });
    actual.sort();

    var expected = [];
    grunt.file.recurse('test/expected', function(abs, root, subdir, file) {
      expected.push(path.join(subdir || '', file));
    });
    expected.sort();

    test.deepEqual(actual, expected, 'should copy several files');

    test.done();
  }
};
