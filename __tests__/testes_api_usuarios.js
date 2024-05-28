
    // Testes na API de Prestadores
    // Tecnologias utilizadas:
    //     - Supertest: Biblioteca para testes na API Rest do NodeJS
    //     - dotenv: Biblioteca para gerenciar variáveis de ambiente

    const request = require('supertest')
    const dotenv = require('dotenv')

    dotenv.config() // Carrega as variáveis do .env

    const baseURL = 'http://localhost:4000/api'

    describe('API REST de Usuários sem o Token', () => {
        it('GET / - Lista todos os usuários sem o token de acesso', async () => {
            const response = await request(baseURL)
            .get('/usuarios')
            .set('Content-Type', 'application/json')
            .expect(401) // Unauthorized
        })
    })

describe('API REST de Prestadores com o Token', () => {
    let token // Armazenaremos o access_toke JWT

    it('POST / - Autenticar usuário para retornar token de acesso JWT', async () => {
        const senha = 'Alun0$'
        const response = await request(baseURL)
            .post('/usuarios/login')
            .set('Content-Type', 'application/json')
            .send({ "email": "josealves3@uol.com.br", "senha": senha })
            .expect(200) // Ok

        token = response.body.access_token
        expect(token).toBeDefined() // Recebemos o token?
    })

    it('GET - Lista todos os usuários com autenticação', async () => {
        const response = await request(baseURL)
            .get('/usuarios')
            .set('Content-Type', 'application/json')
            .set('access-token', token) // Inclui o token na chamada
            .expect(200) // Ok

        const usuarios = response.body
        expect(usuarios).toBeInstanceOf(Array)
    })

})