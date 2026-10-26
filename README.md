# ZX Solar CRM

## Run locally

Start the API in one terminal:

```sh
cd Crm_Backend
npm install
npm run dev
```

Start the frontend in another terminal:

```sh
cd Crm_Frontend
npm install
npm run dev
```

Vite proxies `/api` requests to `http://localhost:3001`. Set the API's `PORT` environment variable to use another port and update the proxy in `vite.config.js` to match.

Set the MongoDB connection string and first administrator credentials in `Crm_Backend/.env` as described in [the backend README](../Crm_Backend/README.md). MongoDB stores CRM records and accounts; the administrator creates employee and technician logins in **Team accounts**. Configure Meta/WhatsApp webhook and Twilio SMS credentials in the backend environment to enable integrations. The theme button switches between light and dark themes and remembers the choice in the browser.

## Checks

```sh
npm run lint
npm run build
```
