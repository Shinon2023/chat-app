import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

const storage = multer.memoryStorage(); // ใช้ memory storage เพื่อเก็บไฟล์ใน RAM

const upload = multer({ storage: storage });

export const config = {
    api: {
        bodyParser: false, // ปิดการใช้ bodyParser เพราะ multer จะจัดการเรื่องนี้
    },
}

// ฟังก์ชันสำหรับการอัปโหลด
const uploadMiddleware = upload.single('imgFile');

export default async function handler(req, res) {
    const session = await getServerSession(req, res);
    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'POST') {
        uploadMiddleware(req, res, async (err) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(500).json({ message: 'Internal server error', error: err.message });
            }

            // ดึงข้อมูลจาก request
            const { name, amount, category } = req.body;
            const imgFile = req.file; // ไฟล์ที่อัปโหลด

            if (!name || !amount || !category || !imgFile) {
                return res.status(400).json({ message: 'Missing required fields' });
            }

            try {
                // แปลงไฟล์เป็น Buffer
                const imgBytes = imgFile.buffer; // ไฟล์ที่อัปโหลดจะอยู่ในรูปแบบ Buffer

                // บันทึกข้อมูลในฐานข้อมูล
                const newStock = await prisma.stock.create({
                    data: {
                        name,
                        amount: parseInt(amount, 10),
                        category,
                        img: imgBytes, // บันทึกไฟล์เป็น Binary
                    },
                });

                res.status(200).json(newStock);
            } catch (error) {
                console.error('Error adding new stock:', error);
                res.status(500).json({ message: 'Internal server error', error: error.message });
            }
        });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}