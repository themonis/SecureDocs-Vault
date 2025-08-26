const { randomUUID } = require("crypto");

/**
 * Generates a unique UUID v4
 * @returns {string}
 */
function generateUUID() {
    return randomUUID(); // Like: '8fc2e91a-bf12-44c2-9103-1d0f3f3e9e71'
}

module.exports = generateUUID;
