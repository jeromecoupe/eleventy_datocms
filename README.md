# Testing Eleventy and GraphQL

A small example of retrieving data from a GraphQL API endpoint and using it to build static pages with Eleventy.

Using Dato CMS in this case.

## Install and run

Create a DatoCMS account.

- copy `.env.example` and rename as `.env`
- add your Dato CMS API Key to your new `.env` file
- run `npm install`
- run `npm run build` to delete the cache folder, load data from API and build the site
- run `npm runn dev` to spin a dev server and load data from cache (unless you delete the cache file / folder)
