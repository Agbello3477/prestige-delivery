import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

// Extract base URL from api service to ensure consistency (remove /api suffix)
// @ts-ignore
const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'https://prestige-delivery-backend.onrender.com';

interface Message {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: string;
    sender?: { name: string };
}

const ChatScreen = () => {
    const { user } = useAuth();
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { receiverId, receiverName } = route.params;

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // 1. Fetch Chat History
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get(`/chat/${receiverId}`);
                setMessages(response.data);
                scrollToBottom();
            } catch (error) {
                console.error('Failed to fetch chat history', error);
            } finally {
                setLoading(false);
            }
        };

        if (user && receiverId) {
            fetchHistory();
        }
    }, [user, receiverId]);

    // 2. Initialize Socket
    useEffect(() => {
        if (!user) return;

        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            forceNew: true
        });
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            setIsConnected(true);
            newSocket.emit('join', user.id.toString());
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error: any) => {
            console.error('Socket Connection Error:', error);
            setIsConnected(false);
            // Alert.alert('Chat Connectivity', 'Warning: Lost real-time connection. Messages may be delayed.');
        });

        newSocket.on('error', (error: any) => {
            console.error('Socket General Error:', error);
        });

        newSocket.on('receive_message', (message: Message) => {
            // Only add if it belongs to this current chat
            if (
                (message.senderId.toString() === receiverId.toString() && message.receiverId.toString() === user?.id.toString()) ||
                (message.senderId.toString() === user?.id.toString() && message.receiverId.toString() === receiverId.toString())
            ) {
                setMessages(prev => {
                    if (prev.find(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
                scrollToBottom();
            }
        });

        newSocket.on('message_sent', (message: Message) => {
            setMessages(prev => {
                if (prev.find(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
            scrollToBottom();
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user, receiverId]);

    // TODO: Fetch chat history from API when component mounts

    const sendMessage = () => {
        if (!inputText.trim() || !socket || !user) return;

        const messageData = {
            senderId: user.id,
            receiverId: receiverId,
            content: inputText
        };

        socket.emit('send_message', messageData);
        setInputText('');
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.senderId === user?.id;
        return (
            <View className={`mb-2 max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                <View className={`p-3 rounded-2xl ${isMe ? 'bg-brand-600 rounded-br-none' : 'bg-gray-200 rounded-bl-none'}`}>
                    <Text className={`text-base ${isMe ? 'text-white' : 'text-gray-800'}`}>{item.content}</Text>
                </View>
                <Text className="text-xs text-gray-400 mt-1 self-end">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            {/* Header */}
            <View className="flex-row items-center p-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View className="flex-1">
                    <View className="flex-row items-center">
                        <Text className="font-bold text-lg text-gray-900 mr-2">{receiverName}</Text>
                        <View className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    </View>
                    <Text className="text-xs text-gray-500">{isConnected ? 'Online' : 'Disconnected (Reconnecting...)'}</Text>
                </View>
            </View>

            {/* Chat Area */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                contentContainerStyle={{ padding: 16 }}
                className="flex-1"
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View className="flex-row items-center p-4 border-t border-gray-100 bg-white">
                    <TextInput
                        className="flex-1 bg-gray-100 rounded-full px-4 py-3 mr-3 text-base"
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={!inputText.trim()}
                        className={`w-12 h-12 rounded-full items-center justify-center ${inputText.trim() ? 'bg-brand-600' : 'bg-gray-300'}`}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatScreen;
