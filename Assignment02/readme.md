# DMoney Assignment 02

A simple API automation project built for testing the DMoney backend using Postman collections and Newman.

## Project Summary
This project automates API test execution for the DMoney assignment using a Postman collection. It validates multiple customer and admin login flows, executes the requests through Newman, and generates a HTML report for results.

## Technologies Used
- JavaScript
- Node.js
- Postman
- Newman
- Newman HTML Extra Reporter

## Project Structure
- `Collection/` - Postman collection JSON file
- `Reports/` - Generated HTML test reports
- `report.js` - Node script to run the collection and export the HTML report
- `package.json` - Project dependencies and scripts

## Prerequisites
Before running the project, make sure you have installed:
- Node.js
- npm

## Clone the Project
```bash
git clone <repository-url>
cd Assignment02
```

## Install Dependencies
```bash
npm install
```

## Run the Test Collection
To run the Postman collection directly with Newman:

```bash
npx newman run Collection/dmoney-b19-Assignment02.postman_collection.json
```

## Generate HTML Report
This project also includes a script to run the collection and export a report:

```bash
node report.js
```

The report will be generated in the `Reports/` folder as `report.html`.

## Notes
- The project uses environment variables and collection variables inside the Postman collection.
- Make sure the API base URL and required secrets are available in the collection configuration before execution.
