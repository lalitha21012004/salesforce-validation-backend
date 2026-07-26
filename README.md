# Salesforce Validation Manager - Backend API

A Node.js and Express REST API that serves as the bridge between the frontend web application and Salesforce. It handles OAuth 2.0 authentication flows and uses the Salesforce Tooling API to query and update validation rules in real time.

---

## 🚀 Live Server

- **API Base URL:** `https://sf-validation-backend-3ccd.onrender.com` 

---

## ✨ Key Responsibilities

- **Salesforce OAuth 2.0 Integration:** Manages access tokens and refresh tokens securely to authenticate requests against connected Salesforce Orgs.
- **Tooling API Querying:** Executes SOQL queries via the Tooling API to fetch validation rules (`SELECT Id, FullName, EntityDefinitionId, Metadata FROM ValidationRule`).
- **Metadata Management:** Sends `PATCH` requests to update the `Active` state (`true`/`false`) of validation rules directly within the target Salesforce Org.

---

## 🛠️ Tech Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **HTTP Client:** Axios / JSforce
- **Deployment Platform:** Render

---

## 💻 Local Setup & Installation

Follow these steps to run the backend API locally:

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.x or higher)
- [npm](https://www.npmjs.com/)
- A Salesforce Developer Org with a **Connected App** set up.

---

### 1. Clone the Repository

```bash
git clone [https://github.com/lalitha21012004/](https://github.com/lalitha21012004/)salesforce-validation-backend.git
cd salesforce-validation-backend.git
