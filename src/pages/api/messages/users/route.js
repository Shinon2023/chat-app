import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default async function handler(req, res) {
  const { id } = req.headers;

  if (req.method === 'GET' && id) {
    try {
      console.log('id:', id);
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
        },
        where: {
          id: {
            not: id,
          },
        },
      });

      res.status(200).json(users);
    } catch (error) {
      //console.error("Error fetching users:", error);
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  } else {
    res.status(401).json({ error: 'Unauthorized', message: 'You must be logged in to access this route' });
  }
}

