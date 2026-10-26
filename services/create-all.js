const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// name, port (numbers follow the proposal's service table)
const SERVICES = [
  ['auth-service', 4001],
  ['user-profile-service', 4002],
  ['cinema-service', 4003],
  ['movie-service', 4004],
  ['showtime-service', 4005],
  ['hall-service', 4006],
  ['seat-service', 4007],
  ['seat-reservation-service', 4008],
  ['payment-service', 4009],
  ['discount-service', 4010],
  ['ticket-service', 4011],
  ['qr-code-service', 4012],
  ['notification-service', 4013],
  ['review-rating-service', 4014],
  ['search-service', 4015],
  ['promotion-service', 4016],
  ['admin-service', 4017],
  ['reporting-service', 4018],
  ['booking-service', 4019],
  ['api-gateway', 4000],
];

const template = path.join(__dirname, '_template');

for (const [name, port] of SERVICES) {
  const dest = path.join(__dirname, name);
  if (fs.existsSync(dest)) {
    console.log(`skip  ${name} (already exists)`);
    continue;
  }

  // copy template, but not node_modules
  fs.cpSync(template, dest, {
    recursive: true,
    filter: (src) => !src.includes('node_modules'),
  });

  // give it its own name and port
  fs.writeFileSync(path.join(dest, '.env'), `SERVICE_NAME=${name}\nPORT=${port}\n`);
  const pkgPath = path.join(dest, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.name = name;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  console.log(`made  ${name} on port ${port}`);
  execSync('npm install', { cwd: dest, stdio: 'ignore' });
}
console.log('Done!');
