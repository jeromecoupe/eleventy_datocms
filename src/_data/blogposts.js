// required packages
const fetch = require("node-fetch");

// DatoCMS token
const token = process.env.DATOCMS_TOKEN;

// GraphQL query
const blogpostsQuery = `
  {
    allBlogposts(orderBy: _createdAt_DESC, filter: {_status: {eq: published}}) {
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
  }
`;

// get blogposts
// see https://www.datocms.com/docs/content-delivery-api/first-request#vanilla-js-example
function getAllBlogposts() {
  // fetch data
  const data = fetch("https://graphql.datocms.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: blogpostsQuery
    })
  })
    // parse as JSON
    .then(res => res.json())

    // Handle JSON data
    .then(res => {
      // handle Dato CMS errors if in response
      if (res.errors) {
        res.errors.forEach(error => {
          console.log(error.message);
        });
        throw new Error("DatoCMS errors");
      }

      // get blogposts data from response
      const blogpostsData = res.data.allBlogposts;

      // format data
      const blogpostsFormatted = blogpostsData.map(item => {
        return {
          id: item.id,
          date: item._createdAt,
          title: item.title,
          slug: item.slug,
          image: item.image.url,
          imageAlt: item.image.alt,
          summary: item.intro,
          body: item.body,
          relatedBlogs: item.relatedBlogs
        };
      });

      // return formatted data
      return blogpostsFormatted;
    })
    .catch(error => {
      console.log(error);
    });

  // return data
  return data;
}

// export for 11ty
module.exports = getAllBlogposts;
