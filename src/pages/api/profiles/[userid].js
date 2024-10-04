import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth";

const prisma = new PrismaClient();

export default async function handler(req, res) {
    console.log(`[GET] /api/profiles/${req.query.userid}`);
    const session = await getServerSession(req, res,);
    if (!session) {
        console.log('[GET] /api/profiles/[userid] - Unauthorized');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userid } = req.query;
    if (req.method === 'GET') {
        try {
            console.log('[GET] /api/profiles/[userid] - Fetching user...');
            const user = await prisma.user.findUnique({
                where: {
                    id: userid
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    img: true,
                    accessRight: true,
                    profile: true, // ดึงข้อมูลทั้งหมดจาก Profile
                }
            });
            console.log('[GET] /api/profiles/[userid] - User found:', user);
            res.status(200).json(user);
        } catch (error) {
            console.log('[GET] /api/profiles/[userid] - Error:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
}
