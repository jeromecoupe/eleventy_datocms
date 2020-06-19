// required packages
const axios = require("axios");
const path = require("path");
const chalk = require("chalk");
const flatCache = require("flat-cache");

// Config
const ITEMS_PER_REQUEST = 1;
const CACHE_KEY = "blogposts";
const CACHE_FOLDER = path.resolve("./_datacache");
const CACHE_FILE = "blogposts.json";

/**
 * Request blogposts from DatoCMS
 * @param {Int} skipRecords - number or records to skip
 * @return {Array} - API data using Axios
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
          first: ${ITEMS_PER_REQUEST}
          filter: {
            _status: {eq: published}
          }
        )
        {
          id
          _createdAt
          title
          slug
          intro
          body(markdown: true)
          image {
            url
            alt
          }
          relatedBlogs {
            id
          }
        }
      }`,
    },
  });

  const data = await request.data;
  return data;
}

/**
 * Format Data coming from API
 * @param {Array} data - array of objects to format
 * @return {Array} - array of formatted and sorted objects
 */
function formatData(data) {
  const dataFormatted = data.map((item) => {
    return {
      id: item.id,
      date: item._createdAt,
      title: item.title,
      slug: item.slug,
      image: item.image.url,
      imageAlt: item.image.alt,
      summary: item.intro,
      body: item.body,
      relatedBlogs: item.relatedBlogs,
    };
  });

  dataFormatted.sort((a, b) => a.date - b.date);

  return dataFormatted;
}

/**
 * Get all blogposts
 * - check if we have a cache
 * - if not ping api and create cache
 */
async function getAllBlogposts() {
  // load cache
  const cache = flatCache.load(CACHE_FILE, CACHE_FOLDER);
  const cachedItems = cache.getKey(CACHE_KEY);

  // if we have a cache, return cached data
  if (cachedItems) {
    console.log(chalk.yellow("Blogposts from cache"));
    return cachedItems;
  }

  // if we do not, make queries
  console.log(chalk.yellow("Blogposts from API"));

  // variables
  let requests = [];
  let apiData = [];
  let additionalRequests = 0;

  try {
    // make first request and push results
    const request = await requestBlogposts();
    apiData.push(...request.data.allBlogposts);
    // check if we need additonal requests to get everything
    const totalItems = request.data._allBlogpostsMeta.count;
    additionalRequests = Math.ceil(totalItems / ITEMS_PER_REQUEST) - 1;
  } catch (err) {
    console.error(err);
  }

  // create additional requests
  for (let i = 1; i <= additionalRequests; i++) {
    let start = i * ITEMS_PER_REQUEST;
    const request = requestBlogposts(start);
    requests.push(request);
  }

  // additional requests in parallel
  try {
    const allResults = await Promise.all(requests);
    allResults.map((result) => {
      apiData.push(...result.data.allBlogposts);
    });
  } catch (err) {
    console.error(err);
  }

  // format data
  const formattedData = formatData(apiData);

  // set and save cache
  cache.setKey(CACHE_KEY, formattedData);
  cache.save();

  // return API items
  return formattedData;
}

module.exports = getAllBlogposts;
