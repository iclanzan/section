'use strict';

var grunt = require('grunt');
var path = require('path');
var cheerio = require('cheerio');

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
  },
  coverImage: function(test) {
    test.expect(2);

    var $ = cheerio.load(grunt.file.read('tmp/build/cover-image/with/index.html'));
    test.strictEqual($('main article > figure:first-child').length, 1, 'Expected a cover image.');

    $ = cheerio.load(grunt.file.read('tmp/build/cover-image/without/index.html'));
    test.strictEqual($('main article > figure:first-child').length, 0, 'Expected a cover image.');

    test.done();
  }
};
