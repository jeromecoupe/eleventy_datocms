// required packages
const moment = require("moment");
require("dotenv").config();

module.exports = function(eleventyConfig) {
  // date filter
  eleventyConfig.addNunjucksFilter("date", function(date, format) {
    return moment(date).format(format);
  });

  // limit filter
  eleventyConfig.addNunjucksFilter("limit", function(array, limit) {
    return array.slice(0, limit);
  });

  // Base config
  return {
    dir: {
      input: "src",
      output: "dist"
    }
  };
};
