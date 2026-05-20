# Conduit (RealWorld) Playwright & TypeScript Automation Framework

## 🎯 Overview
This repository showcases a modern, high-performance End-to-End (E2E) test automation framework built for the Conduit (RealWorld) SPA application. Designed with a strong focus on **Clean Code** principles and modern QA engineering practices, this framework goes beyond simple UI scripting by leveraging network-level manipulations and advanced optimization techniques.

## 🛠️ Tech Stack & Tools
- **Core Framework:** Playwright (v1.x)
- **Programming Language:** TypeScript
- **IDE:** JetBrains WebStorm
- **Design Pattern:** Page Object Model (POM)
- **Architecture Concepts:** Global Authentication (Storage State) & Network Interception (API Mocking)

## 🏗️ Advanced Architectural Features

### 1. Global Authentication (Storage State)
To maximize test execution speed and eliminate redundant login steps, the framework utilizes a **Global Setup** routine (`auth.setup.ts`).
- Before any test runs, a unique user is registered and logged in *once*.
- The browser context state (cookies, local storage, JWT tokens) is dumped into a secure `.auth/user.json` file.
- Subsequent E2E tests automatically reuse this state, starting fully authenticated in milliseconds.

### 2. Network Interception & API Mocking
Demonstrating true Software Development Engineer in Test (SDET) capabilities, the framework intercepts network traffic via Playwright's `page.route` API.
- Test scenarios can bypass database dependencies by catching outgoing HTTP requests (e.g., `GET **/api/articles*`).
- The framework injects custom mock JSON payloads mid-air to validate front-end component responsiveness against extreme edge-case scenarios (e.g., specific like counts, custom usernames) without polluting the production environment.

### 3. Type-Safe Page Object Model (POM)
Leveraging TypeScript's strict compilation, web element locators and page-specific user flows (`HomePage.ts`, `ArticlePage.ts`) are encapsulated into dedicated, highly scalable classes. This ensures code reusability and minimizes runtime locator fragility.

## ⚙️ How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
Install Node.js dependencies => npm install

Execute all tests =>
npx playwright test

Run a specific test in visual (headed) mode =>
npx playwright test tests/apiMocking.spec.ts --headed

Analyze interactive test reports =>
npx playwright show-report

## 🚀 Project Structure
```text
├── .auth/               # Secure directory for saved storage state (Git ignored)
├── pages/               # Page Object Model classes (TypeScript)
│   ├── HomePage.ts
│   └── ArticlePage.ts
├── tests/               # Test suites
│   ├── auth.setup.ts    # Initial session recording
│   ├── articleCRUD.spec # Full Create, Read, Update, Delete UI flows
│   └── apiMocking.spec  # Network manipulation tests
├── playwright.config.ts # Global configuration (BaseURL, viewports, parallelism)
└── package.json         # Node.js dependencies and run scripts

