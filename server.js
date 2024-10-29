const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

// Conectar ao banco de dados SQLite
const db = new sqlite3.Database('./territorios.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        // Criar tabelas
        db.run(`
            CREATE TABLE IF NOT EXISTS territorios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                endereco_nao_bater TEXT
            );
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS saidas_campo (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                dia_semana TEXT NOT NULL
            );
        `);
        db.run(`
            CREATE TABLE IF NOT EXISTS designacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                territorio_id INTEGER,
                saida_id INTEGER,
                data_designacao TEXT,
                data_devolucao TEXT,
                FOREIGN KEY (territorio_id) REFERENCES territorios(id),
                FOREIGN KEY (saida_id) REFERENCES saidas_campo(id)
            );
        `);
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Rotas da API

// Rotas de Territórios
app.post('/territorios', (req, res) => {
    const { nome, endereco_nao_bater } = req.body;
    db.run(
        `INSERT INTO territorios (nome, endereco_nao_bater) VALUES (?, ?)`,
        [nome, endereco_nao_bater],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

app.get('/territorios', (req, res) => {
    db.all(`SELECT * FROM territorios`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.put('/territorios/:id', (req, res) => {
    const { id } = req.params;
    const { nome, endereco_nao_bater } = req.body;
    db.run(
        `UPDATE territorios SET nome = ?, endereco_nao_bater = ? WHERE id = ?`,
        [nome, endereco_nao_bater, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ updated: this.changes });
            }
        }
    );
});

app.delete('/territorios/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM territorios WHERE id = ?`, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// Rotas de Saídas de Campo
app.post('/saidas_campo', (req, res) => {
    const { nome, dia_semana } = req.body;
    db.run(
        `INSERT INTO saidas_campo (nome, dia_semana) VALUES (?, ?)`,
        [nome, dia_semana],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

app.get('/saidas_campo', (req, res) => {
    db.all(`SELECT * FROM saidas_campo`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

app.put('/saidas_campo/:id', (req, res) => {
    const { id } = req.params;
    const { nome, dia_semana } = req.body;
    db.run(
        `UPDATE saidas_campo SET nome = ?, dia_semana = ? WHERE id = ?`,
        [nome, dia_semana, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ updated: this.changes });
            }
        }
    );
});

app.delete('/saidas_campo/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM saidas_campo WHERE id = ?`, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// Rotas de Designações
app.post('/designacoes', (req, res) => {
    const { territorioId, saidaCampoId, dataDesignacao, dataDevolucao } = req.body;
    db.run(
        `INSERT INTO designacoes (territorio_id, saida_id, data_designacao, data_devolucao) VALUES (?, ?, ?, ?)`,
        [territorioId, saidaCampoId, dataDesignacao, dataDevolucao],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ id: this.lastID });
            }
        }
    );
});

// Rota para buscar todas as designações
app.get('/designacoes', (req, res) => {
    const { territorios, saidas, dataInicial, dataFinal } = req.query;

    let query = `
        SELECT designacoes.*, 
               territorios.nome AS territorio_nome, 
               saidas_campo.nome AS saida_nome,
               territorios.endereco_nao_bater
        FROM designacoes
        JOIN territorios ON designacoes.territorio_id = territorios.id
        JOIN saidas_campo ON designacoes.saida_id = saidas_campo.id
        WHERE 1=1
    `;
    const params = [];

    if (territorios) {
        query += ` AND designacoes.territorio_id IN (${territorios.split(',').map(() => '?').join(',')})`;
        params.push(...territorios.split(','));
    }

    if (saidas) {
        query += ` AND designacoes.saida_id IN (${saidas.split(',').map(() => '?').join(',')})`;
        params.push(...saidas.split(','));
    }

    if (dataInicial) {
        query += ` AND designacoes.data_designacao >= ?`;
        params.push(dataInicial);
    }

    if (dataFinal) {
        query += ` AND designacoes.data_devolucao <= ?`;
        params.push(dataFinal);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});



app.put('/designacoes/:id', (req, res) => {
    const { id } = req.params;
    const { territorioId, saidaCampoId, dataDesignacao, dataDevolucao } = req.body;
    db.run(
        `UPDATE designacoes SET territorio_id = ?, saida_id = ?, data_designacao = ?, data_devolucao = ? WHERE id = ?`,
        [territorioId, saidaCampoId, dataDesignacao, dataDevolucao, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.json({ updated: this.changes });
            }
        }
    );
});

app.delete('/designacoes/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM designacoes WHERE id = ?`, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ deleted: this.changes });
        }
    });
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

// Configurar o transporte de e-mail
const transporter = nodemailer.createTransport({
    service: 'gmail', // Exemplo com Gmail
    auth: {
        user: 'seuemail@gmail.com',
        pass: 'suasenha'
    }
});

// Função para enviar e-mail de notificação
function enviarEmail(destinatario, assunto, mensagem) {
    const mailOptions = {
        from: 'seuemail@gmail.com',
        to: destinatario,
        subject: assunto,
        text: mensagem
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar e-mail:', error);
        } else {
            console.log('E-mail enviado:', info.response);
        }
    });
}

// Exemplo de uso ao atualizar uma saída de campo
app.put('/saidas_campo/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, dia, horario } = req.body;

    // Atualizar a saída de campo no banco de dados
    db.run(`UPDATE saidas_campo SET nome = ?, dia = ?, horario = ? WHERE id = ?`, [nome, dia, horario, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            // Enviar e-mail de notificação
            enviarEmail(
                'destinatario@exemplo.com',
                'Alteração na Saída de Campo',
                `A saída de campo "${nome}" foi atualizada para o dia ${dia} às ${horario}.`
            );
            res.json({ message: 'Saída de campo atualizada com sucesso.' });
        }
    });
});
