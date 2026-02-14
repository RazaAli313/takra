import { API_BASE_URL } from "../../utils/api";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  TrashIcon,

  CheckIcon
} from "@heroicons/react/24/outline";
import { Reply } from "lucide-react";
import axios from 'axios'
import toast from "react-hot-toast";

const AdminMessages = () => {

  const [messages, setMessages] = useState([])
  // const API_BASE_URL='http://localhost:8000/api/'

   useEffect(() => {
      // console.log("API_BASE_URL:", API_BASE_URL);
      const fetchMessages = async () => {
        const url = `${API_BASE_URL}/contact/messages`;
        // console.log("Fetching messages from:", url);
        try {
          const response = await axios.get(url);
          // console.log("API response:", response);
          setMessages(response.data);
        } catch (error) {
          if (error.response) {
            console.error("API error response:", error.response.status, error.response.data);
          } else {
            console.error("Error fetching messages:", error.message);
          }
        }
      };
      fetchMessages();

   }, []);


  // const [messages, setMessages] = useState([
    // {
    //   id: 1,
    //   name: "Ali Khan",
    //   email: "ali.khan@example.com",
    //   message: "I'm interested in joining your club. Can you provide more information about the membership process?",
    //   date: "15 June 2025",
    //   read: false
    // },
    // {
    //   id: 2,
    //   name: "Sara Ahmed",
    //   email: "sara.ahmed@example.com",
    //   message: "Do you offer any workshops for beginners in web development?",
    //   date: "12 June 2025",
    //   read: true
    // }
  // ]);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const handleDelete = (id) => {
    setMessages(messages.filter(message => message.id !== id));
    if (selectedMessage && selectedMessage.id === id) {
      setSelectedMessage(null);
    }
  };

  const handleMarkAsRead = (id) => {
    setMessages(messages.map(message => 
      message.id === id ? { ...message, read: true } : message
    ));
  };

  const handleReply = () => {
   
    // In a real app, you would send this reply via email or save it
    // alert(`Reply sent to ${selectedMessage.email}`);
    // Here you would typically also send the replyContent to your backend
    axios.post(`${API_BASE_URL}/contact/reply`, {
      email: selectedMessage.email,
      query: selectedMessage.message,
      message: replyContent
    })
    .then(response => {
      toast.success('Reply email sent successfully!');
    })
    .catch(error => {
      toast.error('Error sending reply email.');
      console.error("Error sending reply:", error);
    });
    setReplyContent("");
    setSelectedMessage(null);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Contact Messages
          </span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Manage messages received through the contact form
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Inbox ({messages.length})</h2>
            </div>
            <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  whileHover={{ x: 5 }}
                  className={`p-4 cursor-pointer ${selectedMessage?.id === message.id ? 'bg-gray-700' : ''} ${!message.read ? 'bg-blue-900/10' : ''}`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.read) handleMarkAsRead(message.id);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{message.name}</h3>
                      <p className="text-sm text-gray-400 truncate">{message.message.substring(0, 50)}...</p>
                    </div>
                    <div className="text-xs text-gray-500">{message.date}</div>
                  </div>
                  {!message.read && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedMessage ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedMessage.name}</h2>
                  <p className="text-gray-400">{selectedMessage.email}</p>
                </div>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-gray-400 hover:text-red-400"
                    onClick={() => handleDelete(selectedMessage.id)}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center text-sm text-gray-400 mb-2">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {selectedMessage.date}
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-300">{selectedMessage.message}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Reply</h3>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows="4"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                  placeholder="Type your reply here..."
                ></textarea>
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-medium"
                    onClick={handleReply}
                  >
                  <Reply size={24} color="gray" />
                    Send Reply
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center"
            >
              <EnvelopeIcon className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a message</h3>
              <p className="text-gray-400">Choose a message from the inbox to view and reply</p>
            </motion.div>
          )}
        </div>
      </div> 
    </div>
  );
};

export default AdminMessages;