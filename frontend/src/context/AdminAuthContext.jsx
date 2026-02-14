import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";
import Cookies from "js-cookie";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminMe, setAdminMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = Cookies.get("adminAuthToken");
    if (!token) {
      setAdminMe(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/me`, {
        headers: { adminAuthToken: token },
      });
      setAdminMe(res.data);
    } catch {
      setAdminMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const hasPermission = (permission) => {
    if (!adminMe) return false;
    if (adminMe.is_full_admin) return true;
    return (adminMe.permissions || []).includes(permission);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminMe,
        loading,
        refetch: fetchMe,
        isFullAdmin: adminMe?.is_full_admin ?? false,
        permissions: adminMe?.permissions ?? [],
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
