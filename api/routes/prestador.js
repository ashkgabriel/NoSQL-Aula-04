import express from "express";
import { check, validationResult } from "express-validator";
import { connectToDatabase } from "../utils/mongodb.js";

const router = express.Router()
const { db, ObjectId } = await connectToDatabase()
const nomeCollection = 'prestadores'

const validaPrestador = [
    check('cnpj')
        .not().isEmpty().trim().withMessage('É obrigatório informar o CNPJ.')
        .isNumeric().withMessage('O CNPJ deve ter apenas números.')
        .isLength({ min: 14, max: 14 }).withMessage('O CNPJ deve ter 14 números.')
        .custom(async (cnpj, { req }) => {
            const contaPrestador = await db.collection(nomeCollection)
                .countDocuments({
                    'cnpj': cnpj,
                    '_id': { $ne: new ObjectId(req.body._id) } // Exclui o documento atual
                })
            if (contaPrestador > 0) {
                throw new Error('O CNPJ informado já está cadastrado.')
            }
        })
    ,

    check('razao_social')
        .not().isEmpty().trim().withMessage('A razão social é um campo obrigatório.')
        .isLength({ min: 5 }).withMessage('A razão é muito curta (mínimo de 5 caracteres).')
        .isLength({ max: 200 }).withMessage('A razão é muito longa (máximo de 200 caracteres).')
        .isAlphanumeric('pt-BR', { ignore: '/.- ;:*' }).withMessage('A razão social não deve conter caracteres especiais.'),

    check('cep')
        .not().isEmpty().trim().withMessage('É obrigatório informar o CEP')
        .isNumeric().withMessage('O CEP deve conter apenas números')
        .isLength({ min: 8, max: 8 }).withMessage('O CEP informado é inválido'),

    check('endereco.logradouro')
        .notEmpty().withMessage('O preenchimento do logradouro é obrigatório')
        .isLength({ min: 5 }).withMessage('O campo de logradouro deve conter no mínimo 5 caracteres.')
        .isLength({ max: 200 }).withMessage('O campo de logradouro deve conter no máximo 200 caracteres.'),

    check('endereco.bairro').notEmpty().withMessage('O preenchimento do campo bairro é obrigatório.'),

    check('endereco.uf').notEmpty().withMessage('O preenchimento do campo uf é obrigatório.'),

    check('cnae_fiscal').notEmpty().withMessage('O preenchimento do campo CNAE é obrigatório.'),

    check('nome_fantasia').optional({ nullable: true }),

    check('data_inicio_atividade').matches(/^\d{4}-\d{2}-\d{2}$/)
        .withMessage('O formato de data é inválido Informe no formato yyyy-mm-dd'),

    check('localizacao.type').equals('Point').withMessage('Tipo inválido'),

    check('localizacao.coordinates').isArray().withMessage('Coordenadas inválidas.'),

    check('localizacao.coordinates.*').isFloat()
        .withMessage('Os valores das coordenadas devem ser números.')
]

/*
* GET /api/prestadores
*Lista todos os prestadores de serviço
*Parametros: limit, skip e order
*/

router.get('/', async (req, res) => {
    const { limit, skip, order } = req.query // Obter da URL

    try {
        const docs = []
        await db.collection(nomeCollection)
            .find()
            .limit(parseInt(limit) || 10)
            .skip(parseInt(skip) || 0)
            .sort({ order: 1 })
            .forEach((doc) => {
                docs.push(doc)
            })
        res.status(200).json(docs)
    } catch (err) {
        res.status(500).json(
            {
                message: 'Erro ao obter a listagem dos prestadores',
                error: `${err.message}`
            }
        )
    }
})

/*
* GET /api/prestadores/id/:id
*Lista o prestador de serviço pelo id
*Parametros: id
*/

router.get('/id/:id', async (req, res) => {
    try {
        const docs = []
        await db.collection(nomeCollection)
            .find({ '_id': { $eq: new ObjectId(req.params.id) } }, {})
            .forEach((doc) => {
                docs.push(doc)
            })
        res.status(200).json(docs)

    } catch (err) {
        res.status(500).json({
            errors: [{
                values: `${err.message}`,
                msg: 'Erro ao obter o prestador pelo ID.',
                param: '/id/:id'
            }]
        })
    }
})

/*
* GET /api/prestadores/razao/:filtro
*Lista o prestador de serviço pela razão social
*Parametros: filtro
*/

router.get('/razao/:filtro', async (req, res) => {
    try {
        const filtro = req.params.filtro.toString()
        const docs = []

        await db.collection(nomeCollection)
            .find({
                $or: [
                    { 'razao_social': { $regex: filtro, $options: 'i' } },
                    { 'nome_fantasia': { $regex: filtro, $options: 'i' } }
                ]
            }, {})
            .forEach((doc) => {
                docs.push(doc)
            })
        res.status(200).json(docs)
    } catch (err) {
        res.status(500).json({
            errors: [{
                values: `${err.message}`,
                msg: 'Erro ao obter o prestador pela razão social.',
                param: '/razao/:filtro'
            }]
        })
    }
})

/*
* DELETE /api/prestadores/:id
* Deleta o prestador de serviço pelo ID
* Parametros: ID
*/

router.delete('/:id', async (req, res) => {
    const result = await db.collection(nomeCollection).deleteOne({
        '_id': { $eq: new ObjectId(req.params.id) }
    })
    if (result.deletedCount === 0) {
        res.status(404).json({
            errors: [{
                value: `Não há nenhum prestador com o ID ${req.params.id}`,
                msg: 'Erro ao excluir o prestador.',
                param: '_id'
            }]
        })
    } else {
        res.status(200).send(result)
    }
})

/*
* POST /api/prestadores
* Insere um novo prestador de serviço
* Parametros: Objeto prestador
*/

router.post('/', validaPrestador, async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const prestador =
            await db.collection(nomeCollection).insertOne(req.body)
        res.status(201).json(prestador) // 201 é o status created
    } catch (err) {
        res.status(500).json({ message: `${err.message} Server Error.` })
    }
})

/*
* PUT /api/prestadores
* Altera um prestador de serviço pelo _id
* Parametros: Objeto prestador
*/

router.put('/', validaPrestador, async (req, res) => {
    let idDocumento = req.body._id // Armazenamos o _id do documento
    delete req.body._id // Removemos o _id do body que foi recebido na req.

    try {
        // if (req.method === 'PUT') {
        //     // Ignora a validação do CNPJ
        //     req.check('cnpj').skip.if(idDocumento)
        // }

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const prestador = await db.collection(nomeCollection)
            .updateOne({ '_id': { $eq: new ObjectId(idDocumento) } },
                { $set: req.body })
        res.status(202).json(prestador) // Accepted
    } catch (err) {
        res.status(500).json({ errors: err.message })
    }
})

export default router