const moment = require("moment");

module.exports = function(eleventyConfig) {
  // add dotenv variables
  require("dotenv").config();

  // date filter
  eleventyConfig.addNunjucksFilter("date", function(date, format) {
    return moment(date).format(format);
  });

  // Base config
  return {
    dir: {
      input: "src",
      output: "dist"
    }
  };
};
