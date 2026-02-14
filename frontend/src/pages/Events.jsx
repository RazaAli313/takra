import { useState, useEffect } from "react";
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckIcon,
  XMarkIcon,
  DocumentArrowUpIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

const Events = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState([
    { name: "", email: "", phone: "", university_name: "", university_roll_no: "", batch: "" },
    { name: "", email: "", phone: "", university_name: "", university_roll_no: "", batch: "" },
    { name: "", email: "", phone: "", university_name: "", university_roll_no: "", batch: "" }
  ]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [paymentData, setPaymentData] = useState({
    receipt: null,
    receiptName: "",
    transactionId: ""
  });
  // Store discount codes per module: { [module]: code }
  const [discountCodes, setDiscountCodes] = useState({});
  // Store discount info per module: { [module]: { valid, amount, message } }
  const [discountInfos, setDiscountInfos] = useState({});
  const [formStep, setFormStep] = useState(1);
  // Real-time team name availability (null = not checked, true/false = result)
  const [teamNameAvailable, setTeamNameAvailable] = useState(null);
  const [teamNameChecking, setTeamNameChecking] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
  const response = await axios.get(`${API_BASE_URL}/events`);
        setEvents(response.data);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Debounced real-time check for team name availability (Instagram-style)
  useEffect(() => {
    if (!currentEvent?.id || !showRegistration) return;
    const trimmed = (teamName || "").trim();
    if (trimmed.length < 2) {
      setTeamNameAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setTeamNameChecking(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/events/${currentEvent.id}/check-team-name`,
          { params: { team_name: trimmed } }
        );
        setTeamNameAvailable(res.data?.available ?? false);
      } catch {
        setTeamNameAvailable(null);
      } finally {
        setTeamNameChecking(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [currentEvent?.id, showRegistration, teamName]);

  const handleRegister = async () => {
    try {
      // Build members array from team registration form
      const filledMembers = members.filter(m => m.name && m.email);
      if (!teamName || filledMembers.length === 0) {
        toast.error("Please enter a team name and at least one member.");
        return;
      }
      
      // Just move to step 2 without submitting registration yet
      setFormStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    }
  };

  const handleModuleSelect = async () => {
  if (selectedModules.length === 0) {
    toast.error("Please select at least one module");
    return;
  }
  setIsProcessing(true);
  try {
    const filledMembers = members.filter(m => m.name && m.email);
    const payload = {
      team_name: teamName,
      members: filledMembers,
      modules: selectedModules
    };
  await axios.post(`${API_BASE_URL}/events/${currentEvent.id}/register`, payload);
    setFormStep(3);
    toast.success("Team registered successfully! Please proceed with payment.");
  } catch (error) {
    toast.error(error.response?.data?.detail || "Registration failed");
  } finally {
    setIsProcessing(false);
  }
};

  const handlePaymentSubmit = async () => {
  setIsProcessing(true);
  try {
    if (!paymentData.receipt || !paymentData.transactionId) {
      toast.error("Please provide both transaction ID and receipt");
      setIsProcessing(false);
      return;
    }
    const formData = new FormData();
    formData.append('receipt', paymentData.receipt);
    formData.append('transaction_id', paymentData.transactionId);
    formData.append('team_name', teamName);
    if (selectedModules.length > 0) {
      formData.append('competition', selectedModules[0]);
    }
    // Send discount codes used (for tracking): { module: code } for valid codes only
    const codesUsed = {};
    selectedModules.forEach(mod => {
      if (discountCodes[mod] && discountInfos[mod]?.valid) {
        codesUsed[mod] = discountCodes[mod];
      }
    });
    if (Object.keys(codesUsed).length > 0) {
      formData.append('discount_codes', JSON.stringify(codesUsed));
    }
  await axios.post(`${API_BASE_URL}/events/${currentEvent.id}/payment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    toast.success("Registration and payment submitted successfully!");
    resetForms();
  } catch (error) {
    toast.error(error.response?.data?.detail || "Payment submission failed. Please try again.");
  } finally {
    setIsProcessing(false);
  }
};

  const resetForms = () => {
    setShowRegistration(false);
    setFormStep(1);
    setCurrentEvent(null);
    setTeamName("");
    setMembers([
      { name: "", email: "", phone: "", university_name: "", university_roll_no: "", batch: "" },
      { name: "", email: "", phone: "", university_name: "", university_roll_no: "", batch: "" },
      { name: "", email: "", phone: "", university_name: "", university_roll_no: "", batch: "" }
    ]);
    setSelectedModules([]);
    setDiscountCodes({});
    setDiscountInfos({});
    setPaymentData({
      receipt: null,
      receiptName: "",
      transactionId: ""
    });
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        e.target.value = "";
        return;
      }
      
      setPaymentData({
        ...paymentData,
        receipt: file,
        receiptName: file.name
      });
    }
  };

  const toggleModuleSelection = (module) => {
    setSelectedModules(prev => 
      prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  // Get available modules from current event
  const availableModules = Array.isArray(currentEvent?.modules) ? currentEvent.modules : [];

  // Calculate total and discounted amount
  const totalAmount = Array.isArray(selectedModules) ? selectedModules.reduce((sum, mod) => sum + (currentEvent?.module_amounts?.[mod] || 0), 0) : 0;
  const discountedAmount = Array.isArray(selectedModules)
    ? selectedModules.reduce((sum, mod) => {
        const moduleAmount = currentEvent?.module_amounts?.[mod] || 0;
        const discount = discountInfos[mod]?.valid ? (discountInfos[mod].amount || 0) : 0;
        return sum + Math.max(0, moduleAmount - discount);
      }, 0)
    : 0;

  // Validate discount code
  // Validate discount code for a specific module
  const handleDiscountCodeValidate = async (mod) => {
    const code = discountCodes[mod];
    if (!code) {
      setDiscountInfos(prev => ({ ...prev, [mod]: null }));
      return;
    }
    try {
      const formData = new FormData();
      formData.append('code', code);
      formData.append('module', mod);
  const res = await axios.post(`${API_BASE_URL}/events/${currentEvent.id}/discount/validate`, formData);
      setDiscountInfos(prev => ({ ...prev, [mod]: { valid: true, amount: res.data.amount, message: res.data.message || "Discount applied!" } }));
      toast.success(res.data.message || `Discount code applied for ${mod}!`);
    } catch (err) {
      setDiscountInfos(prev => ({ ...prev, [mod]: { valid: false, amount: 0, message: err.response?.data?.detail || "Invalid discount code" } }));
      toast.error(err.response?.data?.detail || `Invalid discount code for ${mod}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 pt-20 pb-16 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 pt-20 pb-16">
      <div className="container mx-auto px-6 py-12">
        <div className="space-y-8 max-w-7xl mx-auto">
          <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-blue-600">
            Upcoming Events
          </span>
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Check out our upcoming events and workshops
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {Array.isArray(events) && events.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg hover:shadow-sky-50 hover:border-sky-200 transition-all flex flex-col shadow-sm"
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
            
            <h3 className="text-xl font-bold mb-4 text-slate-800">{event.title}</h3>
            <p className="text-slate-600 mb-4 flex-grow">{event.description}</p>
            
            {event.modules && event.modules.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-500 mb-2">Modules:</p>
                <div className="flex flex-wrap gap-2">
                  {event.modules.map((module, index) => (
                    <span key={index} className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-full">
                      {module} {event.module_amounts && event.module_amounts[module] && `- ${event.module_amounts[module]}`} pkr
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-3 text-sm text-slate-500 mb-4">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2" />
                <span>{event.location}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-4">
              <div className="flex items-center">
                {event.registration_open ? (
                  <>
                    <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500 text-sm">Registrations Open</span>
                  </>
                ) : (
                  <>
                    <XMarkIcon className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500 text-sm">Registrations Closed</span>
                  </>
                )}
              </div>
              
              <button
                onClick={() => {
                  if (event.registration_open) {
                    setCurrentEvent(event);
                    setShowRegistration(true);
                  }
                }}
                disabled={!event.registration_open}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${
                  event.registration_open
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90 shadow-sm"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                Register
              </button>
            </div>
          </div>
        ))}
      </div>

      {showRegistration && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                {formStep === 1 && "Team Registration"}
                {formStep === 2 && "Select Modules"}
                {formStep === 3 && "Payment Details"}
              </h3>
              <button 
                onClick={resetForms}
                className="text-slate-500 hover:text-slate-800"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Step 1: Team Registration Form */}
            {formStep === 1 && (
              <div className="space-y-4">
                <p className="text-slate-600 text-sm mb-2">Registering for: <span className="font-semibold text-slate-800">{currentEvent.title}</span></p>
                
                <div>
                  <label className="block text-slate-500 mb-2 text-sm">Team Name *</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    className={`w-full bg-slate-100 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 ${
                      teamNameAvailable === false ? "border-red-500" : teamNameAvailable === true ? "border-green-500" : "border-slate-200"
                    }`}
                    placeholder="Enter your team name"
                  />
                  {teamNameChecking && (
                    <p className="mt-1.5 text-sm text-slate-500 flex items-center gap-1">
                      <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
                      Checking...
                    </p>
                  )}
                  {!teamNameChecking && teamName.trim().length >= 2 && teamNameAvailable === true && (
                    <p className="mt-1.5 text-sm text-green-400 flex items-center gap-1">
                      <CheckIcon className="h-4 w-4" />
                      Available
                    </p>
                  )}
                  {!teamNameChecking && teamName.trim().length >= 2 && teamNameAvailable === false && (
                    <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                      <XMarkIcon className="h-4 w-4" />
                      This team name is already taken
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-slate-600 font-semibold">Team Members (1-3 members)</h4>
                  {members.map((member, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4">
                      <h5 className="text-sky-600 font-medium mb-3">Member {idx + 1} {idx === 0 && <span className="text-red-500">*</span>}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-500 mb-1 text-xs">Full Name *</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={e => {
                              const updated = [...members];
                              updated[idx].name = e.target.value;
                              setMembers(updated);
                            }}
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm"
                            placeholder="Full Name"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1 text-xs">Email *</label>
                          <input
                            type="email"
                            value={member.email}
                            onChange={e => {
                              const updated = [...members];
                              updated[idx].email = e.target.value;
                              setMembers(updated);
                            }}
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm"
                            placeholder="Email"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1 text-xs">Phone Number</label>
                          <input
                            type="tel"
                            value={member.phone}
                            onChange={e => {
                              const updated = [...members];
                              updated[idx].phone = e.target.value;
                              setMembers(updated);
                            }}
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm"
                            placeholder="Phone Number"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1 text-xs">University Name</label>
                          <input
                            type="text"
                            value={member.university_name}
                            onChange={e => {
                              const updated = [...members];
                              updated[idx].university_name = e.target.value;
                              setMembers(updated);
                            }}
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm"
                            placeholder="University Name"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1 text-xs">University Roll No</label>
                          <input
                            type="text"
                            value={member.university_roll_no}
                            onChange={e => {
                              const updated = [...members];
                              updated[idx].university_roll_no = e.target.value;
                              setMembers(updated);
                            }}
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm"
                            placeholder="University Roll No"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1 text-xs">Batch</label>
                          <input
                            type="text"
                            value={member.batch}
                            onChange={e => {
                              const updated = [...members];
                              updated[idx].batch = e.target.value;
                              setMembers(updated);
                            }}
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm"
                            placeholder="Batch (e.g F22)"
                          />
                        </div>
                      </div>
                      {idx === 0 && (
                        <p className="text-xs text-red-400 mt-2">Member 1 details are mandatory</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between space-x-3 mt-6">
                  <button
                    onClick={resetForms}
                    className="px-4 py-2 bg-slate-100 rounded-lg text-slate-800 font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={teamNameAvailable === false || teamNameChecking}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      teamNameAvailable === false || teamNameChecking
                        ? "bg-slate-100 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90"
                    }`}
                  >
                    Select Modules
                  </button>
                </div>
              </div>
            )}
            
            {/* Step 2: Module Selection */}
            {formStep === 2 && (
              <div className="space-y-4">
                <p className="text-gray-300 text-sm mb-4">Select which modules your team wants to participate in:</p>
                
                <div className="space-y-3">
                  {availableModules.map((module) => (
                    <div 
                      key={module}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedModules.includes(module)
                          ? "border-sky-500 bg-sky-100 bg-opacity-20"
                          : "border-slate-200 hover:border-gray-500"
                      }`}
                      onClick={() => toggleModuleSelection(module)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`h-5 w-5 rounded-full border mr-3 flex items-center justify-center ${
                            selectedModules.includes(module)
                              ? "border-sky-500 bg-sky-500"
                              : "border-gray-500"
                          }`}>
                            {selectedModules.includes(module) && (
                              <div className="h-2 w-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800">{module}</h4>
                            {currentEvent.module_amounts && currentEvent.module_amounts[module] && (
                              <p className="text-sm text-green-400">{currentEvent.module_amounts[module]} pkr</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between space-x-3 mt-6">
                  <button
                    onClick={() => setFormStep(1)}
                    className="px-4 py-2 bg-slate-100 rounded-lg text-slate-800 font-medium text-sm"
                  >
                    Back
                  </button>
                 <button
  onClick={handleModuleSelect}
  disabled={selectedModules.length === 0 || isProcessing}
  className={`px-4 py-2 rounded-lg font-medium text-sm ${
    selectedModules.length === 0 || isProcessing
      ? "bg-slate-100 text-gray-500 cursor-not-allowed"
      : "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90"
  }`}
>
  {isProcessing ? (
    <span className="flex items-center justify-center">
      <svg className="animate-spin h-5 w-5 mr-2 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      Processing...
    </span>
  ) : (
    "Proceed to Payment"
  )}
</button>
                </div>
              </div>
            )}
            
            {/* Step 3: Payment Form */}
            {formStep === 3 && (
              <div className="space-y-4">
                <p className="text-gray-300 text-sm mb-4">
                  Complete your registration for the selected modules:
                </p>
                {/* Static Bank Details */}
                <div className="bg-slate-100 rounded-lg p-4 mb-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">Bank Details for Payment</h4>
                  <div className="space-y-1 text-sm text-gray-300">
                    <div><span className="font-bold text-slate-800">Title:</span> RAZA ALI</div>
                    <div><span className="font-bold text-slate-800">Bank Name:</span> Bank Islami</div>
                    <div><span className="font-bold text-slate-800">Account No.:</span> 211100356960001</div>
                    <div><span className="font-bold text-slate-800">IBAN:</span> PK49BKIP0211100356960001</div>
                  </div>
                </div>
                <div className="bg-slate-100 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-slate-800 mb-2">Selected Modules:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModules.map((module, index) => (
                      <span key={index} className="px-3 py-1 bg-sky-100 text-sky-700 text-sm rounded-full">
                        {module} {currentEvent.module_amounts && currentEvent.module_amounts[module] && `- ${currentEvent.module_amounts[module]}`} pkr
                      </span>
                    ))}
                  </div>
                  {/* Per-module discount code input and validation */}
                  <div className="mt-4 space-y-2">
                    {selectedModules.map(mod => (
                      <div key={mod} className="mb-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Discount code for {mod}:</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={discountCodes[mod] || ""}
                            onChange={e => setDiscountCodes(prev => ({ ...prev, [mod]: e.target.value }))}
                            className="px-2 py-1 rounded bg-slate-200 border border-slate-300 text-slate-800"
                            placeholder="Enter code"
                          />
                          <button
                            type="button"
                            className="px-3 py-1 bg-sky-600 text-white rounded"
                            onClick={() => handleDiscountCodeValidate(mod)}
                          >
                            Validate
                          </button>
                        </div>
                        {discountInfos[mod]?.valid && (
                          <span className="text-green-400 text-xs ml-2">Discount Applied: -{discountInfos[mod].amount} pkr</span>
                        )}
                        {discountInfos[mod] && !discountInfos[mod].valid && (
                          <span className="text-red-400 text-xs ml-2">{discountInfos[mod].message}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <p className="text-slate-800 text-sm font-semibold">Total Amount: {totalAmount} pkr</p>
                    <p className="text-pink-400 text-lg font-bold">Payable Amount: {discountedAmount} pkr</p>
                  </div>
                </div>
                <div>
                  {/* Removed old single discount code input. Use per-module discount above. */}
                </div>
                <div>
                  <label className="block text-slate-500 mb-2 text-sm">Transaction ID *</label>
                  <input
                    type="text"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({...paymentData, transactionId: e.target.value})}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                    placeholder="Enter your transaction ID"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-2 text-sm">Payment Receipt (Max 2MB) *</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer bg-slate-100 hover:bg-gray-650 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <DocumentArrowUpIcon className="w-8 h-8 mb-3 text-slate-500" />
                        <p className="mb-2 text-sm text-slate-500">
                          {paymentData.receiptName || (
                            <>
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 2MB)</p>
                      </div>
                      <input 
                        id="dropzone-file" 
                        type="file" 
                        className="hidden" 
                        onChange={handleReceiptUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex justify-between space-x-3 mt-6">
                  <button
                    onClick={() => setFormStep(2)}
                    className="px-4 py-2 bg-slate-100 rounded-lg text-slate-800 font-medium text-sm"
                  >
                    Back
                  </button>
                 <button
  onClick={handlePaymentSubmit}
  disabled={!paymentData.receipt || !paymentData.transactionId || isProcessing}
  className={`px-4 py-2 rounded-lg font-medium text-sm ${
    !paymentData.receipt || !paymentData.transactionId || isProcessing
      ? "bg-slate-100 text-gray-500 cursor-not-allowed"
      : "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:opacity-90"
  }`}
>
  {isProcessing ? (
    <span className="flex items-center justify-center">
      <svg className="animate-spin h-5 w-5 mr-2 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      Processing...
    </span>
  ) : (
    "Complete Registration"
  )}
</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default Events;