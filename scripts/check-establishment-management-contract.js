'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const checks = [
  {
    file: 'src/hooks/useEstablishmentMy.js',
    forbidden: ['/establishment/my/app', 'app_id'],
  },
  {
    file: 'src/hooks/useEstablishmentItemsBySlug.js',
    forbidden: ['/establishment/view/', '/item/list-by-entity/', 'app_id'],
  },
  {
    file: 'src/hooks/useEstablishmentOrdersBySlug.js',
    forbidden: ['/rasoio/establishments/', '/rasoio/orders/'],
  },
  {
    file: 'src/pages/DashboardPage.js',
    forbidden: ['/rasoio/establishments/', '/rasoio/orders/'],
  },
  {
    file: 'src/App.js',
    forbidden: ['Number(establishment?.app_id) === Number(appId)'],
  },
  {
    file: 'src/hooks/useItemCreate.js',
    forbidden: ['/establishment/view/', 'apiBaseUrl}/item', 'app_id'],
  },
];

const failures = [];

for (const check of checks) {
  const absolutePath = path.join(root, check.file);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${check.file}: arquivo não encontrado`);
    continue;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const token of check.forbidden) {
    if (content.includes(token)) {
      failures.push(`${check.file}: contrato legado encontrado (${token})`);
    }
  }
}

const managementApiPath = path.join(root, 'src/services/platformManagementApi.js');
const managementApi = fs.existsSync(managementApiPath)
  ? fs.readFileSync(managementApiPath, 'utf8')
  : '';

for (const required of [
  '/v1/apps/',
  '/me/establishments',
  '/team-members',
  '/appointments/',
]) {
  if (!managementApi.includes(required)) {
    failures.push(`platformManagementApi.js: contrato genérico ausente (${required})`);
  }
}

if (failures.length) {
  console.error('Establishment management contract check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Establishment management contract check passed.');
