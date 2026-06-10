import { db, auth } from "../firebase"; // Ensure 'auth' is exported from your firebase.js
import { collection, getDocs, query, where } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Apartment {
  id: string;
  name: string;
  location: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"tenant" | "landlord" | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState("");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch live apartment profiles from Firestore
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "apartments"));
        const apartmentList: Apartment[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "Unnamed Property",
          location: doc.data().location || "Unknown Location",
        }));
        setApartments(apartmentList);
      } catch (err) {
        console.error("Firestore database fetching failed:", err);
        setErrorMsg("Failed to load listed apartments from the cloud database.");
      }
    };

    fetchApartments();
  }, []);

  // Secure Direct Firebase Email/Password Authentication Routine
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!role) {
      setErrorMsg("Please select whether you are a Tenant or a Landlord.");
      return;
    }
    if (!selectedApartment) {
      setErrorMsg("Please select your apartment from the dropdown menu.");
      return;
    }
    if (!email || !password) {
      setErrorMsg("Please fill in your email address and password.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Authenticate the user directly against Firebase Auth using Email and Password
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const authenticatedUser = userCredential.user;

      // Step 2: Double-check Firestore data to ensure they are assigned to this specific apartment and role
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", "==", email.trim().toLowerCase()),
        where("role", "==", role),
        where("associatedApartmentId", "==", selectedApartment)
      );

      const querySnapshot = await getDocs(q);

      // Security check: If they have a valid Auth account but don't match this role/apartment, block access
      if (querySnapshot.empty) {
        setErrorMsg("Access denied. Your email does not match this role or selected apartment block.");
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as any;

      // 🔒 LEASE ACCOUNT LOCKOUT GUARDIAN INTERCEPTOR [INDEX]
      if (userData.status === "inactive") {
        setErrorMsg("Access Denied! Your portal lease profile profile has been deactivated or suspended by the property manager.");
        setLoading(false);
        return;
      }

      // Save authorized session pointers locally
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: userDoc.id, 
          authUid: authenticatedUser.uid, 
          role: userData.role,
          apartmentId: userData.associatedApartmentId,
          phone: userData.phone || "",
          name: userData.name || "",
          email: email.trim()
        })
      );

      // Route to unified dashboard gateway channel
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Direct Email Auth Process Exception Error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        setErrorMsg("Authentication failed. Invalid email or password credentials.");
      } else {
        setErrorMsg("Network error. Could not establish communication with secure identity vectors.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-lg shadow-xl overflow-hidden">
          
          {/* Left Side - Desktop Branding Panel */}
          <div className="hidden lg:flex flex-col justify-between p-8 bg-gradient-to-br from-purple-50 via-white to-purple-50 border-r border-gray-100">
            <div>
              <div className="flex items-center gap-3 mb-12">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Building2 className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-xl text-gray-900 leading-none">RENT</h1>
                  <h2 className="font-bold text-xl text-gray-900 leading-none mt-1">MANAGEMENT</h2>
                  <p className="font-bold text-xs text-purple-600 tracking-widest mt-1">SYSTEM</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Manage your Kenyan rental units, track multi-landlord metrics, and automate processing systems seamlessly.
              </p>
            </div>

            {/* Desktop Role Choice Blocks */}
            <div className="space-y-3 my-6">
              <button
                type="button"
                onClick={() => { setRole("tenant"); setSelectedApartment(""); setErrorMsg(""); }}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left block",
                  role === "tenant" ? "border-purple-600 bg-purple-50/50" : "border-gray-200 bg-white hover:border-purple-400"
                )}
              >
                <p className="font-semibold text-gray-900">👥 I'm a Tenant</p>
                <p className="text-xs text-gray-500 mt-1">Pay rent and view your balance sheets instantly.</p>
              </button>

              <button
                type="button"
                onClick={() => { setRole("landlord"); setSelectedApartment(""); setErrorMsg(""); }}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left block",
                  role === "landlord" ? "border-green-600 bg-green-50/30" : "border-gray-200 bg-white hover:border-green-400"
                )}
              >
                <p className="font-semibold text-gray-900">🏠 I'm a Landlord</p>
                <p className="text-xs text-gray-500 mt-1">Track payouts, property details, and tenant allocations.</p>
              </button>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100 text-xs text-gray-500">
              <p>🔒 Secure Firebase Encrypted Authentication Active</p>
              <p>⏱️ Real-time updates tailored for Kenyan Landlords</p>
            </div>
          </div>

          {/* Right Side - Interactive Login Form Terminal */}
          <div className="flex flex-col justify-center p-8 sm:p-12">
            {/* Mobile Branding Layout Header */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Building2 className="text-white w-5 h-5" />
              </div>
              <h1 className="font-bold text-lg text-gray-900">RENT MANAGEMENT</h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                <p className="text-gray-500 text-sm mt-1">Select your profile details to connect securely.</p>
              </div>

              {/* Status Error Display Banner */}
              {errorMsg && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                  {errorMsg}
                </div>
              )}

              {/* Mobile Role Switching Grid Panel */}
              <div className="lg:hidden flex gap-2">
                <button
                  type="button"
                  onClick={() => { setRole("tenant"); setSelectedApartment(""); setErrorMsg(""); }}
                  className={cn("flex-1 py-2 text-sm font-medium rounded border transition-colors", role === "tenant" ? "bg-purple-600 text-white border-purple-600" : "bg-gray-50 text-gray-700 border-gray-200")}
                >
                  Tenant Profile
                </button>
                <button
                  type="button"
                  onClick={() => { setRole("landlord"); setSelectedApartment(""); setErrorMsg(""); }}
                  className={cn("flex-1 py-2 text-sm font-medium rounded border transition-colors", role === "landlord" ? "bg-green-600 text-white border-green-600" : "bg-gray-50 text-gray-700 border-gray-200")}
                >
                  Landlord Profile
                </button>
              </div>

              {/* Apartment Dropdown Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Select Managed Apartment Property</label>
                <select
                  value={selectedApartment}
                  onChange={(e) => setSelectedApartment(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900"
                >
                  <option value="">-- Choose Listing --</option>
                  {apartments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      {apt.name} — {apt.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email Input Row */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Email Address</label>
                <input
                  type="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Password Input Block */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">Password Account</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-md text-sm text-gray-900 pr-10 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submission Button Trigger */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-2.5 text-white font-semibold rounded-md shadow transition-colors text-sm mt-2 block",
                  role === "landlord" ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? "Authenticating Cloud Matrix..." : "Secure Login Portal"}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}