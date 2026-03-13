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
const SOCKET_URL = api.defaults.baseURL?.replace('/api', '') || 'http://172.18.19.91:4000';

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
    const [socket, setSocket] = useState<Socket | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        // Initialize Socket
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            if (user) {
                newSocket.emit('join', user.id.toString());
            }
        });

        newSocket.on('receive_message', (message: Message) => {
            if (
                (message.senderId === receiverId && message.receiverId === user?.id) ||
                (message.senderId === user?.id && message.receiverId === receiverId)
            ) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }
        });

        newSocket.on('message_sent', (message: Message) => {
            // Optimistic update might duplicate if we also listen to this, 
            // but good for confirmation. ideally we just append locally 
            // and confirm. specific implementation depends on backend echo.
            // backend currently emits 'message_sent' back to sender.
            setMessages(prev => {
                // Avoid duplicates if already added
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
                    <Text className="font-bold text-lg text-gray-900">{receiverName}</Text>
                    {/* Could add online status here */}
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
