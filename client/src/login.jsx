import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card, Nav } from "react-bootstrap";
import { FaEnvelope, FaLock, FaUser, FaPhone, FaHome } from "react-icons/fa";
import "./login.css";
import Landing from "./landing"; // Make sure this path is correct
import Spinner from "react-bootstrap/Spinner";

const Login = () => {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [validated, setValidated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // New state to manage loading state during auth check

  // New useEffect to check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Use the environment variable for your backend API calls
        const response = await fetch(
          `${import.meta.env.VITE_APP_API_URL}/checkauth`,
          {
            method: "GET",
            credentials: "include", // This is crucial to send the session cookie
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.isAuthenticated) {
            setIsAuthenticated(true);
            console.log("✅ Session restored for user:", data.user.email);
          } else {
            setIsAuthenticated(false);
            console.log("❌ No active session.");
          }
        } else {
          setIsAuthenticated(false);
          console.log(
            "❌ Backend auth check failed or no session:",
            response.status
          );
        }
      } catch (error) {
        console.error("❌ Network error during auth check:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false); // Set loading to false once check is complete
      }
    };

    checkAuthStatus();
  }, []); // Empty dependency array means this runs only once on mount

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setValidated(true);

    let endpoint = "";
    let bodyData = {};
    let successMessage = "";
    let errorMessage = "";

    if (tab === "login") {
      // Use the environment variable for your backend API calls
      endpoint = `${import.meta.env.VITE_APP_API_URL}/login`;
      bodyData = { email, password };
      successMessage = "✅ Login successful";
      errorMessage = "❌ Login failed";
    } else {
      // Use the environment variable for your backend API calls
      endpoint = `${import.meta.env.VITE_APP_API_URL}/register`;
      bodyData = {
        firstName,
        surname,
        email,
        password,
        phoneNumber,
        address,
      };
      successMessage = "✅ Registration successful! Please log in.";
      errorMessage = "❌ Registration failed";
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        console.log(successMessage);
        if (tab === "login") {
          setIsAuthenticated(true); // Set authenticated state to true on successful login
        } else if (tab === "register") {
          setTab("login");
          setFirstName("");
          setSurname("");
          setPhoneNumber("");
          setAddress("");
          setValidated(false);
        }
        setPassword("");
      } else {
        const text = await response.text();
        console.log(errorMessage + ":", text);
        setIsAuthenticated(false); // Ensure state is false on failed login
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      setIsAuthenticated(false); // Ensure state is false on network error
    }
  };

  // Show a loading indicator while checking auth status
  if (isLoading) {
    return (
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    );
  }

  // Conditionally render the LandingPage or the login/register form
  if (isAuthenticated) {
    return <Landing />; // Changed 'Landing' to 'LandingPage' for consistency with previous components
  }

  // If not authenticated and not loading, render the login/registration form
  return (
    <Container fluid className="auth-bg p-0 m-0">
      <Card className="auth-card d-flex flex-row">
        <Row className="g-0 w-100">
          {/* Left Panel */}
          <Col
            md={5}
            className="auth-side-panel text-white d-none d-md-flex flex-column justify-content-center align-items-center"
          >
            <img
              src="/client/ZINGA.png"
              alt="Logo"
              className="mb-4 logo"
              style={{ width: "120px", height: "auto" }}
            />
            <h2>{tab === "login" ? "Welcome Back" : "Join Us"}</h2>
            <p>
              {tab === "login" ? "Log in to continue" : "Create your account"}
            </p>

            <Nav variant="pills" activeKey={tab} onSelect={(k) => setTab(k)}>
              <Nav.Item>
                <Nav.Link eventKey="login">Login</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="register">Register</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>

          {/* Right Form Panel */}
          <Col
            md={7}
            className="p-5 d-flex align-items-center justify-content-center"
          >
            <div style={{ width: "100%", maxWidth: "500px" }}>
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                {tab === "login" ? (
                  <>
                    {/* Login Fields */}
                    <Form.Group
                      className="form-floating mb-3"
                      controlId="loginEmail"
                    >
                      <Form.Control
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />

                      <Form.Label>
                        <FaEnvelope className="me-2" />
                        Email address
                      </Form.Label>
                      <Form.Control.Feedback type="invalid">
                        Please enter a valid email.
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group
                      className="form-floating mb-3"
                      controlId="loginPassword"
                    >
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />

                      <Form.Label>
                        <FaLock className="me-2" />
                        Password
                      </Form.Label>
                      <Form.Control.Feedback type="invalid">
                        Password is required.
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 mt-3"
                    >
                      Login
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Registration Fields */}
                    <Row>
                      <Col>
                        <Form.Group
                          className="form-floating mb-3"
                          controlId="firstName"
                        >
                          <Form.Control
                            type="text"
                            placeholder="First name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                          <Form.Label>
                            <FaUser className="me-2" />
                            First Name
                          </Form.Label>
                          <Form.Control.Feedback type="invalid">
                            Required.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group
                          className="form-floating mb-3"
                          controlId="surname"
                        >
                          <Form.Control
                            type="text"
                            placeholder="Surname"
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                            required
                          />
                          <Form.Label>
                            <FaUser className="me-2" />
                            Surname
                          </Form.Label>
                          <Form.Control.Feedback type="invalid">
                            Required.
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group
                      className="form-floating mb-3"
                      controlId="registerEmail"
                    >
                      <Form.Control
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Form.Label>
                        <FaEnvelope className="me-2" />
                        Email address
                      </Form.Label>
                      <Form.Control.Feedback type="invalid">
                        Valid email required.
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group
                      className="form-floating mb-3"
                      controlId="registerPassword"
                    >
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Form.Label>
                        <FaLock className="me-2" />
                        Password
                      </Form.Label>
                      <Form.Control.Feedback type="invalid">
                        Required.
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group
                      className="form-floating mb-3"
                      controlId="phoneNumber"
                    >
                      <Form.Control
                        type="tel"
                        placeholder="Phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                      <Form.Label>
                        <FaPhone className="me-2" />
                        Phone Number
                      </Form.Label>
                      <Form.Control.Feedback type="invalid">
                        Required.
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group
                      className="form-floating mb-3"
                      controlId="address"
                    >
                      <Form.Control
                        as="textarea"
                        placeholder="Address"
                        style={{ height: "80px" }}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                      <Form.Label>
                        <FaHome className="me-2" />
                        Address
                      </Form.Label>
                      <Form.Control.Feedback type="invalid">
                        Required.
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 mt-3"
                    >
                      Register
                    </Button>
                  </>
                )}
              </Form>
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default Login;
