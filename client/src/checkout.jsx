// CheckoutPage.jsx
import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  InputGroup,
} from "react-bootstrap";
import { FaCreditCard, FaLock, FaCalendarAlt } from "react-icons/fa"; // Imported relevant icons

const CheckoutPage = () => {
  // State for form fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [expiryDate, setExpiryDate] = useState(""); // MM/YY
  const [cvv, setCvv] = useState("");

  // State for validation
  const [validated, setValidated] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'error', null

  // Helper function to format card number with spaces
  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "");
    // Insert a space every 4 digits
    const formatted = digitsOnly.match(/.{1,4}/g)?.join(" ") || "";
    return formatted.substring(0, 19); // Max length for 16 digits + 3 spaces
  };

  // Helper function to format expiry date as MM/YY
  const formatExpiryDate = (value) => {
    const digitsOnly = value.replace(/\D/g, "");
    let formatted = "";
    if (digitsOnly.length > 0) {
      formatted += digitsOnly.substring(0, 2);
      if (digitsOnly.length > 2) {
        formatted += "/" + digitsOnly.substring(2, 4);
      }
    }
    return formatted.substring(0, 5); // Max length MM/YY (5 characters)
  };

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();

    // Basic validation logic
    if (form.checkValidity() === false || !validateCustomFields()) {
      setValidated(true);
      setPaymentStatus("error");
      return;
    }

    // Simulate payment processing
    setPaymentStatus(null); // Reset status
    console.log("Processing Payment with details:", {
      cardNumber: cardNumber.replace(/\s/g, ""), // Remove spaces for actual processing
      cardHolderName,
      expiryDate,
      cvv,
    });

    // In a real application, you would send these details to a payment gateway
    // For this example, we'll just set a success or error message
    setTimeout(() => {
      // Simulate a successful payment
      setPaymentStatus("success");
      // Optionally clear the form
      setCardNumber("");
      setCardHolderName("");
      setExpiryDate("");
      setCvv("");
      setValidated(false); // Reset validation state
    }, 1500);

    // For demonstration, uncomment the line below to simulate an error
    // setTimeout(() => { setPaymentStatus('error'); }, 1500);
  };

  // Custom validation for expiry date and CVV as browser's checkValidity() might not cover all custom patterns well
  const validateCustomFields = () => {
    let isValid = true;

    // Check expiry date format (MM/YY) and logic
    const [month, year] = expiryDate.split("/").map(Number);
    const currentYear = new Date().getFullYear() % 100; // Get last two digits of current year
    const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed

    if (
      !expiryDate ||
      !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate) || // MM/YY format
      month < 1 ||
      month > 12 ||
      year < currentYear || // Year is in the past
      (year === currentYear && month < currentMonth) // Month is in the past for current year
    ) {
      isValid = false;
    }

    // CVV validation (3 or 4 digits)
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      isValid = false;
    }

    // Card Number validation (basic length check, could use a library like 'validator' for Luhn algorithm)
    if (!cardNumber || cardNumber.replace(/\s/g, "").length !== 16) {
      isValid = false;
    }

    return isValid;
  };

  return (
    <Container fluid className="checkout-page-container">
      <Row className="justify-content-center">
        {/* Changed Col sizes to make the form wider on larger screens */}
        <Col xs={12} sm={10} md={8} lg={8} xl={7}>
          {" "}
          {/* Adjusted lg and xl for wider card */}
          <Card className="payment-card">
            <Card.Body>
              <Card.Title className="payment-card-title">
                Secure Payment
              </Card.Title>
              <Form noValidate validated={validated} onSubmit={handleSubmit}>
                {/* Card Number */}
                <Form.Group className="mb-3" controlId="formCardNumber">
                  <Form.Label className="form-label">Card Number</Form.Label>
                  <InputGroup hasValidation>
                    <InputGroup.Text>
                      <FaCreditCard />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="xxxx xxxx xxxx xxxx"
                      required
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(formatCardNumber(e.target.value))
                      }
                      isInvalid={
                        validated && cardNumber.replace(/\s/g, "").length !== 16
                      }
                      maxLength={19} // 16 digits + 3 spaces
                    />
                    <Form.Control.Feedback type="invalid">
                      Please enter a valid 16-digit card number.
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                {/* Card Holder Name */}
                <Form.Group className="mb-3" controlId="formCardHolderName">
                  <Form.Label className="form-label">
                    Card Holder Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Full Name"
                    required
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    isInvalid={validated && !cardHolderName.trim()}
                  />
                  <Form.Control.Feedback type="invalid">
                    Please enter the card holder's name.
                  </Form.Control.Feedback>
                </Form.Group>

                <Row className="mb-3">
                  {/* Expiry Date */}
                  {/* Adjusted Col to be full width on xs and half width on md and up */}
                  <Col xs={12} md={6}>
                    <Form.Group controlId="formExpiryDate">
                      <Form.Label className="form-label">
                        Expiry Date
                      </Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text>
                          <FaCalendarAlt />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="MM/YY"
                          required
                          value={expiryDate}
                          onChange={(e) =>
                            setExpiryDate(formatExpiryDate(e.target.value))
                          }
                          isInvalid={
                            validated &&
                            !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)
                          }
                          maxLength={5} // MM/YY
                        />
                        <Form.Control.Feedback type="invalid">
                          Please enter a valid expiry date (MM/YY).
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  {/* CVV */}
                  {/* Adjusted Col to be full width on xs and half width on md and up */}
                  <Col xs={12} md={6}>
                    <Form.Group controlId="formCvv">
                      <Form.Label className="form-label">CVV</Form.Label>
                      <InputGroup hasValidation>
                        <InputGroup.Text>
                          <FaLock />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="CVV"
                          required
                          value={cvv}
                          onChange={(e) =>
                            setCvv(
                              e.target.value.replace(/\D/g, "").substring(0, 4)
                            )
                          }
                          isInvalid={validated && !/^\d{3,4}$/.test(cvv)}
                          maxLength={4} // CVV can be 3 or 4 digits
                        />
                        <Form.Control.Feedback type="invalid">
                          Please enter a valid CVV (3 or 4 digits).
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Button type="submit" variant="dark" className="w-100 mt-4">
                  Make Payment
                </Button>

                {paymentStatus === "success" && (
                  <p className="payment-success-message mt-3">
                    Payment successful!
                  </p>
                )}
                {paymentStatus === "error" && (
                  <p className="payment-error-message mt-3">
                    Payment failed. Please check your details and try again.
                  </p>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;
