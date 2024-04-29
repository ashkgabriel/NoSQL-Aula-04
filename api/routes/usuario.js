import express from "express";
import { check, validationResult } from "express-validator";
import { connectToDatabase } from "../utils/mongodb.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router()
const { db, ObjectId } = await connectToDatabase()
const nomeCollection = 'usuarios'

// POST de Usuário

router.post('/', async (req, res) => {
    // Definindo o avatar default
    req.body.avatar = `https://ui-avatars.com/api/?name=${req.body.nome.replace(/ /g, '+')}&background=F00&color=FFF`

    // Criptografia da senha
    // genSalt => impede que 2 senhas iguais tenham resultados iguais

    const salt = await bcrypt.genSalt(10)
    req.body.senha = await bcrypt.hash(req.body.senha, salt)

    // Iremos salvar o registro
    await db.collection(nomeCollection)
        .insertOne(req.body)
        .then(result => res.status(201).send(result))
        .catch(err => res.status(400).json(err))
})

export default router