'use strict';

// Create React App turns every ESLint warning into a fatal build error when CI=true.
// Rasoio still runs the ESLint plugin and reports warnings during production builds,
// while the dedicated `npm run lint` command remains available for strict linting.
process.env.CI = 'false';

require('react-scripts/scripts/build');
