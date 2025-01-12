# backupify

A simple command-line tool to back up MySQL, PostgreSQL, and MongoDB databases. It supports options for compression and cloud storage upload.

## Installation

To install this package globally, run the following command:

```bash
npm install -g backupify
```

## Usage

backupify --db <db> --user <user> --password <password> --host <host> --port <port> --dbname <dbname> --compress --cloud

# backupify

A simple command-line tool to back up MySQL, PostgreSQL, and MongoDB databases. It supports options for compression and cloud storage upload.

## Installation

To install this package globally, run the following command:

```bash
npm install -g backupify

```

## Usage

### Backing up the database

```bash
backupify --db <db> --user <user> --password <password> --host <host> --port <port> --dbname <dbname> --compress --cloud

```

### Options:

- `d, --db <db>`: **Database type** (mysql, postgres, mongodb).
- `u, --user <user>`: **Database username**.
- `p, --password <password>`: **Database password**.
- `h, --host <host>`: **Database host**.
- `P, --port <port>`: **Database port** (default is 3306 for MySQL).
- `n, --dbname <dbname>`: **Database name** to back up.
- `t, --type <type>`: **Backup type** (full, incremental, differential).
- `c, --compress`: **Compress the backup** file into a zip archive.
- `-cloud`: **Upload the backup to cloud storage** (coming soon).

### Example

```bash
backupify --db mysql --user root --password mypassword --host localhost --port 3306 --dbname mydb --compress --cloud

```

This will back up the `mydb` MySQL database running on `localhost` to a compressed zip file and upload it to cloud storage (if cloud functionality is implemented).

### How It Works:

1. **MySQL Backup**: A full database dump is created using `mysqldump`. The dump is saved to a `.sql` file (or compressed `.zip` file if `-compress` is used).
2. **PostgreSQL Backup**: The tables from the `public` schema are exported to a CSV file, saved to the backup path.
3. **MongoDB Backup**: All documents from each collection are exported as a JSON file.
4. **Compression**: Optionally, the backup file can be compressed into a `.zip` file using `archiver`.
5. **Cloud Upload**: While the cloud upload feature is not yet implemented, the `-cloud` flag is reserved for future use to upload backups to cloud storage.

## Example Scenarios

- **Full Backup (with compression)**:

  ```bash
  backupify --db mysql --user root --password secret --host localhost --port 3306 --dbname mydb --compress

  ```

- **Backup to Cloud (coming soon)**:

  ```bash
  backupify --db postgres --user admin --password secret --host localhost --port 5432 --dbname testdb --compress --cloud

  ```

## How to Contribute

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add feature'`).
5. Push to the branch (`git push origin feature-name`).
6. Create a new Pull Request.

## License

MIT License

---

## Troubleshooting

If you encounter any issues, here are a few things you can check:

1. **Database Connectivity**: Ensure that the database host, port, username, and password are correct.
2. **File Permissions**: Ensure that you have the appropriate permissions to read from the database and write to the destination folder (e.g., Downloads).
3. **Backup Type**: The backup type is set to `full` by default. If you're running incremental or differential backups, make sure your database supports that type.
4. **Cloud Upload**: Cloud upload functionality is reserved for future implementation. Please refer to the documentation when this feature is available.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
