const fs = require('fs');
const path = require('path');

const subjects = ['physics', 'chemistry', 'maths'];
const dataDir = path.join(__dirname, '..', 'public', 'data');
const result = {};

for (const subject of subjects) {
  const indexPath = path.join(dataDir, subject, '_index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  result[subject] = [];

  for (const ch of index.chapters) {
    const chapterPath = path.join(dataDir, subject, ch.file);
    const data = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));
    result[subject].push({
      chapter: data.chapter,
      questions: data.questions.map(q => ({
        ...q,
        subject,
        chapter: data.chapter,
      })),
    });
  }
}

const outPath = path.join(dataDir, 'all-questions.json');
fs.writeFileSync(outPath, JSON.stringify(result));
console.log(`Written ${outPath}`);
