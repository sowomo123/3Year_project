const fs = require('fs');
const path = require('path');

// Read Supabase keys from root .env
const rootEnv = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const lines = rootEnv
  .split('\n')
  .filter((l) => l.startsWith('SUPABASE_'))
  .join('\n');

for (const name of fs.readdirSync(__dirname)) {
  const envPath = path.join(__dirname, name, '.env');
  if (name === '_template' || name === 'add-env.js' || name === 'create-all.js' || !fs.existsSync(envPath)) continue;

  let current = fs.readFileSync(envPath, 'utf8');
  current = current.split('\n').filter((l) => !l.startsWith('SUPABASE_')).join('\n');
  fs.writeFileSync(envPath, current.trimEnd() + '\n' + lines + '\n');
  console.log('updated', name);
}
console.log('Done!');
