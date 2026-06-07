const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { createCanvas } = require ('canvas');
const app = express();
const PORT = 3000;

// Configura middlewares para ler JSON e servir a pasta atual (onde está o index.html)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname))); // Permite abrir o index.html direto no navegador

// 1. CONEXÃO COM O SQLITE e CRIAÇÃO DA TABELA
const db = new sqlite3.Database('./banco.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        
        // Cria a tabela automaticamente caso ela não exista
        db.run(`CREATE TABLE IF NOT EXISTS leituras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperatura REAL,
            umidade REAL,
            datahora TEXT DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Erro ao criar tabela:', err.message);
            else console.log('Tabela "leituras" verificada/criada com sucesso.');
        });
    }
});

// 2. ROTA ONDE O ESP32 ENVIA OS DADOS (Modificada para SALVAR no banco)
app.post('/sensor', (req, res) => {
    // Pega as variáveis que o ESP32 está enviando (ajuste os nomes se necessário)
    const { temperatura, umidade } = req.body;

    console.log(`=== Dados Recebidos: Temp: ${temperatura}°C | Umidade: ${umidade}% ===`);

    // Insere os dados recebidos no banco de dados SQLite
    const sql = `INSERT INTO leituras (temperatura, umidade, datahora) VALUES (?, ?, datetime('now', 'localtime'))`;
    
    db.run(sql, [temperatura, umidade], function(err) {
        if (err) {
            console.error('Erro ao salvar no banco:', err.message);
            return res.status(500).send('Erro interno ao salvar os dados.');
        }
        
        console.log(`Dados salvos no banco com o ID: ${this.lastID}`);
        res.status(200).send('Dados recebidos e salvos com sucesso!');
    });
});

// 3. ROTA QUE O INDEX.HTML BUSCA PARA EXIBIR NA TABELA
app.get('/api/dados', (req, res) => {
    const sql = "SELECT id, temperatura, umidade, datahora FROM leituras ORDER BY id DESC LIMIT 50";
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Erro no SELECT do SQLite:", err.message);
            return res.status(500).json({ error: `Erro no SQLite: ${err.message}` });
        }
        res.json(rows); // Envia a lista para o index.html
    });
});
// Adicione esta rota no seu server.js
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Endpoint que gera o gráfico em formato de imagem (PNG)
app.get('/grafico.png', (req, res) => {
    // Busca as últimas 10 leituras de temperatura e umidade
    const query = `SELECT temperatura, umidade, datahora FROM leituras ORDER BY id DESC LIMIT 10`;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).send('Erro ao buscar dados');
            return;
        }
        
        // Inverte para exibir em ordem cronológica (esquerda para a direita)
        const dados = rows.reverse();

        // Configuração do Canvas (Largura x Altura)
        const largura = 600;
        const altura = 400;
        const canvas = createCanvas(largura, altura);
        const ctx = canvas.getContext('2d');

        // Fundo do gráfico
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, largura, altura);

        // Configurações de margem e eixos
        const margem = 50;
        const larguraGrafico = largura - (margem * 2);
        const alturaGrafico = altura - (margem * 2);

        // Desenha os eixos X e Y
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margem, margem);
        ctx.lineTo(margem, altura - margem);
        ctx.lineTo(largura - margem, altura - margem);
        ctx.stroke();

        if (dados.length === 0) {
            ctx.fillStyle = '#000000';
            ctx.fillText('Sem dados disponíveis', largura / 2 - 50, altura / 2);
            enviarImagem(canvas, res);
            return;
        }

        // Espaçamento entre os pontos do ESP32
        const passoX = larguraGrafico / (dados.length - 1 || 1);

        // Função auxiliar para mapear valores nos eixos (escala de 0 a 100)
        const obterY = (valor) => (altura - margem) - ((valor / 100) * alturaGrafico);

        // --- Desenha a Linha de Temperatura (Vermelha) ---
        ctx.strokeStyle = '#ff0000';
        ctx.beginPath();
        dados.forEach((dado, index) => {
            const x = margem + (index * passoX);
            const y = obterY(dado.temperatura);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // --- Desenha a Linha de Umidade (Azul) ---
        ctx.strokeStyle = '#0000ff';
        ctx.beginPath();
        dados.forEach((dado, index) => {
            const x = margem + (index * passoX);
            const y = obterY(dado.umidade);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // --- Desenha Legendas e Horários ---
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        
        dados.forEach((dado, index) => {
            const x = margem + (index * passoX);
            // Desenha o horário rotacionado ou simplificado para não sobrepor
            ctx.save();
            ctx.translate(x, altura - margem + 15);
            ctx.rotate(Math.PI / 4);
            // Exibe apenas HH:MM tratando caso o dado venha vazio ou como texto
const textoHora = dado.datahora ? dado.datahora.toString().substring(11, 16) : '';
ctx.fillText(textoHora, 0, 0);

            ctx.restore();
        });

        // Legenda de cores
        ctx.fillStyle = '#ff0000';
        ctx.fillText('■ Temperatura (°C)', margem, 30);
        ctx.fillStyle = '#0000ff';
        ctx.fillText('■ Umidade (%)', margem + 150, 30);

        // Envia a imagem gerada
        enviarImagem(canvas, res);
    });
});

function enviarImagem(canvas, res) {
    res.setHeader('Content-Type', 'image/png');
    canvas.createPNGStream().pipe(res);
}


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
});
