module.exports = function(eleventyConfig) {
  // Copy features directory to output
  eleventyConfig.addPassthroughCopy("src/features");

  // Ignore markdown files (we're using HTML with Liquid)
  eleventyConfig.ignores.add("**/*.md");

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    // Process .html files with Liquid template engine
    htmlTemplateEngine: "liquid"
  };
};
