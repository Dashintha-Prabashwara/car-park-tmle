import mysql from "mysql2/promise";

declare global {
  var _mysqlPool: mysql.Pool | undefined;
}

/**
 * Creates or retrieves a cached MySQL Connection Pool.
 * Supports connection via MYSQL_URI / DATABASE_URL or discrete MYSQL_* variables.
 */
export function getPool(): mysql.Pool {
  if (global._mysqlPool) {
    return global._mysqlPool;
  }

  const uri = process.env.MYSQL_URI || process.env.DATABASE_URL;

  let pool: mysql.Pool;

  if (uri) {
    pool = mysql.createPool({
      uri,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  } else {
    const host = process.env.MYSQL_HOST || "localhost";
    const port = Number(process.env.MYSQL_PORT) || 3306;
    const user = process.env.MYSQL_USER || "root";
    const password = process.env.MYSQL_PASSWORD || "";
    const database = process.env.MYSQL_DATABASE || "smartpark";
    const ssl = process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined;

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      ssl,
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }

  if (process.env.NODE_ENV !== "production") {
    global._mysqlPool = pool;
  }

  return pool;
}

export default getPool;
