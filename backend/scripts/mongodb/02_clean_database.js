// MongoDB cleanup script for Smart Campus
// Usage: mongosh "<MONGODB_URI>" backend/scripts/mongodb/02_clean_database.js

const dbName = process.env.DB_NAME || "smartcampus_db";
const appDb = db.getSiblingDB(dbName);

const collectionsInDeleteOrder = [
  "notifications",
  "tickets",
  "bookings",
  "resources",
  "users"
];

collectionsInDeleteOrder.forEach((collectionName) => {
  if (appDb.getCollectionNames().includes(collectionName)) {
    const result = appDb.getCollection(collectionName).deleteMany({});
    print(`Cleared ${collectionName}: deleted ${result.deletedCount} document(s)`);
  } else {
    print(`Skipped ${collectionName}: collection not found`);
  }
});

print(`Database cleanup completed for database: ${dbName}`);
