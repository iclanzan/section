'use strict';

module.exports = function( grunt ) {

  var pkg = grunt.file.readJSON(__dirname + '/package.json');

  grunt.initConfig({
    clean: {
      test: ['tmp']
    },

    copy: {
      init: {
        expand: true,
        cwd: 'theme/assets',
        src: '**/**',
        dest: 'tmp'
      },
      test: {
        expand: true,
        cwd: 'test/fixtures/assets',
        src: '**/**',
        dest: 'tmp'
      }
    },

    section: {
      options: {
        // base: '',
        // content: 'content/',
        // output: 'output/',
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
        src: 'test/fixtures/content/',
        dest: 'tmp/'
      }
    },

    sass: {
      compressed: {
        options: {
          style: 'compressed'
        },
        src: 'theme/style.scss',
        dest: 'tmp/style.css'
      },

      expanded: {
        options: {
          style: 'expanded',
          lineNumbers: true
        },
        src: 'theme/style.scss',
        dest: 'tmp/style.css'
      }
    },

    nodeunit: {
      all: ['test/spec/**/*.js']
    }
  });

  ['contrib-nodeunit', 'notify', 'contrib-clean', 'contrib-copy', 'contrib-sass'].forEach(function(name) {
    grunt.loadNpmTasks('grunt-' + name);
  });

  grunt.loadTasks('tasks');

  grunt.registerTask('test', [
    'clean',
    'copy:init',
    'section',
    'sass:expanded',
    'copy:test',
    'nodeunit'
  ]);

  // Default task.
  grunt.registerTask('default', ['test']);
};
