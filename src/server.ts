import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';
import bcrypt from 'bcryptjs';

const app = express();
app.use(cors());
app.use(express.json());
app.post('/api/auth/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
  
    try {
      // 1. Verificar se o e-mail já existe
      const userExists = await prisma.user.findUnique({ where: { email } });
      if (userExists) return res.status(400).json({ message: 'E-mail já cadastrado.' });
  
      // 2. Criptografar a senha (Segurança!)
      const hashedPassword = await bcrypt.hash(password, 8);
  
      // 3. Salvar no banco SQLite
      const user = await prisma.user.create({
        data: { firstName, lastName, email, password: hashedPassword }
      });
  
      return res.status(201).json({ message: 'Usuário criado com sucesso!', userId: user.id });
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao criar conta.' });
    }
  });
  
  app.listen(3000, () => console.log('🚀 API Rodando com Prisma + SQLite'));