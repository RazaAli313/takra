import { motion } from "framer-motion";
import { LinkedinIcon, InstagramIcon, FacebookIcon } from "./Icons";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from 'react-router-dom';

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setSubscribing] = useState(false);
  const links = [
    { title: "Explore", items: [{ name: "Home", href: "/" }, { name: "About", href: "/about" }, { name: "Events", href: "/events" }, { name: "Competitions", href: "/competitions" }, { name: "Blogs", href: "/blogs" }, { name: "My Dashboard", href: "/dashboard" }] },
    { title: "Connect", items: [{ name: "Team", href: "/team" }, { name: "Hall of Fame", href: "/hall-of-fame" }, { name: "Contact", href: "/contact" }] },
  ];

  const handleSubscribe = async () => {
    if (!email) {
      toast.error("Please enter a valid email.");
      return;
    }
    setSubscribing(true);
    try {
      await axios.post(`${API_BASE_URL}/subscribe`, { email, subscribed_at: new Date().toISOString() });
      toast.success("🎉 Subscribed successfully!");
      setEmail("");
    } catch (err) {
      toast.error("❌ Subscription failed. Please try again.");
    }
    setSubscribing(false);
  };

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="w-screen max-w-[100vw] bg-white border-t border-slate-200 text-slate-700"
    >
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <motion.div whileHover={{ scale: 1.05 }} className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
              FCIT Developers Club
            </motion.div>
            <p className="text-slate-500 mb-6">
              Empowering the next generation of tech innovators.
            </p>
            <div className="flex space-x-4">
              <motion.a href="https://www.linkedin.com/company/fdcpucit/" target="_blank" whileHover={{ y: -5 }} whileTap={{ scale: 0.9 }} className="text-slate-500 hover:text-sky-600 transition-colors">
                <LinkedinIcon className="h-6 w-6" />
              </motion.a>
              <motion.a href="https://www.instagram.com/fdc.pucit/" whileHover={{ y: -5 }} target="_blank" whileTap={{ scale: 0.9 }} className="text-slate-500 hover:text-sky-600 transition-colors">
                <InstagramIcon className="h-6 w-6" />
              </motion.a>
              <motion.a href="https://www.facebook.com/fdc.pucit" target="_blank" whileHover={{ y: -5 }} whileTap={{ scale: 0.9 }} className="text-slate-500 hover:text-sky-600 transition-colors">
                <FacebookIcon className="h-6 w-6" />
              </motion.a>
            </div>
          </div>

          {links.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold mb-4 text-slate-800">{section.title}</h3>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <motion.li key={item.name} whileHover={{ x: 5 }}>
                    <a href={item.href} className="text-slate-500 hover:text-sky-600 transition-colors">
                      {item.name}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Newsletter</h3>
            <div className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="bg-slate-100 text-slate-800 border border-slate-200 px-4 mx-1 py-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent w-full placeholder-slate-400"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`btn btn-primary rounded-r-lg flex items-center justify-center ${isSubscribing ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={handleSubscribe}
                disabled={isSubscribing}
              >
                {isSubscribing ? <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span> : null}
                Subscribe
              </motion.button>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} FCIT Developers Club. All rights reserved.
          </p>
          <Link to="https://www.linkedin.com/in/razaali313" className="hover:text-sky-600 transition-colors mb-4 md:mb-0" target="_blank">
            Made with ❤️ and ☕ by <b>Syed Muhammad Raza Ali</b>
          </Link>
          <div className="flex space-x-6">
            <Link to="/privacy-policy" className="hover:text-sky-600 transition-colors text-slate-500">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-sky-600 transition-colors text-slate-500">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
