import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, getDoc, doc, query, where, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Plus, Edit, Eye, Trash2, Search, X, Bell } from "lucide-react";
import PageLayout from "../components/PageLayout";

interface Tenant {
  id: string;
  name: string;
  unit: string;
  phone: string;
  email: string;
  rentAmount: number;
  moveInDate: string;
  status: "active" | "inactive";
  balance: number;
}

interface User {
  role: "tenant" | "landlord";
  apartmentId: string;
  phone: string;
  uid: string;
}

export default function Tenants() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [apartmentName, setApartmentName] = useState("Loading Block...");

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    phone: "",
    email: "",
    rentAmount: 0,
    moveInDate: "",
    status: "active" as "active" | "inactive",
    
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(stored);
    if (userData.role !== "landlord") {
      navigate("/dashboard");
      return;
    }
    setUser(userData);

    const fetchApartmentMeta = async () => {
      try {
        const aptRef = doc(db, "apartments", userData.apartmentId);
        const aptSnap = await getDoc(aptRef);
        if (aptSnap.exists()) {
          setApartmentName(aptSnap.data().name || "Apartment Block");
        }
      } catch (err) {
        console.error("Error reading property context data:", err);
      }
    };

    fetchApartmentMeta();
  }, [navigate]);

  useEffect(() => {
    if (!user?.apartmentId) return;

    const fetchTenants = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("role", "==", "tenant"),
          where("associatedApartmentId", "==", user.apartmentId)
        );

        const snap = await getDocs(q);
        const dynamicList: Tenant[] = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "",
            unit: data.houseNumber || data.unit || "",
            phone: data.phone || "",
            email: data.email || "",
            rentAmount: Number(data.monthlyRent || data.rentAmount || 0),
            moveInDate: data.moveInDate || data.createdAt?.substring(0, 10) || "",
            status: (data.status === "inactive" ? "inactive" : "active") as "active" | "inactive",
            balance: Number(data.balance || 0),
          };
        });

        setTenants(dynamicList);
      } catch (err) {
        console.error("Error connecting to database rows:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, [user]);

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone.includes(searchTerm) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || tenant.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const openAddModal = () => {
    setModalMode("add");
    setSelectedTenant(null);
    setFormData({
      name: "",
      unit: "",
      phone: "",
      email: "",
      rentAmount: 0,
      moveInDate: new Date().toISOString().substring(0, 10),
      status: "active",
      
    });
    setShowModal(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setModalMode("edit");
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      unit: tenant.unit,
      phone: tenant.phone,
      email: tenant.email,
      rentAmount: tenant.rentAmount,
      moveInDate: tenant.moveInDate,
      status: tenant.status,
    });
    setShowModal(true);
  };

  const openViewModal = (tenant: Tenant) => {
    setModalMode("view");
    setSelectedTenant(tenant);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTenant(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.unit || !formData.phone || !user) {
      alert("Please populate the name, house/unit number, and phone fields.");
      return;
    }

    try {
      if (modalMode === "add") {
        const payload = {
          name: formData.name,
          role: "tenant",
          associatedApartmentId: user.apartmentId,
          houseNumber: formData.unit.toUpperCase(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          monthlyRent: Number(formData.rentAmount),
          moveInDate: formData.moveInDate,
          status: formData.status,
          password: "123456",
          balance: Number(formData.rentAmount),
          createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, "users"), payload);

        setTenants([
          ...tenants,
          {
            id: docRef.id,
            ...formData,
            unit: formData.unit.toUpperCase(),
            balance: Number(formData.rentAmount),
          },
        ]);
      } else if (modalMode === "edit" && selectedTenant) {
        const docRef = doc(db, "users", selectedTenant.id);
        await updateDoc(docRef, {
          name: formData.name,
          houseNumber: formData.unit.toUpperCase(),
          phone: formData.phone,
          email: formData.email,
          monthlyRent: Number(formData.rentAmount),
          moveInDate: formData.moveInDate,
          status: formData.status,
        });

        setTenants(
          tenants.map((t) =>
            t.id === selectedTenant.id ? { ...t, ...formData, unit: formData.unit.toUpperCase() } : t
          )
        );
      }
      closeModal();
    } catch (err) {
      console.error("Firestore write failure:", err);
      alert("Error saving record to database. Check cloud configuration connection keys.");
    }
  };

  const handleDelete = async (tenantId: string) => {
    if (confirm("Are you sure you want to permanently remove this tenant from database indices?")) {
      try {
        await deleteDoc(doc(db, "users", tenantId));
        setTenants(tenants.filter((t) => t.id !== tenantId));
      } catch (err) {
        console.error("Firestore execution delete error:", err);
        alert("Could not remove document from cloud index framework.");
      }
    }
  };

  const sendRentReminder = async (tenant: Tenant) => {
    try {
      const message = `Hi ${tenant.name}, this is a friendly reminder that you have a current balance of KSh ${tenant.balance.toLocaleString()}. Please make your payment as soon as possible.`;
      await addDoc(collection(db, "notifications"), {
        recipientId: tenant.id,
        title: "Rent Reminder",
        message: message,
        type: "alert",
        read: false,
        timestamp: new Date().toISOString(),
      });
      alert("Reminder sent successfully!");
    } catch (err) {
      console.error("Error sending reminder:", err);
      alert("Failed to send reminder.");
    }
  };

  if (!user) return null;

  return (
    <PageLayout
      user={user}
      apartmentName={apartmentName}
      title="Tenant Registry Matrix"
      headerRight={
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
        >
          <Plus size={16} />
          <span>Add Tenant Unit</span>
        </button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, room, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm text-gray-900 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-gray-500">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="p-2 border border-gray-300 rounded-md text-xs bg-white text-gray-900 focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Occupants</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Inactive Leases</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500">
          Querying Cloud Records Matrix Node... Please standby.
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="p-12 text-center text-sm text-gray-500 border border-dashed rounded-lg bg-white">
          No matching tenant listings located inside this apartment block.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-3">Tenant Name</th>
                  <th className="px-6 py-3">House No.</th>
                  <th className="px-6 py-3">Phone / Contact</th>
                  <th className="px-6 py-3">Rent (KSh)</th>
                  <th className="px-6 py-3">Balance (KSh)</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{tenant.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{tenant.unit}</td>
                    <td className="px-6 py-4">{tenant.phone}</td>
                    <td className="px-6 py-4">{tenant.rentAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${tenant.balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {tenant.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tenant.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border"}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => sendRentReminder(tenant)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-gray-100 rounded transition-colors"
                          title="Send Rent Reminder"
                        >
                          <Bell size={16} />
                        </button>
                        <button
                          onClick={() => openViewModal(tenant)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-gray-100 rounded transition-colors"
                          title="View Profiles"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(tenant)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                          title="Edit Parameters"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(tenant.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                          title="Remove Profile"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900 capitalize">
                {modalMode} Tenant Configurations
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={modalMode === "view"}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Unit / House No.</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  disabled={modalMode === "view"}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">M-Pesa Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={modalMode === "view"}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 font-mono bg-white disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={modalMode === "view"}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Monthly Charge Amount (KSh)
                </label>
                <input
                  type="number"
                  value={formData.rentAmount || ""}
                  onChange={(e) => setFormData({ ...formData, rentAmount: Number(e.target.value) })}
                  disabled={modalMode === "view"}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Move In Date</label>
                <input
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                  disabled={modalMode === "view"}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Lease Account Status Flag
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  disabled={modalMode === "view"}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white disabled:bg-gray-50"
                >
                  <option value="active">Active (Full App System Entry)</option>
                  <option value="inactive">Inactive (Deactivated/Locked out)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-3 mt-5">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {modalMode === "view" ? "Close Viewer" : "Cancel"}
              </button>
              {modalMode !== "view" && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 shadow"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
