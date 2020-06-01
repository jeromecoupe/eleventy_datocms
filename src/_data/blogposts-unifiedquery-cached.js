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
 * Request blogposts from DatoCMS
 * @param {Int} skipRecords - number or records to skip
 */
async function requestBlogposts(skipRecords = 0) {
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
 * Get all blogposts
 */
async function getAllBlogposts() {
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
  let apiItems = [];

  // make first request and push reults
  const request = await requestBlogposts();
  apiItems.push(request.data.allBlogposts);

  // use count to calculate if we need additonal
  // requests to get everything
  let totalItems = request.data._allBlogpostsMeta.count;
  let additionalRequests = Math.ceil(totalItems / itemsPerRequest) - 1;

  // make additional requests
  for (let i = 1; i <= additionalRequests; i++) {
    let start = i * itemsPerRequest;
    const request = requestBlogposts(start);
    moreRequests.push(request);
  }

  // execute all additional requests
  const allResults = await Promise.all(moreRequests);
  let moreBlogosts = allResults.map((result) => result.data.allBlogposts);
  moreBlogosts = moreBlogosts.flat();
  apiItems.push(moreBlogosts);

  // set and save cache
  cache.setKey(cacheConfig.key, apiItems);
  cache.save(true);

  // return API items
  return apiItems;
}

module.exports = getAllBlogposts;
