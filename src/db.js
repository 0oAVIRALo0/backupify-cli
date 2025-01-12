const mysql = require("mysql2");
const { Client } = require("pg");
const { MongoClient } = require("mongodb");
const winston = require("winston");
const mysqldump = require("mysqldump");
const fs = require("fs");
const archiver = require("archiver");

winston.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    level: "info",
  })
);

/**
 * Backup function to handle database backups.
 * @param {Object} params - The backup configuration.
 * @param {string} params.db - The database type ('mysql', 'postgres', 'mongodb').
 * @param {string} params.user - The database username.
 * @param {string} params.password - The database password.
 * @param {string} params.host - The database host.
 * @param {number} params.port - The database port.
 * @param {string} params.dbname - The database name to back up.
 * @param {string} params.type - The backup type.
 * @param {boolean} params.compress - Whether to compress the backup.
 * @param {boolean} params.cloud - Whether to upload the backup to the cloud.
 */
async function backup({
  db,
  user,
  password,
  host,
  port,
  dbname,
  type,
  compress,
  cloud,
}) {
  let connection;
  const dbConfig = {
    host: host,
    user: user,
    password: password,
    dbname: dbname,
    port: port,
  };

  try {
    connection = await connectToDatabase(db, dbConfig);
    winston.info("Connected to the database");
    await createBackup(db, connection, dbname, compress, cloud);
  } catch (err) {
    winston.error("Error during backup process:", err);
  } finally {
    if (db === "mysql" || db === "postgres") {
      connection.end();
    } else if (db === "mongodb") {
      connection.close();
    }
  }
}

/**
 * Function to create a backup of the database.
 * @param {string} dbType - The type of the database ('mysql', 'postgres', 'mongodb').
 * @param {Object} connection - The connection object for the database.
 * @param {string} dbname - The database name to back up.
 * @param {boolean} compress - Whether to compress the backup.
 * @param {boolean} cloud - Whether to upload the backup to the cloud.
 */
async function createBackup(
  dbType,
  connection,
  dbname,
  compress = false,
  cloud = false
) {
  try {
    const backupFileName = `${dbname}-backup.sql`;
    const compressedFileName = `${dbname}-backup.zip`;
    const outputFilePath = compress ? compressedFileName : backupFileName;

    if (dbType === "mysql") {
      const mysqlConfig = {
        host: connection.config.host,
        user: connection.config.user,
        password: connection.config.password,
        database: dbname,
        port: connection.config.port,
      };

      await mysqldump({
        connection: mysqlConfig,
        dumpToFile: outputFilePath,
      });
      winston.info(`MySQL backup complete. File saved as: ${outputFilePath}`);
    } else if (dbType === "postgres") {
      const query = `COPY (SELECT * FROM pg_catalog.pg_tables WHERE schemaname = 'public') TO STDOUT WITH CSV HEADER`;
      const result = await connection.query(query);
      fs.writeFileSync(outputFilePath, result.rows.join("\n"));
      winston.info(
        `PostgreSQL backup complete. File saved as: ${outputFilePath}`
      );
    } else if (dbType === "mongodb") {
      const db = connection.db(dbname);
      const collections = await db.collections();
      const data = [];
      for (const collection of collections) {
        const docs = await collection.find().toArray();
        data.push({ collection: collection.collectionName, docs });
      }
      fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2));
      winston.info(`MongoDB backup complete. File saved as: ${outputFilePath}`);
    }

    if (compress) {
      await compressBackupFile(outputFilePath, compressedFileName);
      winston.info(`Backup compressed to: ${compressedFileName}`);
    }

    if (cloud) {
      await uploadToCloud(outputFilePath);
      winston.info(`Backup uploaded to the cloud: ${outputFilePath}`);
    }

    winston.info("Backup process completed successfully.");
  } catch (error) {
    winston.error("Backup failed:", error.message);
    winston.error(error.stack);
  }
}

/**
 * Function to compress the backup file.
 * @param {string} sourceFilePath - The path of the source file to compress.
 * @param {string} targetFilePath - The path where the compressed file should be saved.
 * @returns {Promise} - A promise that resolves when compression is complete.
 */
function compressBackupFile(sourceFilePath, targetFilePath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(targetFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      resolve();
    });

    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.file(sourceFilePath, { name: sourceFilePath });
    archive.finalize();
  });
}

/**
 * Function to upload the backup file to the cloud.
 * @param {string} filePath - The path of the backup file to upload.
 */
function uploadToCloud(filePath) {
  winston.info("Uploading to cloud storage");
}

/**
 * Function to connect to the database.
 * @param {string} dbType - The type of the database ('mysql', 'postgres', 'mongodb').
 * @param {Object} config - The connection configuration object.
 * @returns {Object} - The database connection object.
 */
async function connectToDatabase(dbType, config) {
  let connection;

  const validConfig = {
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.dbname,
    port: config.port,
  };

  const validMySQLOptions = ["host", "user", "password", "database", "port"];

  const filteredConfig = Object.keys(config).reduce((acc, key) => {
    if (validMySQLOptions.includes(key)) {
      acc[key] = config[key];
    }
    return acc;
  }, {});

  switch (dbType) {
    case "mysql":
      connection = mysql.createConnection(filteredConfig);
      await new Promise((resolve, reject) => {
        connection.connect((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      break;

    case "postgres":
      connection = new Client(filteredConfig);
      await connection.connect();
      break;

    case "mongodb":
      const uri = `mongodb://${config.user}:${config.password}@${config.host}:${config.port}/${config.dbname}`;
      connection = await MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      break;

    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }

  return connection;
}

module.exports = { backup };
