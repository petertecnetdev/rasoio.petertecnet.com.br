'use strict';
const { spawnSync } = require('child_process');
require('./check-establishment-management-contract');
require('./check-product-positioning-contract');
require('react-scripts/scripts/build');
const result = spawnSync(process.execPath, [require.resolve('./generate-search-index')], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
