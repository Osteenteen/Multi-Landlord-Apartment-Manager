import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { Building2, DollarSign, Users, AlertCircle, ChevronRight } from "lucide-react";
import PageLayout from "../components/PageLayout";

interface User {
  role: "tenant" | "landlord";
  apartmentId: string;
  phone: string;
  uid: string;
  name?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [apartmentName, setApartmentName] = useState("Loading Block...");
  const [apartmentAddress, setApartmentAddress] = useState("Loading Address...");

  // Tenant-specific state
  const [tenantBalance, setTenantBalance] = useState(0);
  const [tenantMonthlyRent, setTenantMonthlyRent] = useState(0);
  const [tenantHouseNo, setTenantHouseNo] = useState("");

  // Landlord-specific state
  const [totalTenantsCount, setTotalTenantsCount] = useState(0);
  const [totalCollectedRent, setTotalCollectedRent] = useState(0);
  const [totalOutstandingArrears, setTotalOutstandingArrears] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(stored) as User;
    setUser(userData);

    const initializeDashboardData = async () => {
      try {
        // Fetch Apartment details
        const aptRef = doc(db, "apartments", userData.apartmentId);
        const aptSnap = await getDoc(aptRef);
        if (aptSnap.exists()) {
          const aptData = aptSnap.data();
          setApartmentName(aptData.name || "Apartment Block");
          setApartmentAddress(aptData.location || "Kenya");
        }

        // Fetch role-specific data
        if (userData.role === "tenant") {
          const tenantRef = doc(db, "users", userData.uid);
          const tenantSnap = await getDoc(tenantRef);
          if (tenantSnap.exists()) {
            const tData = tenantSnap.data();
            setTenantBalance(Number(tData.balance || 0));
            setTenantMonthlyRent(Number(tData.monthlyRent || tData.rentAmount || 0));
            setTenantHouseNo(tData.houseNumber || tData.unit || "N/A");
          }
        } else {
          const usersRef = collection(db, "users");
          const q = query(
            usersRef,
            where("role", "==", "tenant"),
            where("associatedApartmentId", "==", userData.apartmentId)
          );
          
          const tenantListSnap = await getDocs(q);
          setTotalTenantsCount(tenantListSnap.size);

          let runningArrearsTotal = 0;
          let runningExpectedRentTotal = 0;

          tenantListSnap.docs.forEach((d) => {
            const row = d.data();
            const bal = Number(row.balance || 0);
            const rent = Number(row.monthlyRent || row.rentAmount || 0);
            
            runningArrearsTotal += bal;
            runningExpectedRentTotal += rent;
          });

          setTotalOutstandingArrears(runningArrearsTotal);
          const simulatedCollected = runningExpectedRentTotal - runningArrearsTotal;
          setTotalCollectedRent(simulatedCollected > 0 ? simulatedCollected : 0);
        }
      } catch (err) {
        console.error("Dashboard loading failed:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboardData();
  }, [navigate]);

  if (!user || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-sm font-medium text-gray-500">
        Loading Dashboard...
      </div>
    );
  }

  const isTenant = user.role === "tenant";

  return (
    <PageLayout
      user={user}
      apartmentName={apartmentName}
      title={isTenant ? "Your Rent & Billing Status" : "Property Performance Overview"}
      subtitle={`${apartmentName} • ${apartmentAddress}`}
    >
      {isTenant ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outstanding Balance</p>
              <p className={`text-3xl font-black tracking-tight mt-2 ${tenantBalance > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                KSh {tenantBalance.toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-4">Updated automatically via cloud ledger synchronization.</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Base Monthly Rent</p>
            <p className="text-3xl font-black tracking-tight mt-2 text-gray-900">
              KSh {tenantMonthlyRent.toLocaleString()}
            </p>
            <p className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded mt-4 inline-block">
              House: {tenantHouseNo}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 p-6 rounded-lg border border-purple-950 shadow-sm text-white flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">Instant Payment Link</p>
              <p className="text-sm text-purple-100 mt-2">
                Initiate a secure automated STK Push prompt to your registered Safaricom line.
              </p>
            </div>
            <button
              onClick={() => navigate("/pay-rent")}
              className="mt-4 w-full py-2 bg-white text-purple-950 font-bold rounded text-xs hover:bg-purple-50 transition-colors flex items-center justify-center gap-1"
            >
              <span>Clear Balance Now</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Occupied Units</p>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-black tracking-tight mt-2 text-gray-900">
                {totalTenantsCount}
              </p>
              <p className="text-xs text-gray-400 mt-4">Active allocated leases registered in your property index.</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Revenue Realized</p>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-black tracking-tight mt-2 text-emerald-600">
                KSh {totalCollectedRent.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-4">Calculated from outstanding statement invoices.</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Property Arrears</p>
                <AlertCircle className="w-4 h-4 text-gray-400" />
              </div>
              <p className={`text-3xl font-black tracking-tight mt-2 ${totalOutstandingArrears > 0 ? "text-red-600" : "text-gray-900"}`}>
                KSh {totalOutstandingArrears.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-4">Cumulative unresolved billing debt requiring follow-up.</p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-emerald-800">
              <Building2 className="w-5 h-5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Need to allocate spaces or modify existing tenant leases?</p>
                <p className="text-xs text-emerald-700 mt-0.5">Access the tenant manager grid module.</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/tenants")}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow whitespace-nowrap transition-colors"
            >
              Launch Tenants Panel
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
