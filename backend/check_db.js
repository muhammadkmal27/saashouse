const { Client } = require('pg');

async function checkProject() {
  const client = new Client({
    connectionString: "postgres://postgres:postgres@localhost:5432/saas_house"
  });
  
  try {
    await client.connect();
    const res = await client.query('SELECT title, requirements, client_edit_allowed FROM projects ORDER BY created_at DESC LIMIT 1');
    console.log("LAST PROJECT DATA:");
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error("DB ERROR:", err);
  } finally {
    await client.end();
  }
}

checkProject();
