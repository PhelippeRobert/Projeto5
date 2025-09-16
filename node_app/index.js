const express = require("express");
const mysql = require("mysql2/promise");

const app = express();

app.use(express.json());

const PORT = 3001;

// Configuração do MySQL (igual ao docker-compose)
const dbConfig = {
  host: "mysql",       // nome do serviço no docker-compose
  user: "appuser",
  password: "apppass",
  database: "appdb"
};

app.get("/api/v1/cliente", async (req, res) => {
   try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM clientes");
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/v1/cliente/:id", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM clientes where id = ?", [cliente]);
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/v1/cliente", async (req, res) => {
  try {
    const { nome, email } = req.body;
    if (!nome || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "INSERT INTO clientes (nome, email) VALUES (?, ?)",
      [nome, email]
    );
    await connection.end();

    res.status(201).json({ id: result.insertId, nome, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/v1/cliente/:id", async (req, res) => {
  try {
    const clienteId = req.params.id;
    const { nome, email } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE clientes SET nome = ?, email = ? WHERE id = ?",
      [nome, email, clienteId]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente não encontrado para atualização" });
    }

    res.status(200).json({ message: "Cliente atualizado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



app.delete("/api/v1/cliente/:id", async (req, res) => {
  try {
    const clienteId = req.params.id;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute("DELETE FROM clientes WHERE id = ?", [clienteId]);
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente não encontrado para exclusão" });
    }

    res.status(200).json({ message: "Cliente deletado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Node rodando na porta ${PORT}`);
});
