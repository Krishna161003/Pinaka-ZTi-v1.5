const express = require("express");
const session = require("express-session");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const authRoutes = require("./authRoutes"); // Adjust the path as needed
const cors = require("cors");
const loginRoutes = require("./loginRoutes"); // New file for login
const nodemailer = require("nodemailer"); // Import nodemailer library
const bcrypt = require("bcrypt"); // Import bcrypt library
require("dotenv").config(); // Load environment variables
const https = require('https');
const fs = require('fs');
const { exec } = require("child_process");
const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", loginRoutes); // Use the login routes
app.use("/api", authRoutes);

// Use session middleware (if you are using sessions for authentication)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key", // Use environment variable or fallback
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);





// In server.js
app.get("/api/check-password-status/:userId", (req, res) => {
  const { userId } = req.params;

  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
  });

  db.connect((err) => {
    if (err) {
      console.error("Error connecting to the database:", err);
      return res.status(500).send({ message: "Error connecting to the database", error: err });
    }

    db.query(
      "SELECT update_pwd_status FROM users WHERE id = ?",
      [userId],
      (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send({ message: "Database query error", error: err });
        }

        if (results.length === 0) {
          return res.status(404).send({ message: "User not found" });
        }

        const updatePwdStatus = results[0].update_pwd_status;
        res.status(200).send({ updatePwdStatus });
      }
    );
  });
});










// /run-script API to update password and set user status
app.post("/run-script", (req, res) => {
  const { userUsername, userId, newPassword } = req.body;

  // Log received request data
  console.log("Received request body:", req.body);

  // Ensure all required fields are provided
  if (!userUsername || !userId || !newPassword) {
    return res.status(400).send({ message: "Missing required fields: userUsername, userId or newPassword" });
  }

  // Create a MySQL connection inside the route
  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
  });

  // Connect to the MySQL database
  db.connect((err) => {
    if (err) {
      console.error("Error connecting to the database:", err);
      return res.status(500).send({ message: "Error connecting to the database", error: err });
    }
    console.log("MySQL connected...");

    // Check if the user exists and get their update_pwd_status
    db.query(
      "SELECT update_pwd_status FROM users WHERE id = ?",
      [userId],
      (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).send({ message: "Database query error", error: err });
        }

        if (results.length === 0) {
          return res.status(404).send({ message: "User not found" });
        }

        const updatePwdStatus = results[0].update_pwd_status;

        // If password already updated, don't allow another update
        if (updatePwdStatus) {
          return res.status(400).send({ message: "Password already updated for this user" });
        }

        // Command to execute the shell script with the arguments in the correct order
        const command = `bash /usr/src/app/update-password.sh ${userUsername} ${userId} ${newPassword}`;

        console.log(`Executing command: ${command}`);

        // Run the shell script using exec
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send({ message: "Script execution failed", error: stderr });
          }
          console.log(`stdout: ${stdout}`);

          // After successful password update, update the database status to true
          db.query(
            "UPDATE users SET update_pwd_status = ? WHERE id = ?",
            [true, userId],
            (err, results) => {
              if (err) {
                console.error("Error updating password status:", err);
                return res.status(500).send({ message: "Failed to update password status", error: err });
              }

              console.log("Password status updated successfully");

              return res.status(200).send({ message: "Password updated and status updated to true", result: stdout });
            }
          );
        });
      }
    );
  });
});



const options = {
  key: fs.readFileSync('/etc/ssl/keycloak.key'),  // Path to your private key
  cert: fs.readFileSync('/etc/ssl/keycloak.crt') // Path to your certificate
};

app.get('/', (req, res) => {
  res.send('NODE BACKEND IS RUNNING SUCCESSFULLY!');
});

