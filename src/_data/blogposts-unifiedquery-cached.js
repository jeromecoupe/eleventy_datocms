// required packages
const axios = require("axios");
const path = require("path");
const flatCache = require("flat-cache");

// Config
const itemsPerRequest = 1;
const cacheConfig = {
  key: "blogposts",
  folder: path.resolve("./_datacache"),
  file: "blogposts-onequery.json",
};

/**
 * Make DatoCMS request
 * @param {Int} skipRecords - number or records to skip
 */
async function makeDatoRequest(skipRecords = 0) {
  const request = await axios({
    url: "https://graphql.datocms.com/",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.DATOCMS_TOKEN}`,
    },
    data: {
      query: `{
        _allBlogpostsMeta {
          count
        }
        allBlogposts (
          skip: ${skipRecords}
          first: ${itemsPerRequest}
        )
        {
          title
        }
      }`,
    },
  });

  const data = await request.data;
  return data;
}

/**
 * Get blogposts
 */
async function getBlogposts() {
  // load cache
  let cache = flatCache.load(cacheConfig.file, cacheConfig.folder);
  const cachedItems = cache.getKey(cacheConfig.key);

  // if we have a cache, return cached data
  if (cachedItems) {
    console.log("Getting blogposts from cache");
    return cachedItems;
  }

  // if we do not, make queries
  console.log("Getting blogposts from API");

  // variables
  let moreRequests = [];
  let allItems = [];

  // make first request and push reults
  const request = await makeDatoRequest();
  allItems.push(request.data.allBlogposts);

  // use count to calculate if we need additonal
  // queries to get everything
  let totalItems = request.data._allBlogpostsMeta.count;
  let additionalRequests = Math.ceil(totalItems / itemsPerRequest) - 1;

  // make additional requests
  for (let i = 1; i <= additionalRequests; i++) {
    let start = i * itemsPerRequest;
    const request = makeDatoRequest(start);
    moreRequests.push(request);
  }

  // make all queries
  const allResults = await Promise.all(moreRequests);
  let moreBlogosts = allResults.map((result) => result.data.allBlogposts);
  moreBlogosts = moreBlogosts.flat();
  allItems.push(moreBlogosts);

  // set and save cache
  cache.setKey(cacheConfig.key, allItems);
  cache.save(true);

  // return API items
  return allItems;
}

module.exports = getBlogposts;
