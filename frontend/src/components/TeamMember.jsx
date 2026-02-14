import { motion } from "framer-motion";
import { LinkedinIcon, GithubIcon, TwitterIcon } from "./Icons";

const TeamMember = ({ name, role, image, socials ,bio}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center text-center"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative mb-4 h-40 w-40 rounded-full overflow-hidden border-4 border-indigo-500 shadow-lg"
      >
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover"
        />
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-indigo-600 bg-opacity-70 flex items-center justify-center space-x-4"
        >
          {socials.linkedin && (
            <motion.a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <LinkedinIcon className="h-6 w-6 text-white" />
            </motion.a>
          )}
          {socials.github && (
            <motion.a
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <GithubIcon className="h-6 w-6 text-white" />
            </motion.a>
          )}
          {socials.twitter && (
            <motion.a
              href={socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <TwitterIcon className="h-6 w-6 text-white" />
            </motion.a>
          )}
        </motion.div>
      </motion.div>
      <h3 className="text-xl font-bold text-white">{name}</h3>
      <p className="text-indigo-300">{role}</p>
      <p className="text-indigo-300">{bio}</p>
    </motion.div>
  );
};

export default TeamMember;