import Database from "better-sqlite3";
try {
  const db = new Database("test.db");
  db.exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)");
  console.log("SUCCESS: better-sqlite3 is working");
  process.exit(0);
} catch (err) {
  console.error("FAILURE: better-sqlite3 failed:", err);
  process.exit(1);
}
