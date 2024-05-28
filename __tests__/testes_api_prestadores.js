
    // Testes na API de Prestadores
    // Tecnologias utilizadas:
    //     - Supertest: Biblioteca para testes na API Rest do NodeJS
    //     - dotenv: Biblioteca para gerenciar variáveis de ambiente

    const request = require('supertest')
    const dotenv = require('dotenv')

    dotenv.config() // Carrega as variáveis do .env

    const baseURL = 'http://localhost:4000/api'

    describe('API REST de Prestadores sem o Token', () => {
        it('GET - Lista todos os prestadores sem o token de acesso', async () => {
            const response = await request(baseURL)
            .get('/prestadores')
            .set('Content-Type', 'application/json')
            .expect(401) // Unauthorized
        })

        it('GET - Obtém o prestador pelo ID sem o token de acesso', async () => {
            const id = '65ef9588fa0477e499de2d8a'
            const response = await request(baseURL)
            .get(`/prestadores/id/${id}`)
            .set('Content-Type', 'application/json')
            .expect(401) // Unauthorized
        })
        
        it('GET - Obtém o prestador pela razão sem o token de acesso', async () => {
            const razao = 'CHACARA SAO GABRIEL 5 LTDA'
            const response = await request(baseURL)
            .get(`/prestadores/razao/${razao}`)
            .set('Content-Type', 'application/json')
            .expect(401) // Unauthorized
        })

    })

    describe('API REST de Prestadores COM o Token', () => {
        let token // Armazenaremos o access_toke JWT
        
        it('POST / - Autenticar usuário para retornar token de acesso JWT', async () => {
            const senha = process.env.SENHA_USUARIO
            const response = await request(baseURL)
            .post('/usuarios/login')
            .set('Content-Type', 'application/json')
                .send({ "email": "josealves3@uol.com.br", "senha": senha})
            .expect(200) // Ok

            token = response.body.access_token
            expect(token).toBeDefined() // Recebemos o token?
        })

        it('GET - Lista todos os prestadores com autenticação', async () => {
            const response = await request(baseURL)
                .get('/prestadores')
                .set('Content-Type', 'application/json')
                .set('access-token', token) // Inclui o token na chamada
                .expect(200) // Ok

            const prestadores = response.body
            expect(prestadores).toBeInstanceOf(Array)
        })

        dadosPrestador = {
            "cnpj": "13938578000162",
            "razao_social": "TIGRINHO 2 LTDA",
            "cep": "01536000",
            "endereco": {
                "logradouro": "Av. Lacerda Franco",
                "numero": "946",
                "bairro": "Aclimação",
                "cidade": "São Paulo",
                "uf": "SP"
            },
            "cnae_fiscal": 321453,
            "nome_fantasia": "Tigrinho 2",
            "data_inicio_atividade": "2011-05-01",
            "localizacao": {
                "type": "Point",
                "coordinates": [-23.2904, -47.2963]
            }
        }

        it('POST - Inclui um novo prestador com autenticação', async () => {
            const response = await request (baseURL)
            .post('/prestadores')
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .send(dadosPrestador)
            .expect(201) // Created

            expect(response.body).toHaveProperty('acknowledged')
            expect(response.body.acknowledged).toBe(true)

            expect(response.body).toHaveProperty('insertedId')
            expect(typeof response.body.insertedId).toBe('string')
            idPrestadorInserido = response.body.insertedId
            expect(response.body.insertedId.length).toBeGreaterThan(0)
        })

        it('GET /:id - Lista o prestador pelo id com o token de acesso', async () => {
            const response = await request(baseURL)
            .get(`/prestadores/id/${idPrestadorInserido}`)
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .expect(200) // Ok
        })
        
        it('GET /:razao - Lista o prestador pelo razão com o token de acesso', async () => {
            const response = await request(baseURL)
            .get(`/prestadores/razao/${dadosPrestador.razao_social}`)
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .expect(200) // Ok
        })
        
        it('PUT - Altera os dados do prestador', async () => {
            novosDadosPrestador = {
                ...dadosPrestador, // Spread operator
                '_id': idPrestadorInserido
            }
            novosDadosPrestador.razao_social += ' alterado.'
            const response = await request(baseURL)
            .put('/prestadores')
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .send(novosDadosPrestador)
            .expect(202) //Accepted

            expect(response.body).toHaveProperty('acknowledged')
            expect(response.body.acknowledged).toBe(true)

            expect(response.body).toHaveProperty('modifiedCount')
            expect(typeof response.body.modifiedCount).toBe('number')
            expect(response.body.modifiedCount).toBeGreaterThan(0)
        })

        it('DELETE - Remove um prestador', async () => {
            const response = await request (baseURL)
            .delete(`/prestadores/${idPrestadorInserido}`)
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            expect(200)

            expect(response.body).toHaveProperty('acknowledged')
            expect(response.body.acknowledged).toBe(true)

            expect(response.body).toHaveProperty('deletedCount')
            expect(typeof response.body.deletedCount).toBe('number')
            expect(response.body.deletedCount).toBeGreaterThan(0)
        })

        // Erros na API REST de Prestadores com o token

        it('POST - Insere um prestador sem o CNPJ', async () => {
            dadosPrestador.cnpj = ''
            const response = await request (baseURL)
            .post('/prestadores')
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .set(dadosPrestador)
            .expect(400) // Bad request
    
            expect(response.body).toHaveProperty('errors')
            const avisoErro = response.body.errors[0].msg
    
            expect(avisoErro).toEqual('É obrigatório informar o CNPJ.')
        })

        it('POST - Insere um prestador, cujo CNPJ contém caracteres inválidos.', async () => {
            dadosPrestador.cnpj = ''
            const response = await request (baseURL)
            .post('/prestadores')
            .set('Content-Type', 'application/json')
            .set('access-token', token)
            .set(dadosPrestador)
            .expect(400) // Bad request
    
            expect(response.body).toHaveProperty('errors')
            const avisoErro = response.body.errors[0].msg
    
            expect(avisoErro).toEqual('O CNPJ deve ter apenas números.')
        })

    })