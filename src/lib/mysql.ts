import mysql from "mysql2/promise";

declare global {
  var _mysqlPool: mysql.Pool | undefined;
}

export function getPool(): mysql.Pool {
  if (global._mysqlPool) {
    return global._mysqlPool;
  }

  const uri = process.env.MYSQL_URI || process.env.DATABASE_URL;

  const common = {
    waitForConnections: true,
    connectionLimit: 5,      // was 10; serverless instances multiply this
    maxIdle: 5,
    idleTimeout: 30000,      // drop idle connections before TiDB does
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  };

  let pool: mysql.Pool;

  if (uri) {
    pool = mysql.createPool({ uri, ...common });
  } else {
    const host = process.env.MYSQL_HOST || "localhost";
    const port = Number(process.env.MYSQL_PORT) || 3306;
    const user = process.env.MYSQL_USER || "root";
    const password = process.env.MYSQL_PASSWORD || "";
    const database = process.env.MYSQL_DATABASE || "smartpark";
    const ssl =
      process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined;

    pool = mysql.createPool({ host, port, user, password, database, ssl, ...common });
  }

  global._mysqlPool = pool;   // always cache, in production too
  return pool;
}

export default getPool;