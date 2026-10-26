const fs = require('fs');
const path = require('path');

// Read JWT_SECRET from root .env
const rootEnv = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const jwtLine = rootEnv.split('\n').find(l => l.startsWith('JWT_SECRET'));

if (!jwtLine) {
  console.log('JWT_SECRET not found in root .env');
  process.exit(1);
}

for (const name of fs.readdirSync(__dirname)) {
  const envPath = path.join(__dirname, name, '.env');
  if (name === 'add-jwt.js' || name === 'copy-db.js' || name === 'add-env.js' || name === 'fix-db.js' || name === 'create-all.js' || name === '_template') continue;
  
  if (fs.existsSync(envPath)) {
    let current = fs.readFileSync(envPath, 'utf8');
    if (!current.includes('JWT_SECRET')) {
      fs.writeFileSync(envPath, current.trimEnd() + '\n' + jwtLine + '\n');
      console.log('added JWT_SECRET to', name);
    } else {
      console.log('JWT_SECRET already exists in', name);
    }
  }
}
console.log('Done!');
