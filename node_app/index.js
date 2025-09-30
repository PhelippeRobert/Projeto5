const express = require("express");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

const PORT = 3001;

const JWT_SECRET = "asdihoashdoiashdoiq1h8h0-18h081d081h0dh18idh0has0dih0asd"; // troque por algo seguro
const API_KEY = "d190981dh0891h0dihasoidhoiwh01ihd01ihd"; // sua API key estática

app.use(express.json()); // For Express 4.16.0 and above 

// Configuração do MySQL (igual ao docker-compose)
const dbConfig = {
  host: "mysql",       // nome do serviço no docker-compose
  user: "appuser",
  password: "apppass",
  database: "appdb"
};

// Middleware para verificar JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1]; // formato: "Bearer <token>"

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido ou expirado" });
    }
    req.user = user; // payload do JWT
    next();
  });
}

// Endpoint para gerar token usando API Key
app.post("/auth", (req, res) => {
  const  apiKey  = req.body.API_KEY;

  if (apiKey !== API_KEY) {
    return res.status(403).json({ error: "API Key inválida" });
  }

  // Aqui você pode incluir dados do usuário, permissões, etc.
  const payload = { role: "admin", name: "API User" };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  res.json({ token });
});

// Página inicial
app.get("/", (req, res) => {
  res.send("<h1>📖 API de Clientes com JWT + API Key</h1>");
});

// Listar clientes (protegido com JWT)
app.get("/api/v1/cliente", authenticateJWT, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM clientes");
    await connection.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔓 Listar clientes (público)
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
// 🔒 Criar cliente (protegido com JWT)
app.post("/api/v1/cliente", authenticateJWT, async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;

    if (!nome || !email || !telefone) {
      return res.status(400).json({ error: "Campos obrigatórios: nome, email, telefone" });
    }

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)",
      [nome, email, telefone]
    );
    await connection.end();

    res.status(201).json({
      message: "Cliente criado com sucesso!",
      clienteId: result.insertId,
    });
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



// 🔒 Deletar cliente (protegido com JWT)
app.delete("/api/v1/cliente/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute("DELETE FROM clientes WHERE id = ?", [id]);
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.json({ message: "Cliente deletado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Node rodando na porta ${PORT}`);
});