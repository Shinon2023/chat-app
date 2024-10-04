import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { senderId, conversationId, content } = req.body;
    //console.log('Request body:', req.body);

    if (!senderId || !conversationId || !content) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // ตรวจสอบการมีอยู่ของ User
    const user = await prisma.user.findUnique({ where: { id: senderId } });
    //console.log('User found:', user);

    if (!user) {
      console.log('User not found:', senderId);
      return res.status(404).json({ message: 'User not found' });
    }

    // ตรวจสอบการมีอยู่ของ Conversation
    let conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    //console.log('Conversation found:', conversation);

    if (!conversation) {
      //console.log('Conversation not found. Creating new conversation with ID:', conversationId);
      // สร้าง Conversation ใหม่
      conversation = await prisma.conversation.create({
        data: {
          id: conversationId,
          participants: {
            create: {
              userId: senderId, // เพิ่มผู้เข้าร่วมการสนทนา
            },
          },
        },
      });
    } else {
      // ตรวจสอบว่า User เป็น Participant ของ Conversation
      let participant = await prisma.participant.findFirst({
        where: {
          userId: senderId,
          conversationId: conversation.id,
        }
      });

      //console.log('Participant found:', participant);

      if (!participant) {
        //console.log('User is not a participant. Adding user to conversation.');
        await prisma.participant.create({
          data: {
            userId: senderId,
            conversationId: conversation.id,
          }
        });
      }
    }

    // ใช้ transaction
    const message = await prisma.$transaction(async (prisma) => {
      return prisma.message.create({
        data: {
          senderId,
          conversationId: conversation.id,
          content,
        },
      });
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
