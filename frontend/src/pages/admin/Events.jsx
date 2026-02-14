import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  TrashIcon, 
  PencilIcon, 
  PlusIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import axios from "axios";

// Use Vite's import.meta.env for frontend environment variables
const API_URL = import.meta.env.VITE_BACKEND_BASE_URL + '/api';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, eventTitle }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
        <p className="text-gray-300 mb-6">Are you sure you want to delete the event "{eventTitle}"? This action cannot be undone.</p>
        <div className="flex justify-end space-x-3">
          <button className="px-4 py-2 bg-gray-700 rounded-lg text-white font-medium" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-red-600 rounded-lg text-white font-medium" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

const AdminEvents = () => {
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, eventId: null, eventTitle: "" });

  // Multi-module entry (chip/tag style)
  const [newModule, setNewModule] = useState("");
  const handleAddModule = () => {
    if (newModule && !currentEvent.modules.includes(newModule)) {
      setCurrentEvent({
        ...currentEvent,
        modules: [...currentEvent.modules, newModule]
      });
      setNewModule("");
    }
  };
  const handleRemoveModule = (module) => {
    setCurrentEvent({
      ...currentEvent,
      modules: currentEvent.modules.filter(m => m !== module)
    });
  };

  // Discount code management
  const [newDiscountCode, setNewDiscountCode] = useState("");
  const [newDiscountAmount, setNewDiscountAmount] = useState("");
  const [newDiscountModule, setNewDiscountModule] = useState("");
  const handleAddDiscountCode = () => {
    if (newDiscountCode && newDiscountAmount && newDiscountModule) {
      setCurrentEvent({
        ...currentEvent,
        discount_codes: [...(currentEvent.discount_codes || []), { code: newDiscountCode, amount: Number(newDiscountAmount), module: newDiscountModule }]
      });
      setNewDiscountCode("");
      setNewDiscountAmount("");
      setNewDiscountModule("");
    }
  };
  const handleRemoveDiscountCode = (code, module) => {
    setCurrentEvent({
      ...currentEvent,
      discount_codes: currentEvent.discount_codes.filter(dc => !(dc.code === code && dc.module === module))
    });
  };
  const [events, setEvents] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewingRegistrations, setIsViewingRegistrations] = useState(false);
  const [currentEvent, setCurrentEvent] = useState({
    id: null,
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    image_url: null,
    registration_open: true,
    modules: [],
    module_amounts: {},
    category_id: "",
    category_name: "",
    rules: "",
    prizes: "",
    deadline: "",
  });
  const [currentImage, setCurrentImage] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleAmountsInput, setModuleAmountsInput] = useState("");
  const [categories, setCategories] = useState([]);

  // Fetch events and merge registration counts from competitions API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [eventsRes, compsRes, catRes] = await Promise.all([
          axios.get(`${API_URL}/events`),
          axios.get(`${API_URL}/competitions?sort=new`).catch(() => ({ data: { competitions: [] } })),
          axios.get(`${API_URL}/categories`).catch(() => ({ data: [] })),
        ]);
        const eventsList = Array.isArray(eventsRes.data) ? eventsRes.data : [];
        const comps = compsRes.data?.competitions || [];
        const countMap = {};
        comps.forEach((c) => { countMap[c.id] = c.registration_count ?? 0; });
        const withCount = eventsList.map((e) => ({ ...e, registration_count: countMap[e.id] ?? 0 }));
        setEvents(withCount);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/events/${id}`);
      setEvents(events.filter(event => event.id !== id));
      toast.success("Event deleted successfully!");
    } catch (error) {
      toast.error("Error deleting event");
    }
    setDeleteModal({ isOpen: false, eventId: null, eventTitle: "" });
  };

  const handleSave = async (eventData) => {
    const formData = new FormData();
    formData.append('title', eventData.title);
    formData.append('date', eventData.date);
    formData.append('time', eventData.time);
    formData.append('location', eventData.location);
    formData.append('description', eventData.description);
    formData.append('registration_open', eventData.registration_open);
    formData.append('modules', eventData.modules ? eventData.modules.join(',') : '');
    // Convert module_amounts object to string format
    const moduleAmountsString = Object.entries(eventData.module_amounts || {})
      .map(([mod, amt]) => `${mod}:${amt}`)
      .join(',');
    formData.append('module_amounts', moduleAmountsString);
    // Add discount_codes as JSON string
    formData.append('discount_codes', JSON.stringify(eventData.discount_codes || []));
    if (eventData.category_id) formData.append('category_id', eventData.category_id);
    if (eventData.category_name) formData.append('category_name', eventData.category_name);
    if (eventData.rules != null) formData.append('rules', eventData.rules || '');
    if (eventData.prizes != null) formData.append('prizes', eventData.prizes || '');
    if (eventData.deadline != null) formData.append('deadline', eventData.deadline || '');
    if (currentImage) {
      formData.append('image', currentImage);
    }

    try {
      if (eventData.id) {
        // Update existing event
        const response = await axios.put(
          `${API_URL}/events/${eventData.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setEvents(events.map(event => 
          event.id === eventData.id ? response.data : event
        ));
        toast.success("Event saved successfully!");
      } else {
        // Create new event
        const response = await axios.post(
          `${API_URL}/events`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setEvents([response.data, ...events]);
        toast.success("Event saved successfully!");
      }
      setIsEditing(false);
      setCurrentImage(null);
      setModuleAmountsInput("");
    } catch (error) {
      toast.error("Failed to save event");
    }
  };

  const fetchRegistrations = async (eventId, eventObj = null) => {
    try {
      const response = await axios.get(`${API_URL}/events/${eventId}/registrations`);
      setRegistrations(response.data);
      if (eventObj) setCurrentEvent(eventObj);
      setIsViewingRegistrations(true);
    } catch (error) {
    }
  };

  // Update module amounts when input changes
  const handleModuleAmountsChange = (value) => {
    setModuleAmountsInput(value);
    
    // Parse the input and update module_amounts
    const amounts = {};
    if (value.trim()) {
      value.split(',').forEach(pair => {
        const [mod, amt] = pair.split(':').map(item => item.trim());
        if (mod && amt && !isNaN(Number(amt))) {
          amounts[mod] = Number(amt);
        }
      });
    }
    
    setCurrentEvent(prev => ({
      ...prev,
      module_amounts: amounts
    }));
  };

  // Reset form when opening edit modal
  const openEditModal = (event = null) => {
    if (event) {
      setCurrentEvent({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        description: event.description,
        image_url: event.image_url,
        registration_open: event.registration_open,
        modules: event.modules || [],
        module_amounts: event.module_amounts || {},
        discount_codes: event.discount_codes || [],
        category_id: event.category_id || "",
        category_name: event.category_name || "",
        rules: event.rules || "",
        prizes: event.prizes || "",
        deadline: event.deadline || "",
      });
      // Initialize module amounts input
      if (event.module_amounts && Object.keys(event.module_amounts).length > 0) {
        const amountsString = Object.entries(event.module_amounts)
          .map(([mod, amt]) => `${mod}:${amt}`)
          .join(', ');
        setModuleAmountsInput(amountsString);
      } else {
        setModuleAmountsInput("");
      }
    } else {
      setCurrentEvent({
        id: null,
        title: "",
        date: "",
        time: "",
        location: "",
        description: "",
        image_url: null,
        registration_open: true,
        modules: [],
        module_amounts: {},
        discount_codes: [],
        category_id: "",
        category_name: "",
        rules: "",
        prizes: "",
        deadline: "",
      });
      setModuleAmountsInput("");
    }
    setCurrentImage(null);
    setIsEditing(true);
  };

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptImageUrl, setReceiptImageUrl] = useState("");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Manage Events
          </span>
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Create and edit upcoming events and competitions for the club
        </p>
      </motion.div>

      <motion.div className="flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-medium"
          onClick={() => openEditModal()}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Event
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <motion.div
            key={event.id}
            whileHover={{ y: -5 }}
            className="bg-gray-700 rounded-xl p-6 border border-gray-600"
          >
            {event.image_url && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{event.title}</h3>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-green-400"
                  onClick={() => fetchRegistrations(event.id, event)}
                >
                  <UserIcon className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-blue-400"
                  onClick={() => openEditModal(event)}
                >
                  <PencilIcon className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-red-400"
                  onClick={() => setDeleteModal({ isOpen: true, eventId: event.id, eventTitle: event.title })}
                >
                  <TrashIcon className="h-5 w-5" />
                </motion.button>
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        eventTitle={deleteModal.eventTitle}
        onClose={() => setDeleteModal({ isOpen: false, eventId: null, eventTitle: "" })}
        onConfirm={() => handleDelete(deleteModal.eventId)}
      />
              </div>
            </div>
            
            <p className="text-gray-300 mb-4">{event.description}</p>
            
            {event.modules && event.modules.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-400 mb-2">Modules:</p>
                <div className="flex flex-wrap gap-2">
                  {event.modules.map((module, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-900 text-purple-200 text-xs rounded-full">
                      {module} {event.module_amounts && event.module_amounts[module] && `- ${event.module_amounts[module]}` } pkr
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {event.date}
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {event.time}
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {event.location}
              </div>
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                {event.registration_count ?? 0} registered
              </div>
            </div>
            
            <div className="flex items-center">
              {event.registration_open ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500">Registrations Open</span>
                </>
              ) : (
                <>
                  <XMarkIcon className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-500">Registrations Closed</span>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold mb-4 text-white">
              {currentEvent.id ? "Edit Event" : "Add New Event"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Title</label>
                <input
                  type="text"
                  value={currentEvent.title}
                  onChange={(e) => setCurrentEvent({...currentEvent, title: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2">Date</label>
                  <input
                    type="text"
                    value={currentEvent.date}
                    onChange={(e) => setCurrentEvent({...currentEvent, date: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-2">Time</label>
                  <input
                    type="text"
                    value={currentEvent.time}
                    onChange={(e) => setCurrentEvent({...currentEvent, time: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="HH:MM"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Location</label>
                <input
                  type="text"
                  value={currentEvent.location}
                  onChange={(e) => setCurrentEvent({...currentEvent, location: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Description</label>
                <textarea
                  value={currentEvent.description}
                  onChange={(e) => setCurrentEvent({...currentEvent, description: e.target.value})}
                  rows="3"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Category</label>
                <select
                  value={currentEvent.category_id || ""}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.id === e.target.value);
                    setCurrentEvent({
                      ...currentEvent,
                      category_id: e.target.value,
                      category_name: cat ? cat.name : "",
                    });
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Rules (optional)</label>
                <textarea
                  value={currentEvent.rules || ""}
                  onChange={(e) => setCurrentEvent({...currentEvent, rules: e.target.value})}
                  rows="2"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Competition rules"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Prizes (optional)</label>
                <textarea
                  value={currentEvent.prizes || ""}
                  onChange={(e) => setCurrentEvent({...currentEvent, prizes: e.target.value})}
                  rows="2"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Prize details"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-2">Registration deadline (optional)</label>
                <input
                  type="text"
                  value={currentEvent.deadline || ""}
                  onChange={(e) => setCurrentEvent({...currentEvent, deadline: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. 2026-03-01 or March 1, 2026"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Modules</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newModule} onChange={e => setNewModule(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" placeholder="Add module" />
                  <button type="button" onClick={handleAddModule} className="px-3 py-2 bg-purple-600 text-white rounded-lg">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentEvent.modules.map((mod, idx) => (
                    <span key={idx} className="px-2 py-1 bg-purple-900 text-purple-200 text-xs rounded-full flex items-center">
                      {mod}
                      <button type="button" onClick={() => handleRemoveModule(mod)} className="ml-2 text-red-400">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2 text-sm">Discount Codes (per module)</label>
                <div className="flex gap-2 mb-2">
                  <select value={newDiscountModule} onChange={e => setNewDiscountModule(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                    <option value="">Select module</option>
                    {currentEvent.modules.map((mod, idx) => (
                      <option key={idx} value={mod}>{mod}</option>
                    ))}
                  </select>
                  <input type="text" value={newDiscountCode} onChange={e => setNewDiscountCode(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" placeholder="Code" />
                  <input type="number" value={newDiscountAmount} onChange={e => setNewDiscountAmount(e.target.value)} className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" placeholder="Amount" />
                  <button type="button" onClick={handleAddDiscountCode} className="px-3 py-2 bg-pink-600 text-white rounded-lg">Add</button>
                </div>
                {/* Group discount codes by module */}
                {currentEvent.modules.map((mod, idx) => (
                  <div key={idx} className="mb-2">
                    <span className="text-purple-400 font-semibold text-sm">{mod}</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(currentEvent.discount_codes || []).filter(dc => dc.module === mod).map((dc, i) => (
                        <span key={i} className="px-2 py-1 bg-pink-900 text-pink-200 text-xs rounded-full flex items-center">
                          {dc.code} - {dc.amount} pkr
                          <button type="button" onClick={() => handleRemoveDiscountCode(dc.code, dc.module)} className="ml-2 text-red-400">×</button>
                        </span>
                      ))}
                      {(currentEvent.discount_codes || []).filter(dc => dc.module === mod).length === 0 && (
                        <span className="text-xs text-gray-500">No codes</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Module Amounts</label>
                <input
                  type="text"
                  value={moduleAmountsInput}
                  onChange={(e) => handleModuleAmountsChange(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  placeholder="Coding:500, AI:700, Web:400"
                />
                <p className="text-xs text-gray-500 mt-1">Format: Module:Amount, separate with commas</p>
                {Object.keys(currentEvent.module_amounts || {}).length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 mb-1">Current amounts:</p>
                    {Object.entries(currentEvent.module_amounts).map(([module, amount]) => (
                      <div key={module} className="text-xs text-green-400">
                        {module}: {amount} pkr
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Event Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCurrentImage(e.target.files[0])}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
                {currentEvent.image_url && !currentImage && (
                  <div className="mt-2">
                    <img 
                      src={currentEvent.image_url} 
                      alt="Current event" 
                      className="h-24 object-contain"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="registration_open"
                  checked={currentEvent.registration_open}
                  onChange={(e) => setCurrentEvent({...currentEvent, registration_open: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded"
                />
                <label htmlFor="registration_open" className="ml-2 text-gray-400">
                  Accepting Registrations
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gray-700 rounded-lg text-white font-medium"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentImage(null);
                  setModuleAmountsInput("");
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-medium"
                onClick={() => handleSave(currentEvent)}
              >
                Save
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}



      {isViewingRegistrations && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Event Registrations</h3>
              <button 
                onClick={() => setIsViewingRegistrations(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {registrations.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No registrations yet</p>
            ) : (
              <div className="space-y-4">
                {registrations.map((reg, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg">
                    <div className="mb-2">
                      <span className="font-bold text-purple-400">Team Name:</span> <span className="text-white">{reg.team_name}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-bold text-purple-400">Members:</span>
                      <ul className="ml-2">
                        {reg.members.map((member, idx) => (
                          <li key={idx} className="text-white text-sm">
                            {member.name} ({member.email})
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mb-2">
                      <span className="font-bold text-purple-400">Modules:</span>
                      <span className="ml-2 text-white">{reg.modules && reg.modules.length > 0 ? reg.modules.join(", ") : "-"}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-bold text-purple-400">Payment Status:</span> <span className="text-white">{reg.payment_status}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-bold text-purple-400">Transaction ID:</span> <span className="text-white">{reg.transaction_id || "-"}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-bold text-purple-400">Discount codes used:</span>
                      <span className="ml-2 text-white">
                        {reg.discount_codes_used && reg.discount_codes_used.length > 0
                          ? reg.discount_codes_used.map((dc, i) => (
                              <span key={i}>
                                {i > 0 && ", "}
                                <span className="text-green-400">{dc.module}</span>: {dc.code}
                              </span>
                            ))
                          : "-"}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-bold text-purple-400">Payment Receipt:</span>
                        {reg.payment_receipt_url ? (
                          <div className="ml-2 mt-2">
                            <img 
                              src={reg.payment_receipt_url} 
                              alt="Payment Receipt" 
                              className="h-32 w-auto rounded border border-gray-600 object-contain bg-gray-900 cursor-pointer" 
                              onClick={() => {
                                setReceiptImageUrl(reg.payment_receipt_url);
                                setShowReceiptModal(true);
                              }}
                            />
                          </div>
                        ) : (
                          <span className="ml-2 text-gray-400">Not submitted</span>
                        )}
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={async () => {
                          if (!currentEvent.id) {
                            toast.error("Event ID missing. Cannot approve registration.");
                            return;
                          }
                          try {
                            await axios.post(`${API_URL}/events/${currentEvent.id}/registrations/${reg.team_name}/approve`);
                            toast.success("Registration approved!");
                            fetchRegistrations(currentEvent.id);
                          } catch (err) {
                            toast.error("Failed to approve registration");
                          }
                        }}
                      >Approve</button>
                      <button
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={async () => {
                          if (!currentEvent.id) {
                            toast.error("Event ID missing. Cannot reject registration.");
                            return;
                          }
                          try {
                            await axios.post(`${API_URL}/events/${currentEvent.id}/registrations/${reg.team_name}/reject`);
                            toast.success("Registration rejected!");
                            fetchRegistrations(currentEvent.id);
                          } catch (err) {
                            toast.error("Failed to reject registration");
                          }
                        }}
                      >Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="relative bg-gray-900 rounded-xl p-4 border border-gray-700 max-w-2xl w-full flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl"
              onClick={() => setShowReceiptModal(false)}
            >
              &times;
            </button>
            <img
              src={receiptImageUrl}
              alt="Payment Receipt Large"
              className="max-h-[70vh] w-auto rounded border border-gray-600 object-contain bg-gray-900"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;