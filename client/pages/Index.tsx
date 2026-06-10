import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./Login";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return <Login />;
}
