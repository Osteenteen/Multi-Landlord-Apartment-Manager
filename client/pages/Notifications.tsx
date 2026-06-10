import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { ArrowLeft, Bell, CheckCircle2, DollarSign, UserPlus, AlertCircle, MailOpen } from "lucide-react";
import PageLayout from "../components/PageLayout";

interface UserSession {
  uid: string;
  role: "tenant" | "landlord";
  apartmentId: string;
  phone: string;
  name?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "payment" | "onboard" | "alert" | "general";
  read: boolean;
  timestamp: string;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [session, setSession] = useState<UserSession | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/");
      return;
    }

    const userData = JSON.parse(stored) as UserSession;
    setSession(userData);

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const notificationsRef = collection(db, "notifications");
        const q = query(notificationsRef, where("recipientId", "==", userData.uid));

        const snap = await getDocs(q);
        const list: NotificationItem[] = snap.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || "Notification Update",
          message: doc.data().message || "",
          type: doc.data().type || "general",
          read: doc.data().read || false,
          timestamp: doc.data().timestamp || new Date().toISOString(),
        }));

        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(list);
      } catch (err) {
        console.error("Firestore loading failure for notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [navigate]);

  const markAsRead = async (notificationId: string) => {
    try {
      const docRef = doc(db, "notifications", notificationId);
      await updateDoc(docRef, { read: true });

      setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    } catch (err) {
      console.error("Failed to update notification read status:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "payment":
        return (
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <DollarSign size={18} />
          </div>
        );
      case "onboard":
        return (
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <UserPlus size={18} />
          </div>
        );
      case "alert":
        return (
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
            <AlertCircle size={18} />
          </div>
        );
      default:
        return (
          <div className="p-2 bg-gray-100 text-gray-700 rounded-lg">
            <Bell size={18} />
          </div>
        );
    }
  };

  if (!session || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500 font-medium">
        Syncing Alert Communications Module... Please standby.
      </div>
    );
  }

  return (
    <PageLayout
      user={session}
      title="Inbox Alerts"
      headerRight={
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      }
    >
      {notifications.length === 0 ? (
        <div className="p-12 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2">
          <MailOpen size={32} className="text-gray-300" />
          <span className="font-bold text-gray-700">Your inbox is completely clear!</span>
          <span className="text-xs text-gray-400">System updates and receipts will show up here.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 bg-white rounded-xl border transition-all flex items-start justify-between gap-4 shadow-sm ${
                !item.read ? "border-purple-200 bg-gradient-to-r from-purple-50/20 to-white" : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {getIcon(item.type)}
                <div>
                  <h4 className={`text-sm text-gray-900 ${!item.read ? "font-bold" : "font-semibold"}`}>{item.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-gray-400 font-medium mt-2 block">
                    {new Date(item.timestamp).toLocaleString("en-KE")}
                  </span>
                </div>
              </div>

              {!item.read && (
                <button
                  onClick={() => markAsRead(item.id)}
                  className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-2 py-1 rounded whitespace-nowrap transition-colors"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
