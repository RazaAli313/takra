import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm your virtual assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Predefined FAQ answers
  const faqAnswers = {
    'Lead':'Lead of FCIT Developers Club is Syed Muhammad Raza Ali, this is his linked in profile: https://linkedin.com/in/razaali313',
    'lead':'Lead of FCIT Developers Club is Syed Muhammad Raza Ali, this is his linked in profile: https://linkedin.com/in/razaali313',
    'hi': "Hello! 👋 How can I help you today?",
    'hello': "Hello! 👋 How can I help you today?",
    'hey': "Hello! 👋 How can I help you today?",
    'what is your name': "Hey👋 My name is Dev AI. I am chat assistant talking on behalf of FCIT Developers Club",
    'What is your name': "Hey👋 My name is Dev AI. I am chat assistant talking on behalf of FCIT Developers Club",
    'Whats your name': "Hey👋 My name is Dev AI .I am chat assistant talking on behalf of FCIT Developers Club",
    'Who are you': "Hey👋 My name is Dev AI .I am chat assistant talking on behalf of FCIT Developers Club",
    'who are you': "Hey👋 My name is Dev AI .I am chat assistant talking on behalf of FCIT Developers Club",
    'join': "To join FCIT Developers Club, visit our 'Join Team' page and fill out the registration form. We review applications regularly!",
    'membership': "Membership is free for FCIT students. Visit the 'Join Team' page to apply. No prior experience is required!",
    'events': "Check out our Events page to see upcoming hackathons, workshops, tech talks, and coding competitions. Most events are open to all students!",
    'register': "You can register for events from our Events page. Click on any event and use the Register button to sign up.",
    'hackathon': "We organize regular hackathons! Check the Events page for upcoming competitions. All skill levels are welcome!",
    'workshop': "We offer workshops on web development, mobile apps, AI/ML, and more. Visit the Events page to see upcoming workshops.",
    'team': "Visit our Team page to see current members. To join the core team, stay active and apply when positions open!",
    'contact': "You can reach us through the Contact page, or send us a message. We'll get back to you as soon as possible!",
    'location': "FCIT Developers Club is part of the Faculty of Computing and Information Technology. Check the Contact page for details.",
    'help': "I can help with questions about membership, events, team, and general club information. What would you like to know?",
    'faq': "Check our FAQ page for answers to common questions about membership, events, and more!",
    'jobs': "Visit our Job Board to see internship and job opportunities. We regularly post new positions!",
    'blog': "Check out our Blogs section for technical articles, tutorials, and project showcases written by our members.",
    'hall of fame': "The Hall of Fame showcases achievements of our members and alumni, including hackathon wins and notable projects!",
    'alumni': "Alumni are welcome to attend events and mentor current members. Contact us for more information on alumni involvement.",
    // 'discord': "Members receive access to our community platforms (Discord/Slack) after joining. Join us to get access!",
    // 'slack': "Members receive access to our community platforms (Discord/Slack) after joining. Join us to get access!",
    'code': "We welcome all programming languages! Common ones include Python, JavaScript, Java, C++, and more. Join our workshops to learn!",
    'thank': "You're welcome! Is there anything else I can help you with?",
    'thanks': "You're welcome! Is there anything else I can help you with?",
    'bye': "Goodbye! Feel free to come back anytime if you have questions. 👋",
    'default': "I'm not sure about that. Try asking about membership, events, team, jobs, or contact information. Or check our FAQ page for more details!"
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const findAnswer = (question) => {
    const lowerQuestion = question.toLowerCase().trim();
    
    // Check for exact matches or keywords
    for (const [key, answer] of Object.entries(faqAnswers)) {
      if (lowerQuestion.includes(key) || lowerQuestion === key) {
        return answer;
      }
    }
    
    return faqAnswers.default;
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate bot thinking (you can remove this later when backend is ready)
    setTimeout(() => {
      const botAnswer = findAnswer(inputValue);
      const botMessage = {
        id: messages.length + 2,
        text: botAnswer,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);

    setInputValue('');
  };

  const quickQuestions = [
    "How do I join?",
    "What events are coming?",
    "How can I contact you?",
    "Tell me about the team"
  ];

  const handleQuickQuestion = (question) => {
    // Add user message directly
    const userMessage = {
      id: messages.length + 1,
      text: question,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Get bot answer and add it
    setTimeout(() => {
      const botAnswer = findAnswer(question);
      const botMessage = {
        id: messages.length + 2,
        text: botAnswer,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 md:bottom-24 right-4 md:right-6 z-50 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white p-3 md:p-4 rounded-full shadow-2xl shadow-sky-200 transition-all duration-300 flex items-center justify-center group"
            aria-label="Open chat assistant"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 md:h-6 md:w-6" />
            <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={isMobile ? { y: '100%', opacity: 0 } : { x: 400, opacity: 0 }}
              animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
              exit={isMobile ? { y: '100%', opacity: 0 } : { x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-20 md:bottom-24 right-0 md:right-6 left-0 md:left-auto z-50 w-full md:w-96 h-[calc(100vh-5rem)] md:h-[600px] max-h-[600px] md:max-h-none bg-white rounded-t-2xl md:rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            >
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-3 md:p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 md:h-6 md:w-6 text-sky-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold text-sm md:text-base truncate">FCIT Devs Assistant</h3>
                  <p className="text-xs text-sky-100">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-lg p-1 md:p-2 transition-colors flex-shrink-0"
                aria-label="Close chat"
              >
                <XMarkIcon className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-slate-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[80%] rounded-lg p-2.5 md:p-3 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    <p className="text-xs md:text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    <p className="text-[10px] md:text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="px-3 md:px-4 pb-2 relative z-10 flex-shrink-0">
                <p className="text-xs text-slate-500 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {quickQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuickQuestion(question);
                      }}
                      className="px-2.5 md:px-3 py-1 text-[10px] md:text-xs bg-slate-200 hover:bg-sky-100 text-slate-700 rounded-full transition-colors cursor-pointer active:scale-95 break-words"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 md:p-4 border-t border-slate-200 bg-white flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 md:px-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs md:text-sm"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 md:p-2.5 rounded-lg transition-all flex-shrink-0"
                >
                  <PaperAirplaneIcon className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 text-center mt-2">
                Errors and omissions are expected
              </p>
            </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatAssistant;

