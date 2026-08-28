const apiBaseUrl = "https://api.petertecnet.com.br/api";
const storageUrl = "https://api.petertecnet.com.br/storage/";

// Legacy numeric ID remains exported while the frontend is migrated endpoint by endpoint.
const appId = 1;
const appSlug = "rasoio";
const apiV1BaseUrl = `${apiBaseUrl}/v1/apps/${appSlug}`;
const linkApp = "https://rasoio.petertecnet.com.br";

export { apiBaseUrl, apiV1BaseUrl, storageUrl, appId, appSlug, linkApp };
