import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { API_BASE_URL } from "../utils/api";
import axios from "axios";

const SORT_OPTIONS = [
  { value: "new", label: "New" },
  { value: "most_registrations", label: "Most Registrations" },
  { value: "trending", label: "Trending" },
];

const Competitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("new");
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/categories`);
        setCategories(res.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchCompetitions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("sort", sort);
        if (categoryId) params.set("category_id", categoryId);
        if (search.trim()) params.set("search", search.trim());
        if (dateFrom) params.set("date_from", dateFrom);
        if (dateTo) params.set("date_to", dateTo);
        const res = await axios.get(`${API_BASE_URL}/competitions?${params}`);
        setCompetitions(res.data?.competitions || []);
      } catch (e) {
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCompetitions();
  }, [sort, categoryId, search, dateFrom, dateTo]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 pt-24 pb-16">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
              Competitions
            </span>
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Browse categories and competitions. Register for your next challenge.
          </p>
        </motion.div>

        {/* Toolbar: sort, search, filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Sort:</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sort === opt.value
                    ? "bg-sky-500 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-sky-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search competitions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-sky-50 text-slate-600"
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">From date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">To date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="rounded-full h-12 w-12 border-2 border-sky-500 border-t-transparent animate-spin" />
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">No competitions found. Try adjusting filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((comp) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-lg hover:shadow-sky-100 hover:border-sky-200 transition-all"
              >
                <Link to={`/competitions/${comp.id}`}>
                  {comp.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={comp.image_url}
                        alt={comp.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    {comp.category_name && (
                      <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded">
                        {comp.category_name}
                      </span>
                    )}
                    <h3 className="text-xl font-bold mt-2 text-slate-800">{comp.title}</h3>
                    <p className="text-slate-600 text-sm mt-1 line-clamp-2">{comp.description}</p>
                    <div className="flex items-center gap-2 mt-3 text-slate-500 text-sm">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{comp.date}</span>
                      <span>•</span>
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{comp.registration_count ?? 0} registered</span>
                    </div>
                    <div className="flex items-center mt-3">
                      {comp.registration_open ? (
                        <span className="inline-flex items-center text-green-600 text-sm">
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Registrations Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600 text-sm">
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Competitions;
