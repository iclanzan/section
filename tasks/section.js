'use strict';

function urlEncode(string) {
  var encoded = '';
  for (var i = 0; i < string.length; i++)
    if (!(i % 4))
      encoded += '%' + string.charCodeAt(i).toString(16);
    else
      encoded += string.charAt(i);
  return encoded;
}

function htmlEncode(string) {
  var encoded = '';
  for (var i = 0; i < string.length; i++) {
    var c = string.charAt(i);
    if (!(i % 4) || c == '@' || c == '.' || c == ':')
      encoded += '&#' + string.charCodeAt(i) + ';';
    else
      encoded += string.charAt(i);
  }
  return encoded;
}

function mailToLink(email, name) {
  return '<a href="' + htmlEncode('mailto:' + urlEncode(email)) + '">' + htmlEncode(name || email) + '</a>';
}

module.exports = function(grunt) {

  var fs = require('fs'),
      path = require('path'),
      marked = require('marked'),
      hljs = require('highlight.js'),

      _ = grunt.util._,
      extend = _.extend,
      forEach = _.forEach,
      processTemplate = grunt.template.process,
      file = grunt.file,
      readFile = file.read,
      writeFile = file.write,
      deleteFile = file.delete,
      copyFile = file.copy,
      info = grunt.log.writeln;

  var supportedLanguages = Object.keys(hljs.LANGUAGES);

  function text(str) {
    return _.clean(_.stripTags(marked(str)));
  }

  var is = function() {
    for(var i = 0, l = arguments.length; i < l; i++)
      if (arguments[i] == this.type) return true;
    return false;
  };

  grunt.registerMultiTask('section', 'Generate website from Markdown files.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options(),
        isBuild = this.target == 'build',
        src = this.data.src,
        dest = this.data.dest;

    if (options.highlight)
      marked.options({
        highlight: function (text, lang) {
          if (lang) {
            if (~supportedLanguages.indexOf(lang))
              return hljs.highlight(lang, text).value;
            if (lang == 'text' || lang != 'plain')
              return text;
          }

          return hljs.highlightAuto(text).value;
        }
      });

    // Delete the output directory
    try {
      deleteFile(dest);
    } catch (e) {
      grunt.log.error();
      grunt.verbose.error(e);
      grunt.fail.warn('Failed to clean output directory.');
    }

    var pageProto = {
      title: '',
      description: '',
      body: '',
      date: 0,
      author: false,
      is: is,
      mailToLink: mailToLink,
      dateFormat: grunt.template.date
    };
    var root = pageProto.root = Object.create(pageProto);
    var pages = pageProto.pages = [root];
    root.ancestors = [root];
    root.page = root;

    var template = readFile(options.layout);
    if (this.target == 'main')
      template = template.replace('</body>', '<script src="http://localhost:35729/livereload.js"></script></body>');

    (function recurse(rootdir, site, subdir) {
      subdir && (subdir += '/') || (subdir = '');

      var abspath = path.join(rootdir, subdir),
          lastPage;

      site.children = [];
      site.hash = {};
      site.type = 'index';

      fs.readdirSync(abspath).sort().forEach(function(filename) {
        var filepath = path.join(abspath, filename),
            filestat = fs.statSync(filepath),
            ext = path.extname(filepath);

        // If this is a file with an unsupported extension just copy it as is.
        // Skip hidden files.
        if (filestat.isFile() && !~options.markdown_ext.indexOf(ext)) {
          if (filename.charAt(0) != '.') {
            copyFile(filepath, path.join(dest, site.path || '', filename));
          }
          return;
        }

        var page = Object.create(pageProto),
            name = page.name = _.slugify(path.basename(filepath, ext).replace(/^\d{4}-\d\d-\d\d-/, function(match) {
              page.date = new Date(match.slice(0, -1)).getTime();
              return '';
            }));

            page.path = (site.path || '') + name + '/';
            page.ext = ext;
            page.parent = site;
            page.ancestors = site.ancestors.slice(0);
            page.ancestors.push(page);
            page.page = page;

        if (name != 'index') {
          site.children.push(page);
          pages.push(page);
          site.hash[name] = page;
        }

        // Subdirectory
        if (filestat.isDirectory())
          recurse(rootdir, page, path.join(subdir || '', filename || ''));

        // Page
        else {
          var content = readFile(filepath),
              tokens = marked.lexer(content),
              attrs = {
                body: '',
                src: filepath
              };

          forEach(tokens, function(token) {
            // Get the title from the markdown document’s 1st level 1 heading.
            if (!attrs.title && token.type == 'heading' && token.depth == 1) {
              attrs.title = text(token.text);
            }
            // Use the first paragraph as the description.
            if (!attrs.description && token.type == 'paragraph') {
              attrs.description = text(token.text);
            }
            if (attrs.title && attrs.description) return false;
            // Hack to add id attributes to headers to enable linking to them.
            // if (token.type == 'heading') {
            //   token.depth += ' id="' + _.slugify(text(token.text)) + '"';
            // }
          });

          attrs.body = marked.parser(tokens);

          // Index page
          if (name == 'index') {
            extend(site, attrs);
            site.dest = path.join(dest, site.path || '', options.index_html);
            site.rel = '/' + (site.path || '');
            site.url = options.url + site.rel;
          }

          // Normal page
          else {
            extend(page, attrs);
            page.dest = path.join(dest, page.path, options.index_html);
            page.type = page.date ? 'post' : 'page';
            page.rel = '/' + page.path;
            page.url = options.url + page.rel;

            if (lastPage) {
              page.prev = lastPage;
              lastPage.next = page;
            }
            lastPage = page;
          }
        }
      });
    })(src, pages[0]);

    pages.sort(function(a, b) {
      return b.date - a.date;
    }).forEach(function(page) {
      // Generate the html file
      if (page.dest) {
        writeFile(page.dest, processTemplate(template, {
          data: extend({}, page, options)
        }));
        info('Generated “' + page.dest + '”.');
      }
    });

    // Configure copy task.
    grunt.config.set('copy', {
      init: {
        expand: true,
        cwd: path.join(options.sectionDir, 'theme/assets'),
        src: '**/**',
        dest: options.output
      },
      main: {
        expand: true,
        cwd: path.join(options.base,'assets'),
        src: '**/**',
        dest: options.output
      }
    });

    // Configure sass task.
    grunt.config.set('sass', {
      main: {
        options: {
          style: isBuild ? 'compressed' : 'expanded',
          lineNumbers: !isBuild
        },
        src: options.style,
        dest: path.join(options.output, 'style.css')
      }
    });

    // Queue next tasks.
    grunt.task.run('copy', 'sass');

  });
};
