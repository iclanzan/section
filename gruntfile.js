'use strict';

module.exports = function( grunt ) {

  var pkg = grunt.file.readJSON(__dirname + '/package.json');

  grunt.initConfig({

    section: {
      options: {
        base: 'test/fixtures',
        sectionBase: '',
        content: 'content',
        output: 'tmp',
        layout: 'theme/layout.jst',
        style: 'theme/style.scss',
        index_html: 'index.html',
        highlight: true,
        pkg: pkg,
        markdown_ext: ['.md', '.markdown', '.mdown', '.mkdn', '.mkd', '.mdwn', '.text'],
        url: '',
        host: 'localhost',
        port: 8000,
        rss_count: 10,
        ga_uid: ''
      },
      main: {
        src: 'test/fixtures/content',
        dest: 'tmp'
      }
    },

    nodeunit: {
      all: ['test/spec/**/*.js']
    }
  });

  // ['contrib-nodeunit', 'notify', 'contrib-sass'].forEach(function(name) {
  //   grunt.loadNpmTasks('grunt-' + name);
  // });

  Object.keys(grunt.util._.extend(pkg.dependencies, pkg.devDependencies)).forEach(function(dep) {
  if (~dep.search(/^grunt-/))
      grunt.loadNpmTasks(dep);
  });

  grunt.loadTasks('tasks');

  grunt.registerTask('test', [
    'section',
    'nodeunit'
  ]);

  // Default task.
  grunt.registerTask('default', ['test']);
};