// Create a MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1); // Exit the application if the database connection fails
  }
  console.log("MySQL connected...");

  // Create users table if not exists
  const usersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY, 
      companyName VARCHAR(255),
      email VARCHAR(255),
      password VARCHAR(255),
      update_pwd_status BOOLEAN DEFAULT FALSE
    ) ENGINE=InnoDB;  -- Ensure InnoDB engine for foreign key support
  `;
  db.query(usersTableSQL, (err, result) => {
    if (err) throw err;
    console.log("Users table checked/created...");

    // Insert default user if not exists
    const defaultUserSQL = `
      INSERT IGNORE INTO users (id, companyName, email, password) 
      VALUES ('A1B2C3', 'admin', NULL, ?)
    `;
    const hashedPassword = bcrypt.hashSync('admin', 10);
    db.query(defaultUserSQL, [hashedPassword], (err, result) => {
      if (err) throw err;
      console.log("Default user ensured...");
    });
  });

  // Create all_in_one table with new fields
  const deploymentsTableSQL = `
    CREATE TABLE IF NOT EXISTS all_in_one (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id CHAR(21),
      cloudName VARCHAR(255),
      Ip VARCHAR(15),
      SkylineURL VARCHAR(255),
      CephURL VARCHAR(255),
      deployment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      bmc_ip VARCHAR(15),           
      bmc_username VARCHAR(255),   
      bmc_password VARCHAR(255)
    ) ENGINE=InnoDB;  -- Ensure InnoDB engine for foreign key support
  `;
  db.query(deploymentsTableSQL, (err, result) => {
    if (err) throw err;
    console.log("All_in_one table checked/created...");
  });

  // Create hardware_info table if not exists
  const hardwareInfoTableSQL = `
    CREATE TABLE IF NOT EXISTS hardware_info (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id CHAR(21),
      server_ip VARCHAR(15),
      cpu_cores INT,
      memory VARCHAR(50), -- e.g., '16GB', '32GB'
      disk VARCHAR(255), -- e.g., '500GB SSD, 1TB HDD'
      nic_1g INT, -- Number of 1G NICs
      nic_10g INT, -- Number of 10G NICs
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB;  -- Ensure InnoDB engine for foreign key support
  `;

  db.query(hardwareInfoTableSQL, (err, result) => {
    if (err) throw err;
    console.log("Hardware_info table checked/created...");
  });

  // Create new deployment_activity_log table
  const deploymentActivityLogTableSQL = `
    CREATE TABLE IF NOT EXISTS deployment_activity_log (
      id INT AUTO_INCREMENT PRIMARY KEY, -- S.NO
      serverid CHAR(36) UNIQUE NOT NULL, -- serverid (generate with nanoid or uuid in app code)
      user_id CHAR(36),                  -- Userid
      username VARCHAR(255),             -- username
      cloudname VARCHAR(255),            -- cloudname
      serverip VARCHAR(15),              -- serverip
      status VARCHAR(255),               -- status
      type VARCHAR(255),                 -- type
      server_vip VARCHAR(255),           -- Server_vip (can be NULL or value)
      datetime DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `;

  db.query(deploymentActivityLogTableSQL, (err, result) => {
    if (err) throw err;
    console.log("Deployment_Activity_log table checked/created...");
  });

  // Create License table
  const licenseTableSQL = `
    CREATE TABLE IF NOT EXISTS License (
      id INT AUTO_INCREMENT PRIMARY KEY, -- S.No
      license_code VARCHAR(255) UNIQUE NOT NULL, -- License_code (Primary Key)
      license_type VARCHAR(255), -- License_type
      license_period VARCHAR(255), -- License_period
      license_status VARCHAR(255), -- License_status
      server_id CHAR(36), -- Server_id (Foreign Key)
      FOREIGN KEY (server_id) REFERENCES deployment_activity_log(serverid)
    ) ENGINE=InnoDB;
  `;

  db.query(licenseTableSQL, (err, result) => {
    if (err) throw err;
    console.log("License table checked/created...");
  });

  // Create Host table
  const hostTableSQL = `
    CREATE TABLE IF NOT EXISTS Host (
      id INT AUTO_INCREMENT PRIMARY KEY, -- S.No
      user_id CHAR(36), -- User_id (Foreign Key)
      server_id CHAR(36), -- Server_id (Foreign Key)
      cloudname VARCHAR(255), -- Cloudname
      serverip VARCHAR(15), -- ServerIP
      servervip VARCHAR(255), -- ServerVIP
      role VARCHAR(255), -- Role
      license_code VARCHAR(255), -- License_code (Foreign Key)
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp
      FOREIGN KEY (user_id) REFERENCES deployment_activity_log(user_id),
      FOREIGN KEY (server_id) REFERENCES deployment_activity_log(serverid),
      FOREIGN KEY (license_code) REFERENCES License(license_code)
    ) ENGINE=InnoDB;
  `;

  db.query(hostTableSQL, (err, result) => {
    if (err) throw err;
    console.log("Host table checked/created...");
  });

  // Create Child Node table
  const childNodeTableSQL = `
    CREATE TABLE IF NOT EXISTS child_node (
      id INT AUTO_INCREMENT PRIMARY KEY, -- S.No
      user_id CHAR(36), -- User_id (Foreign Key)
      server_id CHAR(36), -- Server_id (Foreign Key)
      host_serverid VARCHAR(255), -- Host_serverid
      serverip VARCHAR(15), -- ServerIP
      role VARCHAR(255), -- Role
      license_code VARCHAR(255), -- License_code (Foreign Key)
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- Timestamp
      FOREIGN KEY (user_id) REFERENCES deployment_activity_log(user_id),
      FOREIGN KEY (server_id) REFERENCES deployment_activity_log(serverid),
      FOREIGN KEY (license_code) REFERENCES License(license_code)
    ) ENGINE=InnoDB;
  `;

  db.query(childNodeTableSQL, (err, result) => {
    if (err) throw err;
    console.log("Child Node table checked/created...");
  });
});


// Insert new deployment activity log
const { nanoid } = require('nanoid');

app.post('/api/deployment-activity-log', (req, res) => {
  const { user_id, username, cloudname, serverip, vip } = req.body;
  if (!user_id || !username || !cloudname || !serverip) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const status = 'progress';
  const type = 'host';
  const serverid = nanoid();
  const sql = `
    INSERT INTO deployment_activity_log
      (serverid, user_id, username, cloudname, serverip, status, type, vip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [serverid, user_id, username, cloudname, serverip, status, type, vip], (err, result) => {
    if (err) {
      console.error('Error inserting deployment activity log:', err);
      return res.status(500).json({ error: 'Failed to insert deployment activity log' });
    }
    // Insert license details if provided
    const { license_code, license_type, license_period } = req.body;
    if (license_code) {
      const licenseInsertSQL = `INSERT INTO License (license_code, license_type, license_period, license_status, server_id) VALUES (?, ?, ?, 'pending', ?)
        ON DUPLICATE KEY UPDATE license_type=VALUES(license_type), license_period=VALUES(license_period), server_id=VALUES(server_id)`;
      db.query(licenseInsertSQL, [license_code, license_type, license_period, serverid], (licErr) => {
        if (licErr) {
          console.error('Error inserting/updating license:', licErr);
          // Continue anyway, but log error
        }
        res.status(200).json({ message: 'Deployment activity log and license created', serverid });
      });
    } else {
      res.status(200).json({ message: 'Deployment activity log created', serverid });
    }
  });
});

