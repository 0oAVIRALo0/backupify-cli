#!/usr/bin/env node

const { Command } = require("commander");
const dotenv = require("dotenv");

dotenv.config();
const backup = require("../src/db");
const program = new Command();

program
  .command("backup")
  .description("Backup the database")
  .option("-d, --db <db>", "Database type (mysql, postgres, mongodb, sqlite)")
  .option("-u, --user <user>", "Username for the database")
  .option("-p, --password <password>", "Password for the database")
  .option("-h, --host <host>", "Database host")
  .option("-P, --port <port>", "Database port")
  .option("-n, --dbname <dbname>", "Database name")
  .option("-t, --type <type>", "Backup type (full, incremental, differential)")
  .option("-c, --compress", "Compress the backup file")
  .option("--cloud", "Upload the backup to cloud storage")
  .action(backup.backup);

program.parse(process.argv);
