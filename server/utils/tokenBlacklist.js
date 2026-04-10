// Shared in-memory token blacklist
// Replace with Redis in production
const tokenBlacklist = new Set();
module.exports = tokenBlacklist;
