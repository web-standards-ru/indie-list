const xml = require("xml");
const fs = require('fs-extra');

const DATA_PATH = 'README.md'
const FEEDS_PATH = 'feeds.opml'

const RE = {
  GROUP_LANG: /## ([\wа-яё]+)/gmi,
  FEED: /^- \[(?<name>.+)\]\((?<url>.+)\), \[RSS\]\((?<rss>.+)\)$/gm,
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
  const readme = await fs.readFile(DATA_PATH, 'utf-8');
  const regex = RE.GROUP_LANG
  let langs = split(readme, regex);
  const result = []

  for (let langRE of langs) {
    let lang = LANGUAGES[langRE[1]] || LANGUAGES.default;
    let text = readme.substr(langRE.index + langRE[0].length).trim()
    result.push(
      {
        outline: [
          { _attr: { text: lang } },
          ...split(text, RE.FEED).map(data => {
            let d = data.groups;
            return {
              outline: [
                { _attr: { text: d.name, lang: lang, htmlUrl: d.url, xmlUrl: d.rss, type: 'rss' } },
              ]
            }
          })
        ]
      }
    )
  }

  return await fs.writeFile(FEEDS_PATH, xml([{
    opml: [
      { _attr: { version: '2.0' } },
      {
        head: [
          { title: 'Список инди-сайтов сообщества "Веб-стандарты"' },
          { dateCreated: (new Date(2021, 3, 13, 1, 46, 34)).toISOString() },
          { dateModified: (new Date()).toISOString() },
          { ownerName: "web-standarts" },
          { ownerEmail: "hi@web-standarts.ru" },
          { expansionState: true },
          { vertScrollState: 1 },
          { windowTop: 61 },
          { windowLeft: 304 },
          { windowBottom: 562 },
          { windowRight: 842 },
        ],
      },
      { body: result }
    ]
  }], { declaration: true }));
};

main()
  .then((data) => { console.log("Done!"); })
  .catch((err) => { console.error("FAIL!"); throw err });
