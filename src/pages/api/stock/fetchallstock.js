import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export default async function handler(req, res) {
    const session = await getServerSession(req, res);
    console.log('Session:', session);
    console.log('Request Method:', req.method);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        try {
            const stocks = await prisma.stock.findMany({
                select: {
                    id: true,
                    name: true,
                    amount: true,
                    category: true,
                    img: true, // ถ้าคุณเก็บภาพในฐานข้อมูล
                }
            });

            // แปลงข้อมูลรูปภาพจาก Bytes เป็น Base64
            const stocksWithImages = stocks.map(stock => ({
                ...stock,
                img: stock.img ? stock.img.toString('base64') : null, // แปลงเป็น Base64
            }));

            res.status(200).json(stocksWithImages);
        } catch (error) {
            console.error('Error fetching stocks:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
