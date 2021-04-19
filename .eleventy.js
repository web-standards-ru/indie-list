const yaml = require("js-yaml");
const htmlmin = require("html-minifier");
const fs = require('fs-extra');
const path = require('path');

const FEED_DIR = path.resolve('feeds');
const DEST_DIR = path.resolve('_dest');
const CURRENT_DIR = path.resolve('.');

module.exports = eleventyConfig => {
  eleventyConfig.addFilter("lang", (obj, lang) => obj.filter(elem => elem.lang === lang));
  eleventyConfig.addFilter("dateFormat", (d) => `${d.getFullYear()}.${('00' + (d.getMonth() + 1)).slice(-2)}.${d.getDate()}`);

  eleventyConfig.addCollection('feeds', function (collectionApi) {
    return fs.readdirSync(FEED_DIR).map(file => {
      return yaml.safeLoad(fs.readFileSync(path.join(FEED_DIR, file)));
    })
  });

  eleventyConfig.on('afterBuild', () => {
    for (let file of ['README.md', 'feeds.opml']) {
      fs.moveSync(path.join(DEST_DIR, file), path.join(CURRENT_DIR, file), { overwrite: true });
    }
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
      data: FEED_DIR,
      output: DEST_DIR
    }

  }
};
