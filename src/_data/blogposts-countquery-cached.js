// required packages
const axios = require("axios");
const path = require("path");
const flatCache = require("flat-cache");

// Config
const itemsPerRequest = 1;
const cacheFolder = path.resolve("./_datacache");

// make DatoCMS request
async function makeDatoRequest(query) {
  const request = await axios({
    url: "https://graphql.datocms.com/",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.DATOCMS_TOKEN}`,
    },
    data: {
      query: `${query}`,
    },
  });

  const data = await request.data;
  return data;
}

// count blogposts
async function countBlogposts() {
  const query = `{
    _allBlogpostsMeta {
      count
    }
  }`;

  // load cache
  let cache = flatCache.load("blogposts-count.json", cacheFolder);
  const cachedCount = cache.getKey("total");

  // if we have a cache, return cached data
  if (cachedCount) {
    console.log("Count from cache");
    // return cached count
    return cachedCount;
  }

  // if no cached data
  const request = await makeDatoRequest(query);
  const count = request.data._allBlogpostsMeta.count;
  // set and save cache
  cache.setKey("total", count);
  cache.save(true);
  // return count
  console.log("Count from API");
  return count;
}

// get blogposts
async function getBlogposts() {
  // load cache
  let cache = flatCache.load("blogposts.json", cacheFolder);
  const cachedItems = cache.getKey("items");

  // if we have a cache, return cached data
  if (cachedItems) {
    console.log("Blogposts from cache");
    return cachedItems;
  }

  // if we do not, make queries
  console.log("Blogposts from API");
  const TotalItems = await countBlogposts();
  const totalRequests = Math.ceil(TotalItems / itemsPerRequest);

  let allItems = [];
  let skip = 0;

  for (let i = 0; i < totalRequests; i++) {
    const query = `{
      allBlogposts (
        skip: ${skip}
        first: ${itemsPerRequest}
      )
      {
        title
      }
    }`;
    const request = await makeDatoRequest(query);
    skip += itemsPerRequest;
    allItems.push(request.data.allBlogposts);
  }

  // set and save cache
  cache.setKey("items", allItems);
  cache.save(true);

  return allItems;
}

// module.exports = getBlogposts;
