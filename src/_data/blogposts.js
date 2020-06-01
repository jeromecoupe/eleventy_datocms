// required packages
const fetch = require("node-fetch");

// max number of records to fetch per query
const recordsPerQuery = 100;

// DatoCMS token
const token = process.env.DATOCMS_TOKEN;

// get blogposts
// see https://www.datocms.com/docs/content-delivery-api/first-request#vanilla-js-example
async function getAllBlogposts() {
  // number of records to skip (we start at 0)
  let recordsToSkip = 0;

  // keep querying
  let makeNewQuery = true;

  // Blogposts array
  let blogposts = [];

  while (makeNewQuery) {
    // initiate fetch
    const dato = await fetch("https://graphql.datocms.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `{
            allBlogposts(
              first: ${recordsPerQuery},
              skip: ${recordsToSkip},
              orderBy: _createdAt_DESC,
              filter: {
                _status: {eq: published}
              }
            )
            {
              id
              title
              slug
              intro
              body(markdown: true)
              _createdAt
              image {
                url
                alt
              }
              relatedBlogs {
                id
              }
            }
          }`,
      }),
    });

    // store the JSON response when promise resolves
    const response = await dato.json();

    // update our blogpost array with the data from the JSON response
    blogposts = blogposts.concat(response.data.allBlogposts);

    // prepare for next query
    recordsToSkip += recordsPerQuery;

    // check if we got back less than the records we fetch per query
    // if yes, stop querying
    if (response.data.allBlogposts.length < recordsPerQuery) {
      makeNewQuery = false;
    }
  }

  // format blogposts objects
  const blogpostsFormatted = blogposts.map((item) => {
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

  // return formatted blogposts
  return blogpostsFormatted;
}

// export for 11ty
module.exports = getAllBlogposts;
