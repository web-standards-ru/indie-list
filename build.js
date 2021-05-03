const xml = require("xml");
const fs = require('fs-extra');

const ENCODING = 'UTF-8';
const DATA_PATH = 'README.md'
const FEEDS_PATH = 'feeds.opml'
const FEEDS_LANG_PATH = (lang) => `feeds.${lang}.opml`

const RE = {
  GROUP_LANG: /## ([\wа-яё]+)/gmi,
  FEED: /^- \[(?<name>.+)\]\((?<url>.+)\), \[RSS\]\((?<rss>.+)\)$/gm,
}

const TEMPLATES = {
  FEED: (data, lang) => {
    return {
      outline: [
        {
          _attr: {
            title: data.name,
            lang: lang,
            htmlUrl: data.url,
            xmlUrl: data.rss,
            category: lang,
            type: 'rss',
          }
        },
      ]
    };
  },

  LANG: (data, lang) => {
    return {
      outline: [
        { _attr: { text: lang, category: lang, } },
        ...data
      ]
    };

  },

  MAIN: (data) => xml([{
    opml: [
      { _attr: { version: '2.0' } },
      {
        head: [
          { title: 'Список инди-сайтов сообщества "Веб-стандарты"' },
          { dateCreated: (new Date(2021, 3, 13, 1, 46, 34)).toISOString() },
          { dateModified: (new Date()).toISOString() },
          { ownerName: "web-standarts" },
          { ownerEmail: "hi@web-standarts.ru" },
        ],
      },
      { body: data }
    ]
  }], { declaration: true })
}

const LANGUAGES = {
  'Русскоязычные': "ru",
  'Англоязычные': "en",
  default: "undefined"
}

function split(string, regexp) {
  let m;
  const res = [];
  while ((m = regexp.exec(string)) !== null) {
    if (m.index === regexp.lastIndex) {
      regexp.lastIndex++;
    }
    if (m) res.push(m)
  }
  return res;
}

async function main() {
  const readme = await fs.readFile(DATA_PATH, ENCODING);
  const regex = RE.GROUP_LANG
  let langs = split(readme, regex);
  const result = [];
  const allFeeds = [];

  for (let langRE of langs) {
    let lang = LANGUAGES[langRE[1]] || LANGUAGES.default;
    let text = readme.substr(langRE.index + langRE[0].length).trim()
    feeds = split(text, RE.FEED).map(data => TEMPLATES.FEED(data.groups, lang))
    allFeeds.push(...feeds);
    result.push(TEMPLATES.LANG(feeds, lang));
    let path = FEEDS_LANG_PATH(lang)
    await fs.writeFile(path, TEMPLATES.MAIN(feeds), { encoding: ENCODING })
    console.log(`Saved '${lang}' to '${path}'`);
  }

  await fs.writeFile(FEEDS_PATH, TEMPLATES.MAIN(result), { encoding: ENCODING })
  console.log('Saved default feeds');
  await fs.writeFile(FEEDS_LANG_PATH('flat'), TEMPLATES.MAIN(allFeeds), { encoding: ENCODING })
  console.log('Saved flatten feeds');
};

main()
  .then((data) => { console.log("Done!"); })
  .catch((err) => { console.error("FAIL!"); throw err });
