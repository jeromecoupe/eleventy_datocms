// required packages
const axios = require("axios");

// Config
const itemsPerRequest = 1;

// make dato request
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
  const request = await makeDatoRequest(query);
  return request.data._allBlogpostsMeta.count;
}

// get blogposts
async function getBlogposts() {
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
    allItems = allItems.concat(request.data.allBlogposts);
  }

  return allItems;
}

module.exports = getBlogposts;
