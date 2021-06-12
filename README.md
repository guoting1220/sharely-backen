# Sharely

Sharely is a single page application providing a platform where the users can share their items with other people or families in the Bay Area.

### tech stack 
frontend: React.js, Redux, Bootstrap
backend: Express, Node.js, PostgreSQL

### Installation and Setup Instructions

Clone down this repository. You will need `node` and `npm` installed globally on your machine.

##### Back End:
 cd to "sharely-backend" directory,and  install the dependencies:
    `npm install`

   Create the database and tables,  and populate the tables with sample data:
   `psql -f sharely.sql` (for windows user)

   `psql < sharely.sql` (for mac user)

   To start the server:
   `npm start`

   To run test suite:
	`npm test`


##### Front  End:
cd to "sharely-frontend", and install the dependencies:
   `npm install`

  To run the app in the development mode:
   `npm start`

   To run test suite:
	`npm test`
	
To visit app:
Open [http://localhost:3000] to view it in the browser.