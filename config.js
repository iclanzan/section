var path = require('path');

module.exports = function( grunt ) {

  // Aliases
  var file = grunt.file,
      isFile = file.isFile,
      readJSON = file.readJSON,
      readYAML = file.readYAML,
      _ = grunt.util._,
      find = _.find;

  function readAny(filepath) {
    if (path.extname(filepath) == '.json')
      return readJSON(filepath);
    return readYAML(filepath);
  }

  var layout = find(['layout.jst', __dirname + '/theme/layout.jst'], isFile),
      style = find(['style.scss', 'syle.sass', 'syle.css', __dirname + '/theme/style.scss'], isFile);

  var pkg = readJSON(__dirname + '/package.json');

  var defaultConfig = {
    base: grunt.option('base') || '',
    content: 'content/',
    output: grunt.option('output') || 'output/',
    layout: layout,
    style: style,
    index_html: 'index.html',
    highlight: true,
    pkg: pkg,
    markdown_ext: ['.md', '.markdown', '.mdown', '.mkdn', '.mkd', '.mdwn', '.text'],
    url: grunt.option('url') || '',
    host: 'localhost',
    port: grunt.option('port') || 8000,
    rss_count: 10,
    ga_uid: ''
  };

  // Read section config file
  var userConfigPath = grunt.option('config') || find(['section.json', 'section.yaml', 'section.yml'], isFile),
      userConfig = userConfigPath && readAny(userConfigPath) || {};

  var options = _.extend(defaultConfig, userConfig);


  var tasksConfig = {
    section: {
      options: options,
      main: {
        src: options.content,
        dest: options.output
      }
    },

    clean: {
      main: [options.output]
    },

    copy: {
      init: {
        expand: true,
        cwd: __dirname + '/theme/assets',
        src: '**/**',
        dest: options.output
      },
      main: {
        expand: true,
        cwd: 'assets',
        src: '**/**',
        dest: options.output
      }
    },

    sass: {
      compressed: {
        options: {
          style: 'compressed'
        },
        src: style,
        dest: path.join(options.output, 'style.css')
      },

      expanded: {
        options: {
          style: 'expanded',
          lineNumbers: true
        },
        src: style,
        dest: path.join(options.output, 'style.css')
      }
    },

    // HTML minification
    htmlmin: {
      main: {
        options: {
          removeComments: true,
          removeCommentsFromCDATA: true,
          removeCDATASectionsFromCDATA: true,
          // collapseWhitespace: false,
          // collapseBooleanAttributes: true,
          // removeAttributeQuotes: true,
          removeRedundantAttributes: false,
          removeEmptyAttributes: true
          // removeOptionalTags: true
        },
        expand: true,
        cwd: options.output,
        src: '**/**.html',
        dest: options.output
      }
    }
  };

  tasksConfig.connect = {
    main: {
      options: {
        base: options.output,
        hostname: options.host,
        port: options.port
      }
    }
  };

  tasksConfig.watch = {
    options: {
      livereload: true
    },
    pages: {
      files: options.content + '**/**',
      tasks: ['clean', 'section', 'sass:expanded', 'copy']
    }
  };

  tasksConfig.notify = {
    success: {
      options: {
        title: 'Success!',
        message: 'Your website was generated successfully.'
      }
    }
  };

  grunt.initConfig(tasksConfig);

  // Distribution build task.
  grunt.registerTask('build', 'Generates a production-ready version of your site.', [
    'clean',
    'copy:init',
    'section',
    'sass:compressed',
    'copy:main',
    'htmlmin',
    'time',
    'notify:success'
  ]);

  // Default task.
  grunt.registerTask('default', 'Generates and serves a development version of your site that is automatically regenerated when files change.', [
    'clean',
    'copy:init',
    'section',
    'sass:expanded',
    'copy:main',
    'notify:success',
    'connect',
    'watch'
  ]);
};
