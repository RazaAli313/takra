import { motion } from "framer-motion";
import { CalendarIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";

const EventCard = ({ title, date, time, location, description, image }) => {
  return (
    <motion.div
      whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700"
    >
      <div className="h-48 overflow-hidden">
        <motion.img
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-gray-300 mb-4">{description}</p>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1" />
            {date}
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            {time}
          </div>
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1" />
            {location}
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-medium"
        >
          Register Now
        </motion.button>
      </div>
    </motion.div>
  );
};

export default EventCard;