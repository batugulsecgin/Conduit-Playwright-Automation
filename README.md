# Conduit (RealWorld) Enterprise Playwright & TypeScript Automation Framework

## 🎯 Overview
This repository showcases a modern, high-performance, and enterprise-grade End-to-End (E2E) test automation framework built for the Conduit (RealWorld) SPA application.

Designed with a strong focus on **Clean Code** principles and advanced QA engineering practices, this framework goes far beyond simple UI scripting. It demonstrates true SDET capabilities by combining UI interactions with deep network-level manipulations, API chaining, CORS handling, and Data-Driven Testing (DDT).

![Görüntülenme Sayısı](https://komarev.com/ghpvc/?username=SENIN_KULLANICI_ADIN&color=blue)

## 🛠️ Tech Stack & Tools
- **Core Framework:** Playwright (v1.x)
- **Programming Language:** TypeScript
- **Design Pattern:** Page Object Model (POM)
- **Test Methodology:** Data-Driven Testing (DDT), API Chaining, Chaos Engineering (Error Handling)
- **IDE:** JetBrains WebStorm

## 🏗️ Advanced Architectural Modules & Features

### 1. Global Authentication (Storage State)
To maximize test execution speed and eliminate redundant login steps, the framework utilizes a **Global Setup** routine (`auth.setup.ts`).
- Before any test runs, a unique user is registered and logged in *once*.
- The browser context state (cookies, local storage, JWT tokens) is dumped into a secure `.auth/user.json` file.
- Subsequent E2E tests automatically reuse this state, starting fully authenticated in milliseconds.

### 2. Deep Network Interception & Error Handling
The framework robustly tests the application's resilience by simulating extreme edge cases and server failures without touching the actual database.
- **Race Condition Prevention:** Utilizes `page.waitForResponse` to synchronize UI actions with backend API resolutions (`feedAlgorithms.spec.ts`).
- **Disaster Recovery (500/422 Errors):** Intercepts POST requests to inject mocked HTTP 422/500 errors to validate front-end error rendering (`errorHandling.spec.ts`).
- **CORS & Preflight Bypassing:** Dynamically handles `OPTIONS` preflight requests and injects `Access-Control-Allow-Origin` headers mid-air to bypass strict browser security policies during mocked responses.

### 3. API Testing, Chaining & Security
Executes lightning-fast, UI-less tests directly via Playwright's `request` API (`apiTesting.spec.ts`).
- **API Chaining:** Dynamically creates a user, extracts the authentication `Token` from the JSON response, and injects it into subsequent request headers to publish articles.
- **Security Validation:** Actively tests application endpoints with invalid tokens to ensure robust `401 Unauthorized` backend protections.
- **Data Integrity:** Performs deep JSON schema and boundary value validations on API responses.

### 4. Data-Driven Testing (DDT)
Employs a scalable DDT architecture to run multiple test permutations from a single code block (`dataDriven.spec.ts`).
- Separates test scripts from test data.
- Fetches test permutations directly from external `.json` files (`registerErrors.json`) using native Node.js implementations, ensuring maximum scalability for form validations.

### 5. Type-Safe Page Object Model (POM) & Locator Chaining
Leveraging TypeScript's strict compilation, web element locators and page-specific user flows (`HomePage.ts`, `ArticlePage.ts`) are encapsulated into dedicated, scalable classes. Complex DOM isolations are achieved via Playwright's advanced locator chaining (`.locator().filter()`), ensuring zero flakiness even in dynamic lists.


## ⚙️ How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
2. **Node.js dependencies**
   ```bash
    npm install
   ```
3. **Execute tests:**
   - To run all tests:
   ```bash
    npx playwright test
     ```
   - To run a specific test in visual (headed) mode:
   ```bash
    npx playwright test tests/apiMocking.spec.ts --headed
     ```
   - To analyze interactive test reports:
   ```bash
    npx playwright show-report
     ```


## 🚀 Project Structure

```text
├── .auth/                        # Secure directory for saved storage state (Git ignored)
├── pages/                        # Page Object Model classes
│   ├── HomePage.ts
│   └── ArticlePage.ts
├── test-data/                    # External data sources for DDT
│   └── registerErrors.json       
├── tests/                        # Modular Test Suites
│   ├── auth.setup.ts             # Initial session recording
│   ├── articleCRUD.spec.ts       # Full Create, Read, Update, Delete UI flows
│   ├── socialMechanics.spec.ts   # DOM isolation, Follow/Unfollow, Authorization UI checks
│   ├── feedAlgorithms.spec.ts    # Pagination math, Offset API validations, Network Sync
│   ├── errorHandling.spec.ts     # Network mocking, 500/422 injections, CORS handling
│   ├── apiTesting.spec.ts        # UI-less API chaining, Security (401) and Schema validations
│   └── dataDriven.spec.ts        # Data-Driven UI validations using external JSON
├── playwright.config.ts          # Global configuration (BaseURL, viewports, parallelism)
└── package.json                  # Node.js dependencies and run scripts
