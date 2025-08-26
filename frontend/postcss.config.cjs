/** @type {import('postcss').Config} */
module.exports = {
  plugins: [
    require("@tailwindcss/postcss")(), // Tailwind’s PostCSS plugin
    require("autoprefixer")(), // Autoprefixer
  ],
};