// Update deployment activity log status to completed
app.patch('/api/deployment-activity-log/:serverid', (req, res) => {
  const { serverid } = req.params;
  const { status } = req.body;
  const newStatus = status || 'completed';
  const sql = `UPDATE deployment_activity_log SET status = ? WHERE serverid = ?`;
  db.query(sql, [newStatus, serverid], (err, result) => {
    if (err) {
      console.error('Error updating deployment activity log:', err);
      return res.status(500).json({ error: 'Failed to update deployment activity log' });
    }
    res.status(200).json({ message: `Deployment activity log updated to ${newStatus}` });
  });
});

// API to transfer completed deployment to appropriate table
app.post('/api/finalize-deployment/:serverid', (req, res) => {
  const { serverid } = req.params;
  const { server_type, role, host_serverid } = req.body;

  // First get the deployment data
  const getDeploymentSQL = `SELECT * FROM deployment_activity_log WHERE serverid = ? AND status = 'completed'`;

  db.query(getDeploymentSQL, [serverid], (err, results) => {
    if (err) {
      console.error('Error fetching deployment:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Deployment not found or not completed' });
    }

    const deployment = results[0];

    // Fetch license_code for the serverid from License table
    const licenseQuery = 'SELECT license_code FROM License WHERE server_id = ? LIMIT 1';
    db.query(licenseQuery, [deployment.serverid], (licErr, licResults) => {
      if (licErr) {
        console.error('Error fetching license_code:', licErr);
        return res.status(500).json({ error: 'Failed to fetch license_code' });
      }
      const licenseCodeToUse = licResults.length > 0 ? licResults[0].license_code : null;

      // Update license status to 'activated' and timestamp
      if (licenseCodeToUse) {
        const updateLicenseSQL = `UPDATE License SET license_status = 'activated', license_period = license_period, server_id = ?, activated_at = NOW() WHERE license_code = ?`;
        db.query(updateLicenseSQL, [deployment.serverid, licenseCodeToUse], (licUpdateErr) => {
          if (licUpdateErr) {
            console.error('Error updating license status:', licUpdateErr);
          }
        });
      }

      if (server_type === 'host') {
        // Insert into Host table
        const hostSQL = `
          INSERT INTO Host (user_id, server_id, cloudname, serverip, servervip, role, license_code)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(hostSQL, [
          deployment.user_id,
          deployment.serverid,
          deployment.cloudname,
          deployment.serverip,
          deployment.server_vip,
          role || 'host',
          licenseCodeToUse
        ], (err) => {
          if (err) {
            console.error('Error creating host record:', err);
            return res.status(500).json({ error: 'Failed to create host record' });
          }
          res.json({ message: 'Host record created successfully' });
        });
      } else if (server_type === 'child') {
        // Insert into child_node table
        const childSQL = `
          INSERT INTO child_node (user_id, server_id, host_serverid, serverip, role, license_code)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(childSQL, [
          deployment.user_id,
          deployment.serverid,
          host_serverid || '',
          deployment.serverip,
          role || 'child',
          licenseCodeToUse
        ], (err) => {
          if (err) {
            console.error('Error creating child node record:', err);
            return res.status(500).json({ error: 'Failed to create child node record' });
          }
          res.json({ message: 'Child node record created successfully' });
        });
      } else {
        return res.status(400).json({ error: 'Invalid server_type. Must be "host" or "child"' });
      }
    });
  });


  // Get latest in-progress deployment activity log for a user
  app.get('/api/deployment-activity-log/latest-in-progress/:user_id', (req, res) => {
    const { user_id } = req.params;
    const sql = `
    SELECT * FROM deployment_activity_log
    WHERE user_id = ? AND status = 'progress' AND type = 'host'
    ORDER BY datetime DESC LIMIT 1
  `;
    db.query(sql, [user_id], (err, results) => {
      if (err) {
        console.error('Error fetching deployment activity log:', err);
        return res.status(500).json({ error: 'Failed to fetch deployment activity log' });
      }
      if (results.length > 0) {
        res.status(200).json({ inProgress: true, log: results[0] });
      } else {
        res.status(200).json({ inProgress: false });
      }
    });
  });

  // Nodemailer setup
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  app.post("/check-cloud-name", async (req, res) => {
    const { cloudName } = req.body;

    try {
      const existingCloud = await new Promise((resolve, reject) => {
        const query = "SELECT * FROM deployment_activity_log WHERE cloudname = ?";
        db.query(query, [cloudName], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      if (existingCloud.length > 0) {
        return res.status(400).json({ message: "Cloud name already exists. Please choose a different name." });
      }

      res.status(200).json({ message: "Cloud name is available." });
    } catch (error) {
      console.error("Error checking cloud name:", error);
      res.status(500).json({ message: "An error occurred while checking the cloud name." });
    }
  });

  app.post('/store-user-id', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const sql = 'INSERT IGNORE INTO users (id) VALUES (?)';
    db.query(sql, [userId], (err) => {
      if (err) return res.status(500).json({ message: 'Error storing user ID' });
      res.status(200).json({ message: 'User ID stored successfully' });
    });
  });


  // API to fetch bmc data from the `all_in_one` table
  app.post("/api/get-power-details", (req, res) => {
    const { userID } = req.body;

    if (!userID) {
      return res.status(400).json({ error: "Missing userID" });
    }

    // Query to fetch data
    const query = "SELECT bmc_ip AS ip, bmc_username AS username, bmc_password AS password, cloudName FROM all_in_one WHERE user_id = ?";
    db.query(query, [userID], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ error: "Database query failed" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "No data found for the given userID" });
      }

      // Return all matching records
      res.json(results);  // Return the entire results array
    });
  });



  app.post("/register", async (req, res) => {
    const { companyName, email, password } = req.body;

    try {
      // Check if the email already exists
      const existingUser = await new Promise((resolve, reject) => {
        const checkEmailSql = "SELECT * FROM users WHERE email = ?";
        db.query(checkEmailSql, [email], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Email already exists !" });
      }

      // Dynamically import nanoid with custom alphabet
      const { customAlphabet } = await import("nanoid");
      const nanoid = customAlphabet("ABCDEVSR0123456789abcdefgzkh", 6);
      const id = nanoid(); // Generate unique ID with custom alphabet

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const sql =
        "INSERT INTO users (id, companyName, email, password) VALUES (?, ?, ?, ?)";
      await new Promise((resolve, reject) => {
        db.query(sql, [id, companyName, email, hashedPassword], (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });


      // Set the user session after registration
      req.session.userId = id;

      // Send registration email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        cc: ["support@pinakastra.cloud"],
        subject: "Welcome to Pinakastra!",
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
      
      <!-- Banner/Header -->
      <div style="background-color: #002147; padding: 20px; text-align: center;">
        <img src="https://pinakastra.com/assets/images/logo/logo.png" alt="Pinakastra" style="height: 50px;">
      </div>
      
      <!-- Main Content -->
      <div style="background-color: #f5f5f5; padding: 30px; text-align: center;">
        <h2 style="color: #1f75b6;">Welcome to Pinakastra!</h2>
        <p style="font-size: 16px; color: #333;">
          Hello <strong>${companyName}</strong>,
        </p>
        <p style="font-size: 16px; color: #333;">
          Thank you for joining us! Your account has been successfully registered.
        </p>
        <div style="background-color: #ffffff; border-radius: 10px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <p style="font-size: 14px; color: #555; margin: 0;">
            <strong>Your User ID :</strong>
          </p>
          <p style="font-size: 16px; color: #333; margin: 10px 0;">
          </p>
          <p style="font-size: 24px; color: #1f75b6; font-weight: bold; margin: 0;">
            ${id}
          </p>
        </div>
        <p style="font-size: 14px; color: #555;">
          Please keep this information secure.
        </p>
        <p style="font-size: 14px; color: #555;">
          If you have any questions or need assistance, feel free to contact our support team.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #002147; padding: 10px; text-align: center; color: #fff;">
        <p style="margin: 0;">Pinakastra Cloud </p>
        <p style="margin: 0;">
          <a href="mailto:cloud@pinakastra.com" style="color: #ffeb3b; text-decoration: none;">support@pinakastra.cloud</a>
        </p>
        <div style="margin-top: 10px;">
          <a href="https://www.facebook.com/profile.php?id=61552535922993&mibextid=kFxxJD" style="margin: 0 5px; color: #fff; text-decoration: none;">Facebook</a>
          <a href="https://x.com/pinakastra" style="margin: 0 5px; color: #fff; text-decoration: none;">X</a>
          <a href="https://linkedin.com/company/pinakastra-computing" style="margin: 0 5px; color: #fff; text-decoration: none;">LinkedIn</a>
        </div>
        <p style="margin-top: 10px; font-size: 12px;">&copy; Copyright  2021, All Right Reserved Pinakastra</p>
      </div>
    </div>
  `
      };

      await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            reject(error);
          } else {
            console.log("Email sent:", info.response);
            resolve(info);
          }
        });
      });

      res
        .status(200)
        .json({ message: "User registered successfully", userId: id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error registering user" });
    }
  });

  // Start the server with HTTPS
  https.createServer(options, app).listen(5000, () => {
    console.log('Node.js backend is running on HTTPS at port 5000');
  });
});
