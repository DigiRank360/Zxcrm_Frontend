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

Set the MongoDB connection string and first administrator credentials in `Crm_Backend/.env` as described in [the backend README](../Crm_Backend/README.md). MongoDB stores CRM records and accounts; the administrator creates employee, technician, and HR logins in **Team accounts**. Configure Cloudinary, Meta/WhatsApp webhook, and Twilio SMS credentials in the backend environment to enable uploads and integrations. The theme button switches between light and dark themes and remembers the choice in the browser.

The CRM includes role-scoped Customer 360 profiles, deterministic lead routing using geography/property/score and employee capacity, a twelve-stage solar workflow with approvals, commissioning-triggered maintenance, HR employee profiles and attendance-based monthly payroll, Cloudinary-backed attendance and field visit photos, and customer service tickets with technician assignment and OTP closure. Payroll deductions are manual and payable salary is calculated from monthly attendance. Attendance location radius checks remain disabled until office/site coordinates are configured. Employee routing criteria are configurable under Team accounts. Customer location, property type, and lead score can be imported from a CSV (`name,phone,email,state,city,propertyType,score`) or provided to a verified lead webhook. External e-sign, inventory, and additional messaging providers are not included.

Employees and technicians can update their own bank account details and upload identity or bank-proof documents from **My profile & documents**. HR manages employee records and documents from the separate HR login. Configure `HR_DATA_ENCRYPTION_KEY` and Cloudinary in the backend environment as documented in [the backend README](../Crm_Backend/README.md); sensitive account numbers are encrypted and uploaded documents are private.

## Checks

```sh
npm run lint
npm run build
```
