// MongoDB initialization script for EduPrep Platform
// This script creates the necessary databases and users

// Create databases for each service
db = db.getSiblingDB("eduprep_auth");
db.createCollection("users");
db.users.createIndex({ email: 1 }, { unique: true });

db = db.getSiblingDB("eduprep_qbank");
db.createCollection("questions");
db.createCollection("categories");

db = db.getSiblingDB("eduprep_test");
db.createCollection("tests");
db.createCollection("results");

db = db.getSiblingDB("eduprep_analytics");
db.createCollection("events");
db.createCollection("metrics");

db = db.getSiblingDB("eduprep_payment");
db.createCollection("subscriptions");
db.createCollection("transactions");

print(
  "MongoDB initialization complete - all databases and collections created",
);
