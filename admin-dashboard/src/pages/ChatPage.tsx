import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import { Send, User as UserIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
// Extract base URL for socket (remove /api)
const SOCKET_URL = API_URL.replace('/api', '');

interface User {
    id: number;
    name: string;
    role: string;
}

interface Message {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: string;
    sender?: User;
    receiver?: User;
}

interface ChatPartner {
    partner: User;
    lastMessage: Message;
}

const ChatPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const token = localStorage.getItem('token');
    const [recentChats, setRecentChats] = useState<ChatPartner[]>([]);
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch recent chats on load
    useEffect(() => {
        const fetchRecentChats = async () => {
            try {
                const response = await axios.get(`${API_URL}/chat/recent`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRecentChats(response.data);
            } catch (error) {
                console.error('Failed to fetch recent chats', error);
            }
        };

        if (token) {
            fetchRecentChats();
        }
    }, [token]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const updateRecentChats = React.useCallback((message: Message) => {
        setRecentChats(prevChats => {
            // Find if this partner already exists
            const partnerId = message.senderId === currentUser?.id ? message.receiverId : message.senderId;
            const existingChatIndex = prevChats.findIndex(c => c.partner.id === partnerId);

            const updatedChats = [...prevChats];

            if (existingChatIndex >= 0) {
                // Update last message
                updatedChats[existingChatIndex] = {
                    ...updatedChats[existingChatIndex],
                    lastMessage: message
                };
            } else {
                // Ideally fetch partner details, but for now we might use partial data if provided in populate
                const newPartner = message.senderId === currentUser?.id ? message.receiver : message.sender;
                if (newPartner) {
                    updatedChats.push({
                        partner: newPartner,
                        lastMessage: message
                    });
                }
            }

            // Sort by latest message
            return updatedChats.sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
        });
    }, [currentUser?.id]);

    // Initialize Socket Connection
    useEffect(() => {
        if (!currentUser) return;

        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            newSocket.emit('join', currentUser.id.toString());
        });

        // Listen for new messages
        newSocket.on('receive_message', (message: Message) => {
            // If the incoming message belongs to the currently active chat
            if (activeChatId && (message.senderId === activeChatId || message.receiverId === activeChatId)) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }

            // Update recent chats list
            updateRecentChats(message);
        });

        newSocket.on('message_sent', (message: Message) => {
            if (activeChatId && (message.senderId === activeChatId || message.receiverId === activeChatId)) {
                setMessages(prev => {
                    if (prev.find(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
                scrollToBottom();
            }
            // Update recent chats list
            updateRecentChats(message);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [currentUser, activeChatId, updateRecentChats]); // Re-attach listener if active chat changes (optional optimizations possible)

    // Load active chat messages
    useEffect(() => {
        const fetchMessages = async () => {
            if (!activeChatId) return;
            try {
                const response = await axios.get(`${API_URL}/chat/${activeChatId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(response.data);
                scrollToBottom();
            } catch (error) {
                console.error('Failed to fetch messages', error);
            }
        };

        if (token && activeChatId) {
            fetchMessages();
        }
    }, [activeChatId, token]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !socket || !currentUser || !activeChatId) return;

        const messageData = {
            senderId: currentUser.id,
            receiverId: activeChatId,
            content: inputText
        };

        socket.emit('send_message', messageData);
        setInputText('');
    };

    const activePartner = recentChats.find(c => c.partner.id === activeChatId)?.partner;

    return (
        <div className="flex h-[calc(100vh-6rem)] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            {/* Sidebar with Recent Chats */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {recentChats.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No recent conversations</div>
                    ) : (
                        recentChats.map((chat) => (
                            <button
                                key={chat.partner.id}
                                onClick={() => setActiveChatId(chat.partner.id)}
                                className={`w-full text-left p-4 border-b border-gray-100 transition-colors ${activeChatId === chat.partner.id ? 'bg-brand-50 border-brand-200' : 'hover:bg-gray-100 bg-white'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-gray-900 truncate pr-2">{chat.partner.name}</span>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {new Date(chat.lastMessage.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 truncate w-3/4">
                                        {chat.lastMessage.senderId === currentUser?.id ? 'You: ' : ''}{chat.lastMessage.content}
                                    </span>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                        {chat.partner.role}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeChatId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 flex items-center bg-white shadow-sm z-10">
                            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 mr-3">
                                <UserIcon size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{activePartner?.name || 'User'}</h3>
                                <p className="text-xs text-brand-600 font-medium">{activePartner?.role}</p>
                            </div>
                        </div>

                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === currentUser?.id;
                                return (
                                    <div key={msg.id || idx} className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-brand-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-brand-200' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <form onSubmit={sendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50"
                                />
                                <button
                                    type="submit"
                                    title="Send Message"
                                    disabled={!inputText.trim()}
                                    className="p-2 rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={20} className="m-1" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <Send size={48} className="mb-4 text-gray-300 opacity-50" />
                        <h3 className="text-lg font-medium text-gray-500">Your Messages</h3>
                        <p className="text-sm">Select a conversation from the sidebar to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
