const fs = require('fs');
const path = require('path');

const dbContent = `const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

module.exports = supabase;
`;

for (const name of fs.readdirSync(__dirname)) {
  const dbPath = path.join(__dirname, name, 'src', 'db.js');
  if (name === 'copy-db.js' || name === 'add-env.js' || name === 'create-all.js' || name === '_template') continue;
  
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, dbContent);
    console.log('created db.js for', name);
  } else {
    console.log('db.js already exists for', name);
  }
}
console.log('Done!');
