import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/firebaseConfig'; // Adjust path to your firebase config file
import { collection, addDoc, onSnapshot, query, orderBy, getDocs, where, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FaPaperPlane, FaUserCircle, FaArrowLeft } from 'react-icons/fa';

const Community = () => {
    const [users, setUsers] = useState([]); // All users except the current user
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadMessages, setUnreadMessages] = useState({}); // Track unread messages per user
    const messagesEndRef = useRef(null);

    // Unique avatars for each user
    const avatars = {
        user1: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300', // Priya (female)
        user2: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300', // Arjun (male)
        user3: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300', // Lakshmi (female)
        user4: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300', // Rohan (male)
        user5: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=300', // Sneha (female)
    };

    // Fetch users from Firestore 'dependents' collection and set online status
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const loggedInUserId = localStorage.getItem('userId');
                const sessionExpiry = localStorage.getItem('sessionExpiry');

                // Check if session is still valid
                if (!loggedInUserId || !sessionExpiry || new Date(sessionExpiry) < new Date()) {
                    console.error('Session expired or invalid user ID');
                    return;
                }

                const usersSnapshot = await getDocs(collection(db, 'dependents'));
                const userList = usersSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        uid: doc.id,
                        firstName: data.firstName,
                        nickname: data.firstName.slice(0, 3),
                        avatar: avatars[doc.id] || (data.gender === 'male'
                            ? 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300'
                            : 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300'),
                        gender: data.gender,
                        online: doc.id === loggedInUserId, // Initially set based on logged-in user
                    };
                });

                // Set current user
                const loggedInUser = userList.find(user => user.uid === loggedInUserId);
                if (loggedInUser) {
                    setCurrentUser(loggedInUser);
                } else {
                    console.error('Logged-in user not found in dependents');
                    return;
                }

                // Filter out the current user from the chat list
                const otherUsers = userList.filter(user => user.uid !== loggedInUserId);
                setUsers(otherUsers);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    // Set up presence system for the logged-in user
    useEffect(() => {
        const loggedInUserId = localStorage.getItem('userId');
        if (!loggedInUserId) return;

        const userStatusRef = doc(db, 'userStatus', loggedInUserId);

        // Set user as online
        const setOnline = async () => {
            await setDoc(userStatusRef, {
                online: true,
                lastSeen: serverTimestamp(),
            }, { merge: true });
        };

        // Set user as offline on disconnect
        const setOffline = async () => {
            await setDoc(userStatusRef, {
                online: false,
                lastSeen: serverTimestamp(),
            }, { merge: true });
        };

        setOnline();

        // Listen for online status of all users
        const unsubscribe = onSnapshot(collection(db, 'userStatus'), (snapshot) => {
            const statusUpdates = {};
            snapshot.forEach(doc => {
                statusUpdates[doc.id] = doc.data().online || false;
            });

            setUsers(prevUsers =>
                prevUsers.map(user => ({
                    ...user,
                    online: statusUpdates[user.uid] || false,
                }))
            );
        });

        window.addEventListener('beforeunload', setOffline);

        return () => {
            setOffline();
            unsubscribe();
            window.removeEventListener('beforeunload', setOffline);
        };
    }, []);

    // Fetch unread messages for the main page (to show notification dots)
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'privateChats'),
            where('to', '==', currentUser.uid),
            where('isRead', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const unreadCounts = {};
            snapshot.forEach(doc => {
                const message = doc.data();
                const senderId = message.from;
                unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
            });
            setUnreadMessages(unreadCounts);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Fetch messages for the selected user in real-time
    useEffect(() => {
        if (!selectedUser || !currentUser) return;

        const q = query(
            collection(db, 'privateChats'),
            where('participants', 'in', [
                [currentUser.uid, selectedUser.uid],
                [selectedUser.uid, currentUser.uid]
            ]),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => {
                const data = doc.data();
                const sender = users.find(user => user.uid === data.from) || currentUser;
                return {
                    id: doc.id,
                    ...data,
                    senderAvatar: sender.avatar,
                    senderNickname: sender.nickname,
                };
            });

            // Mark messages as read when viewed
            fetchedMessages.forEach(async msg => {
                if (msg.from === selectedUser.uid && !msg.isRead) {
                    await updateDoc(doc(db, 'privateChats', msg.id), { isRead: true });
                }
            });

            setMessages(fetchedMessages);
        }, (error) => {
            console.error('Error fetching messages:', error);
        });

        return () => unsubscribe();
    }, [selectedUser, currentUser, users]);

    // Scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send a new message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !selectedUser) return;

        const messageData = {
            text: newMessage,
            from: currentUser.uid,
            to: selectedUser.uid,
            participants: [currentUser.uid, selectedUser.uid],
            timestamp: new Date().toISOString(),
            isRead: false,
        };

        try {
            await addDoc(collection(db, 'privateChats'), messageData);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Open chat page
    const openChat = (user) => {
        setSelectedUser(user);
    };

    // Close chat page
    const closeChat = () => {
        setSelectedUser(null);
        setMessages([]);
        setNewMessage('');
    };

    if (!currentUser) {
        return <div className="p-4 text-center text-xl text-gray-600">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
            {/* User List Page */}
            {!selectedUser ? (
                <>
                    {/* Header */}
                    <header className="bg-[#B2DFDB] p-6 shadow-md">
                        <h1 className="text-4xl font-bold text-[#00695C] text-center">Community Chat</h1>
                        <div className="flex justify-center items-center gap-3 mt-4">
                            <FaUserCircle className="text-[#00695C] text-2xl" />
                            <p className="text-xl font-semibold text-[#00695C]">
                                Chatting as: {currentUser.nickname}
                            </p>
                        </div>
                    </header>

                    {/* User List */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        <div className="max-w-4xl mx-auto space-y-4">
                            <h2 className="text-3xl font-semibold text-[#5D4037] mb-4">Chat with Friends</h2>
                            {users.map(user => (
                                <div
                                    key={user.uid}
                                    onClick={() => openChat(user)}
                                    className="flex items-center p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 bg-[#FFF5F5] cursor-pointer"
                                >
                                    <div className="relative">
                                        <img
                                            src={user.avatar}
                                            alt={user.nickname}
                                            className="w-16 h-16 rounded-full object-cover mr-4"
                                        />
                                        {user.online && (
                                            <span className="absolute bottom-0 right-4 w-6 h-6 bg-green-500 rounded-full border-2 border-[#FFF5F5]"></span>
                                        )}
                                        {unreadMessages[user.uid] && (
                                            <span className="absolute top-0 right-4 w-6 h-6 bg-red-500 rounded-full border-2 border-[#FFF5F5] flex items-center justify-center text-white text-xs">
                                                {unreadMessages[user.uid]}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xl font-medium text-[#5D4037]">{user.nickname}</p>
                                        <p className="text-sm text-[#8D6E63]">
                                            {user.online ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                // Chat Page
                <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
                    {/* Chat Header */}
                    <header className="bg-[#B2DFDB] p-6 shadow-md flex items-center gap-3">
                        <button
                            onClick={closeChat}
                            className="text-3xl text-[#00695C] hover:text-[#004D40]"
                        >
                            <FaArrowLeft />
                        </button>
                        <div className="relative">
                            <img
                                src={selectedUser.avatar}
                                alt={selectedUser.nickname}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            {selectedUser.online && (
                                <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-[#B2DFDB]"></span>
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-semibold text-[#00695C]">{selectedUser.nickname}</h2>
                            <p className="text-sm text-[#004D40]">
                                {selectedUser.online ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </header>

                    {/* Chat Area */}
                    <div className="flex-1 p-6 overflow-y-auto bg-[#F5F5F5]">
                        <div className="space-y-4">
                            {messages.map(message => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.from === currentUser.uid ? 'justify-end' : 'justify-start'
                                        }`}
                                >
                                    <div
                                        className={`flex items-start gap-3 max-w-[80%] ${message.from === currentUser.uid ? 'flex-row-reverse' : ''
                                            }`}
                                    >
                                        <img
                                            src={message.senderAvatar}
                                            alt={message.senderNickname}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div
                                            className={`p-3 rounded-lg break-words ${message.from === currentUser.uid
                                                    ? 'bg-[#C8E6C9] text-[#388E3C]'
                                                    : 'bg-[#E6E2D3] text-[#5D4037]'
                                                }`}
                                        >
                                            <p className="text-lg">{message.text}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-xs text-gray-500">
                                                    {new Date(message.timestamp).toLocaleTimeString()}
                                                </p>
                                                {message.from === currentUser.uid && (
                                                    <p className="text-xs text-gray-500">
                                                        {message.isRead ? 'Read' : 'Not Read'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="bg-[#F5F5F5] p-6 shadow-inner">
                        <div className="max-w-4xl mx-auto flex gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 p-3 text-lg rounded-xl border border-[#E6E2D3] focus:outline-none focus:border-[#80CBC4] bg-[#FFF5F5] text-[#5D4037] placeholder-[#8D6E63]"
                            />
                            <button
                                type="submit"
                                className="bg-[#B2DFDB] hover:bg-[#80CBC4] text-[#00695C] p-3 rounded-xl"
                            >
                                <FaPaperPlane size={24} />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Mobile View Adjustments */}
            <style jsx>{`
        @media (max-width: 640px) {
          .max-w-4xl {
            max-width: 100%;
          }
          .text-4xl {
            font-size: 2rem;
          }
          .text-3xl {
            font-size: 1.5rem;
          }
          .text-xl {
            font-size: 1.25rem;
          }
          .text-lg {
            font-size: 1rem;
          }
          .text-sm {
            font-size: 0.875rem;
          }
          .text-xs {
            font-size: 0.75rem;
          }
          .p-6 {
            padding: 1rem;
          }
          .p-4 {
            padding: 0.75rem;
          }
          .p-3 {
            padding: 0.5rem;
          }
          .w-16 {
            width: 3rem;
            height: 3rem;
          }
          .w-12 {
            width: 2.5rem;
            height: 2.5rem;
          }
          .w-10 {
            width: 2rem;
            height: 2rem;
          }
          .w-6 {
            width: 1.5rem;
            height: 1.5rem;
          }
          .w-5 {
            width: 1.25rem;
            height: 1.25rem;
          }
          .max-w-[80%] {
            max-width: 75%;
          }
          .break-words {
            word-break: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
          }
          .space-y-4 > * + * {
            margin-top: 1rem;
          }
        }
      `}</style>
        </div>
    );
};

export default Community;