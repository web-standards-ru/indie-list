const yaml = require("js-yaml");
var mv = require('mv');
const htmlmin = require("html-minifier");
const fs = require('fs');

const FEED_DIR = 'feeds'
const DEST_DIR = '_dest'

module.exports = eleventyConfig => {
  eleventyConfig.addFilter("lang", (obj, lang) => obj.filter(elem => elem.lang === lang));

  eleventyConfig.addCollection('feeds', function (collectionApi) {
    return fs.readdirSync(FEED_DIR).map(file => {
      return yaml.safeLoad(fs.readFileSync(FEED_DIR + '/' + file));
    })
  });

  eleventyConfig.on('afterBuild', () => {
    mv(DEST_DIR, '.', { mkdirp: false, clobber: false }, (err) => {
      if (err) {
        throw err;
      }
    });
  });

  eleventyConfig.addTransform("files-minifier", function (value, outputPath) {
    if (!outputPath) {
      return value;
    }
    const pathEndBy = (extension) => outputPath.includes(extension);
    if (pathEndBy(".rss") || pathEndBy(".opml")) {
      const config = {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        decodeEntities: true,
        html5: false,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeEmptyElements: true,
        sortAttributes: true,
        sortClassName: true,
        keepClosingSlash: true
      }

      return htmlmin.minify(value, config);
    }
    return value;
  });

  return {
    templateFormats: ['njk'],
    dir: {
      input: 'src',
      data: 'feeds',
      output: '_dest'
    }

  }
};
