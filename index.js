const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();
const PORT =  4000;
const bodyParser = require('body-parser');
const {Pool} = require("pg"); 
app.use(bodyParser.json());
app.use(express.json());
app.use(cors()); // Enable CORS for frontend access 
// 🔹 PostgreSQL Database Connection
const db = new Pool({
  connectionString:'postgresql://postgres:jmbfLnrZzaHrrMIknbtzTJbjWatRqPKk@gondola.proxy.rlwy.net:21402/railway',
  ssl: { rejectUnauthorized: false },  // Required for Railway PostgreSQL
});
// // MySQL Database Connection
// const db = mysql.createConnection({
//     user:'root',
//     host:'localhost',
//     password:'0000',
//     database:'portfolio'
// });
db.connect((err) => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return;
    }
    console.log("Connected to MySQL");
});
// Test the database connection
db.query("SELECT NOW()", (err, res) => {
  if (err) {
      console.error("❌ Database connection failed:", err);
  } else {
      console.log("✅ Connected to PostgreSQL at:", res.rows[0].now);
  }
});
app.post('/user/submit', async (req, res) => {
  const { name, email, phone, linkedin, github, twitter, instagram, pinterest, resume } = req.body;
  const { profession, about, tech_stack,skills, hobbies,roles } = req.body;

  const { user_quote } = req.body;
  const {projects} = req.body;
  console.log("data",req.body);
  // Insert into users table
  const userSql = `
  INSERT INTO users (name, email, contact, linkedin, github, twitter, instagram, pinterest, resume)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;

  const userValues = [name, email, phone, linkedin, github, twitter, instagram, pinterest, resume];

  await db.query(userSql, userValues, (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    // const userId = result.insertId; // Get the generated user_id
    const userId = result.rows[0].id; // Get the generated user_id from PostgreSQL
    // Insert into user_introduction table
    const introSql = `
      INSERT INTO user_introduction (user_id, profession, about, tech_stacks, coding_languages) 
      VALUES ($1, $2, $3, $4, $5)`;
    const introValues = [userId, profession, about, tech_stack,skills];

    db.query(introSql, introValues, (err, result) => {
      if (err) {
        console.error("Error inserting introduction:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      // Insert into user_hobbies table
      const hobbySql = `INSERT INTO user_hobbies (user_id, hobby) VALUES ($1, $2)`;
      hobbies.forEach((hobby) => {
        db.query(hobbySql, [userId, hobby], (err, result) => {
          if (err) {
            console.error("Error inserting hobby:", err);
          }
        });
      });
      const roleSql = `INSERT INTO user_roles (user_id, role) VALUES ($1, $2)`;
      roles.forEach((role) => {
        db.query(roleSql, [userId, role], (err, result) => {
          if (err) {
            console.error("Error inserting role:", err);
          }
        });
      });
      //insert project details
      const projectSql = `INSERT INTO projects (userId, projectName,description,image,demoLink) VALUES ($1,$2,$3,$4,$5)`;
      projects.forEach((project) => {
        const projectValues = [userId, project.name, project.description,project.image,project.demoLink];
        db.query(projectSql,projectValues,(err, result) => {
          if (err) {
            console.error("Error inserting project:", err);
          }
        });
      });
      // Insert into aboutuser table
      const aboutSql = `INSERT INTO aboutuser (user_id, quote, intro) VALUES ($1, $2, $3)`;
      const aboutValues = [userId, user_quote, about];
        
      db.query(aboutSql, aboutValues, (err, result) => {
        if (err) {
          console.error("Error inserting about user:", err);
          return res.status(500).json({ success: false, message: "Database error" });
        }

        res.json({ success: true, message: "User data inserted successfully!",data:{userId} });
      });
    });
  });
});
app.put('/user/updateinfo/:id', (req, res) => {
  const userId = req.params.id;
  console.log("userId",userId);
  console.log("data",req.body);
  const {intro,quote}  = req.body.formData;
  console.log("inro",req.body.hobbies);
  const {hobbies} = req.body;
  const infoSql ='UPDATE aboutuser SET intro = ?, quote = ? WHERE user_id = ?';
  const deleteHobbySql = 'DELETE FROM user_hobbies WHERE user_id = ?';
  const insertHobbySql = 'INSERT INTO user_hobbies (user_id, hobby) VALUES (?, ?)';
  db.query(deleteHobbySql, [userId], (err, result) => {
     if(err) {
      console.error("Error deleting hobbies:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    console.log("Deleted hobbies successfully");
  })
  hobbies.forEach((hobby) => {
     db.query(insertHobbySql, [userId, hobby], (err, result) => {
      if(err) {
        console.error("Error inserting hobbies:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      console.log("Inserted hobbies successfully");
     }
  )
  });
  const infoValues = [intro,quote,userId];
  db.query(infoSql,infoValues,(err,result)=>{
    if(err){
      console.error("Error updating user:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, message: "User data updated successfully!" });
  });
});
app.put('/changeproject/:id', (req, res) => {
  const projectId = req.params.id;
  console.log("userId",projectId);
  console.log("data",req.body);
  const project = req.body;
  const projectSql = `update projects
set projectName = ?,description = ?
where id = ?;`;
  const VALUES = [project.projectName,project.description,projectId];
  db.query(projectSql,VALUES,(err,result)=>{
    if(err){
      console.error("Error updating project:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, message: "User data updated successfully!" });
  })
})
app.put('/user/updateintro/:id', (req, res) =>{
  const userId = req.params.id;
  console.log("userId",userId);
  console.log("data",req.body);
  const {profession,about,techStack,skills} = req.body;
  const introSql ='UPDATE user_introduction SET profession = ?, about = ?, tech_stacks = ?, coding_languages = ? WHERE user_id = ?';
  const introValues = [profession,about,techStack,skills,userId];
  db.query(introSql,introValues,(err,result)=>{
    if(err){
      console.error("Error updating user:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }
    res.json({ success: true, message: "User data updated successfully!" });
  });
})
// API Route to Fetch User Details
app.get("/user/:id", async (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT users.*, user_introduction.*
    FROM users
    LEFT JOIN user_introduction ON users.id = user_introduction.user_id
    WHERE users.id = $1;
  `;

  try {
      const result = await db.query(query, [userId]);

      if (result.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
      }

      res.json(result.rows[0]); // Return the user data
  } catch (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/about/:id", async (req, res) => {
  const userId = req.params.id;

  const query = `
    SELECT i.*, u.name 
    FROM aboutuser AS i
    JOIN users AS u ON u.id = i.user_id
    WHERE u.id = $1;
  `;

  try {
      const result = await db.query(query, [userId]);

      if (result.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
      }
      console.log("result",result.rows[0]);
      res.json(result.rows[0]); // Return a single user object
  } catch (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/hobby/:id", async (req, res) => {
  const userId = req.params.id;

  const query = `
      SELECT hobby 
      FROM user_hobbies
      WHERE user_id = $1;
  `;

  try {
      const result = await db.query(query, [userId]);

      if (result.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
      }
      console.log("result",result.rows[0]);
      res.json(result.rows); // Return an array of hobbies
  } catch (err) {
      console.error("Error fetching user hobbies:", err);
      return res.status(500).json({ error: "Database query failed" });
  }
});

  
app.get("/roles/:id", async (req, res) => {
  const userId = req.params.id;

  const query = `
      SELECT role 
      FROM user_roles
      WHERE user_id = $1;
  `;

  try {
      const result = await db.query(query, [userId]);

      if (result.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
      }

      res.json(result.rows); // Return an array of roles
  } catch (err) {
      console.error("Error fetching user roles:", err);
      return res.status(500).json({ error: "Database query failed" });
  }
});

app.get("/project/:id", async (req, res) => {
  const userId = req.params.id;

  const query = `
      SELECT * FROM projects
      WHERE userId = $1;
  `;

  try {
      const result = await db.query(query, [userId]);

      if (result.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
      }

      res.json(result.rows); // Return project details
  } catch (err) {
      console.error("Error fetching project:", err);
      return res.status(500).json({ error: "Database query failed" });
  }
});

app.get('/',(req,res)=>{
    res.send("Hello World");
})
// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
