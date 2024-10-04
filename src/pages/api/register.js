import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  console.log('req.body', req.body);
  if (req.method === 'POST') {
    const { username, email, password } = req.body;
    try {
      //Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      console.log('existingUser', existingUser);
      if (existingUser) {
        console.log('User already exists');
        return res.status(400).json({ message: 'User already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('hashedPassword', hashedPassword);
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          accessRight: 'general',
        },
      });
      //console.log('newUser', newUser);
      return res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
      console.error('error', error);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  } else {
    //console.log('Method not allowed');
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

