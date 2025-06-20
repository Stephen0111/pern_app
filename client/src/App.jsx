import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./login";
import Landing from "./landing";
import CheckoutPage from "./checkout";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [posts, setPosts] = useState([]);

  return <Login />;
  // return <Landing />;
  // return <CheckoutPage />;
}
export default App;
