"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PaperAirplaneIcon, PlusCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import './globals.css';

const Chatpage = () => {
    const router = useRouter();
    const { userid } = router.query;
    const [userIdState, setUserIdState] = useState(null);
    const [messagesByUser, setMessagesByUser] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);

    //console.log('userid_1', userid);

    const generateConversationId = (user1Id, user2Id) => {
        return user1Id < user2Id ? `${user1Id}-${user2Id}` : `${user2Id}-${user1Id}`;
    };

    useEffect(() => {
        // เช็คว่า router.isReady และ userid มีค่า
        if (router.isReady && userid) {
            //console.log('User ID from router:', userid);
            setUserIdState(userid); // ตั้งค่า userIdState เมื่อ userid ถูกต้อง
        }
    }, [router.isReady, userid]); // ฟังการเปลี่ยนแปลงเมื่อ router พร้อมหรือ userid เปลี่ยน

    useEffect(() => {
        const fetchUsers = async () => {
            if (userIdState) { // เช็คว่า userIdState มีค่าก่อนทำการ fetch
                //console.log('Fetching users with userIdState:', userIdState);
                try {
                    const response = await fetch('/api/messages/users/route', {
                        method: 'GET',
                        headers: {
                            id: userIdState,
                        },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUsers(data);
                    } else {
                        console.error('Error fetching users:', response.statusText);
                    }
                } catch (error) {
                    console.error('Error fetching users:', error);
                }
            }
        };

        // เรียก fetchUsers เมื่อ userIdState ถูกตั้งค่า
        fetchUsers();
    }, [userIdState]); // ฟังการเปลี่ยนแปลงของ userIdState

    useEffect(() => {
        const fetchMessages = async () => {
            if (selectedUser) {
                try {
                    const response = await fetch(`/api/messages/${generateConversationId(selectedUser.id, userid)}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setMessagesByUser((prev) => ({
                            ...prev,
                            [selectedUser.id]: data,
                        }));
                    } else {
                        console.error('Error fetching messages:', response.statusText);
                    }
                } catch (error) {
                    console.error('Error fetching messages:', error);
                }
            }
        };

        const interval = setInterval(fetchMessages, 500);
        return () => {
            clearInterval(interval);
        };
    }, [selectedUser, userid]);  // Added session.user.id as a dependency

    const handleSendMessage = async () => {
        if (newMessage.trim() !== '' && selectedUser) {
            try {
                const response = await fetch('/api/messages/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        senderId: userid,
                        conversationId: generateConversationId(selectedUser.id, userid),
                        content: newMessage,
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setMessagesByUser((prev) => ({
                        ...prev,
                        [selectedUser.id]: [...(prev[selectedUser.id] || []), data],
                    }));
                    setNewMessage('');
                } else {
                    console.error('Error sending message:', response.statusText);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    return (
        <div className="flex h-screen bg-gray-800">
            <div className="flex-1 p-8 ">
                <div className="flex flex-col md:flex-row h-full">
                    {/* User Selection */}
                    <div className="w-64 md:w-1/4 mb-4 md:mb-0 md:mr-4">
                        <h2 className="text-xl font-bold mb-2">Chats</h2>
                        <ul>
                            {users.map((user) => (
                                <li
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`cursor-pointer p-2 rounded hover:bg-gray-600 ${selectedUser && selectedUser.id === user.id ? 'bg-gray-600' : ''}`}
                                >
                                    {user.username}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Chat Area and Input Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-2xl font-bold text-white">{selectedUser ? selectedUser.username : 'Select a user'}</h1>
                            <div className="flex space-x-2">
                                <button className="bg-gray-700 p-2 rounded-full hover:bg-gray-600">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-300" />
                                </button>
                                <button className="bg-gray-700 p-2 rounded-full hover:bg-gray-600">
                                    <PlusCircleIcon className="h-5 w-5 text-gray-300" />
                                </button>
                            </div>
                        </div>
                        {/* Chat Area */}
                        {selectedUser && (
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-900 rounded-lg shadow custom-scrollbar">
                                {/* แสดงข้อความที่ส่งและรับจากผู้ใช้คนอื่น */}
                                <ul className="space-y-4">
                                    {(messagesByUser[selectedUser.id] || []).map((message) => (
                                        <li key={message.id} className={`flex ${message.senderId === userid ? 'justify-end' : 'justify-start'}`}>
                                            {/* ถ้าเป็นข้อความของเราเองให้แสดงด้วยสีพื้นหลังบลู */}
                                            {/* ถ้าเป็นข้อความของผู้ใช้อื่นให้แสดงด้วยสีพื้นหลังสีเทา */}
                                            <div className={`p-3 rounded-lg ${message.senderId === userid ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                                <p>{message.content}</p>
                                                {/* แสดงเวลาและวันที่ส่งข้อความ */}
                                                <p className="text-xs text-right mt-1">{new Date(message.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Input Area */}
                        {selectedUser && (
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }} className="flex items-center mt-4">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 border border-gray-600 bg-gray-700 text-gray-300 rounded-lg p-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600">
                                    <PaperAirplaneIcon className="h-5 w-5 transform rotate-45" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chatpage;
