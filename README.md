# dmoney-newman-b19

Automated API test runner for the **DMoney** Mobile Financial Service platform. It replays a Postman collection against the DMoney transaction API using [Newman](https://github.com/postmanlabs/newman) (Postman's CLI collection runner) and produces an HTML test report via the `htmlextra` reporter.

## Technologies

- [Node.js](https://nodejs.org/)
- [Newman](https://www.npmjs.com/package/newman) — CLI Collection Runner for Postman
- [newman-reporter-htmlextra](https://www.npmjs.com/package/newman-reporter-htmlextra) — rich HTML report generation

## Prerequisites

- Node.js (v18+ recommended)
- npm
- A Postman collection export for the DMoney project

## Clone

```bash
git clone https://github.com/meherabnowshad/SDET-b19.git
cd SDET-b19/dmoney-newman-b19
```

## Install

```bash
npm install
```

## Setup

The `collection/` directory is git-ignored (it may contain environment variables, tokens, or other sensitive values) and won't be present after a fresh clone. Add your Postman collection export before running the tests:

```bash
mkdir -p collection
# copy your exported collection into it, matching the filename used in report.js
cp /path/to/dmoney-b19.postman_collection.json collection/
```

## Run

```bash
npm test
```

This runs `report.js`, which executes the collection with Newman and writes an HTML report to `Reports/report.html`.
