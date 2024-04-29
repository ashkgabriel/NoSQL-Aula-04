import { config } from "dotenv";
import express from 'express';
import RotasPrestadores from './routes/prestador.js';
import RotasUsuarios from './routes/usuario.js';

config() // Carrega as variáveis do .env 

const app = express()
const { PORT } = process.env

app.use(express.json()) // Habilita o parse do JSON

// Rota de conteúdo público
app.use('/', express.static('public'))

// Removendo o X-Powered-By por segurança
app.disable('x-powered-by')

// Configurando o favicon
app.use('/favicon.ico', express.static('./public/images/logo-api.png'))

// Rota default
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'API FATEC 100% funcional 🚀',
        version: '1.0.0'
    })
})

// Listen
app.listen(PORT, function () {
    console.log(`💻 Servidor rodando na porta ${PORT}`);

})

// Rotas da API
app.use('/api/prestadores', RotasPrestadores)
app.use('/api/usuarios', RotasUsuarios)