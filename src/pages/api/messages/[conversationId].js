import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const { conversationId } = req.query;
    if (req.method === 'GET') {
        try {
            // ดึงข้อความทั้งหมดจาก Conversation ที่ระบุ
            const messages = await prisma.message.findMany({
                where: {
                    conversationId: conversationId,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });

            res.status(200).json(messages);
        } catch (error) {
            //console.error('Error fetching messages:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    } else {
        //res.setHeader('Allow', ['GET']);
        res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}
