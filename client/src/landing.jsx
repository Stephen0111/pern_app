// LandingPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Modal,
  Form,
  Nav,
  Pagination,
  Offcanvas, // Import Offcanvas
} from "react-bootstrap";
import {
  FaShoppingCart,
  FaStar,
  FaSearch,
  FaAngleLeft,
  FaAngleRight,
} from "react-icons/fa";

import "./LandinPage.css";
import CheckoutPage from "./checkout"; // Ensure this import path is correct (e.g., './CheckoutPage' or './components/CheckoutPage')

// Helper function to map DummyJSON product to your desired structure
const mapDummyJsonProduct = (p) => ({
  id: p.id,
  name: p.title,
  brand: p.brand || "Generic Brand",
  price: p.price,
  currency: "£", // Changed currency symbol
  imageUrl: p.thumbnail,
  description: p.description,
  details: `Category: ${p.category}\nBrand: ${p.brand || "N/A"}\nStock: ${
    p.stock || "N/A"
  }\nDimensions: ${
    p.dimensions
      ? `${p.dimensions.width}x${p.dimensions.height}x${p.dimensions.depth}`
      : "N/A"
  }\nWeight: ${p.weight || "N/A"}`,
  rating: p.rating,
  reviews: p.stock ? Math.max(1, Math.floor(p.stock * 0.5)) : 0,
  category: p.category,
  sizes: ["S", "M", "L", "XL"], // Mock sizes
  color: "Various", // Mock color
});

const LandingPage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]); // Stores actual cart items with details
  const [cartItemCount, setCartItemCount] = useState(0); // Derived from cartItems
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    category: "All",
    minPrice: "",
    maxPrice: "",
    color: "All",
    size: "All",
    searchQuery: "",
  });
  const [sortOption, setSortOption] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showCartOffcanvas, setShowCartOffcanvas] = useState(false); // State for Offcanvas
  const [showCheckoutPage, setShowCheckoutPage] = useState(false); // New state for showing CheckoutPage

  // Categories from DummyJSON
  const dummyJsonCategories = [
    "All",
    "smartphones",
    "laptops",
    "fragrances",
    "skincare",
    "groceries",
    "home-decoration",
    "furniture",
    "tops",
    "womens-dresses",
    "womens-shoes",
    "mens-shirts",
    "mens-shoes",
    "mens-watches",
    "womens-watches",
    "womens-bags",
    "womens-jewellery",
    "sunglasses",
    "automotive",
    "motorcycle",
    "lighting",
  ];

  // Effect to fetch products from DummyJSON and initialize cart
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await fetch(
          "https://dummyjson.com/products?limit=100"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const mappedData = data.products.map(mapDummyJsonProduct);
        setAllProducts(mappedData);
      } catch (error) {
        console.error("Error fetching products:", error);
        setFetchError("Failed to load products. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
    // Initialize cart items and count from localStorage on mount
    try {
      const storedCartItems = localStorage.getItem("cartItems");
      if (storedCartItems) {
        const parsedCartItems = JSON.parse(storedCartItems);
        setCartItems(parsedCartItems);
        setCartItemCount(
          parsedCartItems.reduce((sum, item) => sum + item.quantity, 0)
        );
      }
    } catch (error) {
      console.error("Error parsing cart items from localStorage:", error);
      setCartItems([]);
      setCartItemCount(0);
    }
  }, []);

  // Effect to update localStorage whenever cartItems changes
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    setCartItemCount(cartItems.reduce((sum, item) => sum + item.quantity, 0));
  }, [cartItems]);

  const handleCardClick = (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProduct(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handleAddToCart = (productToAdd) => {
    setCartItems((prevCartItems) => {
      const existingItem = prevCartItems.find(
        (item) => item.id === productToAdd.id
      );
      if (existingItem) {
        return prevCartItems.map((item) =>
          item.id === productToAdd.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCartItems, { ...productToAdd, quantity: 1 }];
      }
    });
    setShowDetailsModal(false);
  };

  // Functions for Offcanvas
  const handleShowCartOffcanvas = () => setShowCartOffcanvas(true);
  const handleCloseCartOffcanvas = () => setShowCartOffcanvas(false);

  const handleRemoveFromCart = (productId) => {
    setCartItems((prevCartItems) =>
      prevCartItems.filter((item) => item.id !== productId)
    );
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    setCartItems((prevCartItems) =>
      prevCartItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, newQuantity) }
          : item
      )
    );
  };

  const calculateCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // New function to proceed to checkout
  const handleProceedToCheckout = () => {
    setShowCartOffcanvas(false); // Close the cart offcanvas
    setShowCheckoutPage(true); // Show the checkout page
  };

  // New function to go back to shopping from checkout
  const handleBackToShopping = () => {
    setShowCheckoutPage(false); // Hide the checkout page
  };

  const filteredAndSortedProducts = allProducts
    .filter((product) => {
      if (filters.category !== "All" && product.category !== filters.category) {
        return false;
      }
      const minPrice = parseFloat(filters.minPrice);
      const maxPrice = parseFloat(filters.maxPrice);
      if (!isNaN(minPrice) && product.price < minPrice) {
        return false;
      }
      if (!isNaN(maxPrice) && product.price > maxPrice) {
        return false;
      }
      if (filters.color !== "All" && product.color !== filters.color) {
        return false;
      }
      if (filters.size !== "All" && !product.sizes.includes(filters.size)) {
        return false;
      }
      if (
        filters.searchQuery &&
        !product.name
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) &&
        !product.brand
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase()) &&
        !product.description
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOption === "price-asc") {
        return a.price - b.price;
      }
      if (sortOption === "price-desc") {
        return b.price - a.price;
      }
      if (sortOption === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredAndSortedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  useEffect(() => {
    setTotalPages(
      Math.ceil(filteredAndSortedProducts.length / productsPerPage)
    );
    setCurrentPage(1);
  }, [filteredAndSortedProducts.length, productsPerPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const renderPaginationItems = () => {
    let items = [];
    if (totalPages === 0) return items;

    items.push(
      <Pagination.Item
        key={1}
        active={1 === currentPage}
        onClick={() => paginate(1)}
      >
        1
      </Pagination.Item>
    );

    if (totalPages > 1) {
      if (currentPage > 3 && totalPages > 5) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 3);
      }
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }

      for (let number = startPage; number <= endPage; number++) {
        items.push(
          <Pagination.Item
            key={number}
            active={number === currentPage}
            onClick={() => paginate(number)}
          >
            {number}
          </Pagination.Item>
        );
      }

      if (currentPage < totalPages - 2 && totalPages > 5) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }

      if (totalPages > 1) {
        items.push(
          <Pagination.Item
            key={totalPages}
            active={totalPages === currentPage}
            onClick={() => paginate(totalPages)}
          >
            {totalPages}
          </Pagination.Item>
        );
      }
    }
    return items;
  };

  return (
    <>
      {showCheckoutPage ? (
        <Container fluid>
          <Button
            variant="dark"
            onClick={handleBackToShopping}
            className="mt-3 ms-3"
          >
            Back to Shopping
          </Button>
          {/* Pass cartItems as a prop to CheckoutPage */}
          <CheckoutPage cartItems={cartItems} />
        </Container>
      ) : (
        <Container fluid className="landing-page-container">
          {/* Top Bar */}
          <div className="top-bar d-flex justify-content-between align-items-center p-3">
            <div className="logo-placeholder">
              <h1>Bazinga</h1>
            </div>
            <div className="search-bar">
              <Form.Control
                type="text"
                placeholder="Search products..."
                name="searchQuery"
                value={filters.searchQuery}
                onChange={handleFilterChange}
                className="search-input"
              />
              <FaSearch className="search-icon" />
            </div>
            <div
              className="cart-icon-container"
              onClick={handleShowCartOffcanvas}
            >
              <FaShoppingCart className="cart-icon" />
              {cartItemCount > 0 && (
                <Badge pill bg="danger" className="cart-badge">
                  {cartItemCount}
                </Badge>
              )}
            </div>
          </div>

          <Row className="main-content-row flex-grow-1">
            {/* Left Sidebar for Sort and Filter */}
            <Col xs={3} md={3} lg={3} className="sidebar p-3">
              <h4 className="sidebar-title">Filters</h4>

              {/* Categories */}
              <Card className="filter-card mb-3">
                <Card.Header className="filter-card-header">
                  Categories
                </Card.Header>
                <Card.Body className="filter-card-body">
                  <Form.Select
                    aria-label="Category filter"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="filter-select" // Applied class
                  >
                    {dummyJsonCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat
                          .replace(/-/g, " ")
                          .split(" ")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </option>
                    ))}
                  </Form.Select>
                </Card.Body>
              </Card>

              {/* Price Range */}
              <Card className="filter-card mb-3">
                <Card.Header className="filter-card-header">
                  Price Range
                </Card.Header>
                <Card.Body className="filter-card-body">
                  <Form.Group className="mb-2">
                    <Form.Label className="filter-label">Min Price</Form.Label>{" "}
                    {/* Applied class */}
                    <Form.Control
                      type="number"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      placeholder="Min"
                      className="filter-input" // Applied class
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="filter-label">Max Price</Form.Label>{" "}
                    {/* Applied class */}
                    <Form.Control
                      type="number"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      placeholder="Max"
                      className="filter-input" // Applied class
                    />
                  </Form.Group>
                </Card.Body>
              </Card>

              {/* Color Filter (Effectiveness depends on data) */}
              <Card className="filter-card mb-3">
                <Card.Header className="filter-card-header">Color</Card.Header>
                <Card.Body className="filter-card-body">
                  <Form.Select
                    aria-label="Color filter"
                    name="color"
                    value={filters.color}
                    onChange={handleFilterChange}
                    className="filter-select" // Applied class
                  >
                    <option value="All">All</option>
                    <option value="Various">Various</option>
                    <option value="White">White</option>
                    <option value="Black">Black</option>
                    <option value="Blue">Blue</option>
                    <option value="Grey">Grey</option>
                  </Form.Select>
                </Card.Body>
              </Card>

              {/* Size Filter (Effectiveness depends on data) */}
              <Card className="filter-card mb-3">
                <Card.Header className="filter-card-header">Size</Card.Header>
                <Card.Body className="filter-card-body">
                  <Form.Select
                    aria-label="Size filter"
                    name="size"
                    value={filters.size}
                    onChange={handleFilterChange}
                    className="filter-select" // Applied class
                  >
                    <option value="All">All</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="One Size">One Size</option>
                  </Form.Select>
                </Card.Body>
              </Card>

              <h4 className="sidebar-title mt-4">Sort By</h4>
              <Form.Select
                aria-label="Sort by"
                value={sortOption}
                onChange={handleSortChange}
                className="mb-3 filter-select" // Applied class
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </Form.Select>
            </Col>

            {/* Vertical Separator Line */}
            <Col className="d-none d-md-block separator-line-col">
              <div className="vertical-separator"></div>
            </Col>

            {/* Main Product Grid */}
            <Col xs={9} md={9} lg={9} className="product-grid-container p-3">
              {isLoading ? (
                <p className="loading-message">Loading products...</p>
              ) : fetchError ? (
                <p className="error-message">{fetchError}</p>
              ) : currentProducts.length === 0 ? (
                <p className="no-products-message">
                  No products found matching your criteria.
                </p>
              ) : (
                <>
                  <Row xs={1} sm={2} md={2} lg={3} xl={4} className="g-4">
                    {currentProducts.map((product) => (
                      <Col key={product.id}>
                        <Card className="product-card">
                          <Card.Img
                            variant="top"
                            src={product.imageUrl}
                            alt={product.name}
                            onClick={() => handleCardClick(product)}
                            style={{ cursor: "pointer" }}
                          />
                          <Card.Body className="product-card-body">
                            <Card.Title
                              className="product-card-title"
                              onClick={() => handleCardClick(product)}
                              style={{ cursor: "pointer" }}
                            >
                              {product.name}
                            </Card.Title>
                            <Card.Text className="product-card-brand">
                              {product.brand}
                            </Card.Text>
                            <Card.Text className="product-card-price">
                              {product.currency} {product.price.toFixed(2)}
                            </Card.Text>
                            <div className="product-card-meta">
                              <span className="product-rating">
                                {product.rating}{" "}
                                <FaStar className="star-icon" />
                              </span>
                              <span className="product-reviews">
                                ({product.reviews} Reviews)
                              </span>
                            </div>
                            <Button
                              variant="outline-primary"
                              className="add-to-cart-btn mt-2"
                              onClick={() => handleCardClick(product)}
                            >
                              View Details
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        <Pagination.Prev
                          onClick={prevPage}
                          disabled={currentPage === 1}
                        >
                          <FaAngleLeft />
                        </Pagination.Prev>
                        {renderPaginationItems()}
                        <Pagination.Next
                          onClick={nextPage}
                          disabled={currentPage === totalPages}
                        >
                          <FaAngleRight />
                        </Pagination.Next>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>

          {/* Product Details Modal */}
          {selectedProduct && (
            <Modal
              show={showDetailsModal}
              onHide={handleCloseDetailsModal}
              size="lg"
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>{selectedProduct.name}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Row>
                  <Col md={6}>
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="img-fluid modal-product-img"
                    />
                  </Col>
                  <Col md={6}>
                    <h5>{selectedProduct.brand}</h5>
                    <h3 className="text-primary">
                      {selectedProduct.currency}{" "}
                      {selectedProduct.price.toFixed(2)}
                    </h3>
                    <p>{selectedProduct.description}</p>
                    <hr />
                    <h6>Details:</h6>
                    <pre className="product-details-pre">
                      {selectedProduct.details}
                    </pre>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <span className="product-rating">
                        Rating: {selectedProduct.rating}{" "}
                        <FaStar className="star-icon" />
                      </span>
                      <span className="product-reviews">
                        {selectedProduct.reviews} Reviews
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      className="w-100 mt-4"
                      onClick={() => handleAddToCart(selectedProduct)}
                    >
                      Add to Cart
                    </Button>
                  </Col>
                </Row>
              </Modal.Body>
            </Modal>
          )}

          {/* Cart Offcanvas */}
          <Offcanvas
            show={showCartOffcanvas}
            onHide={handleCloseCartOffcanvas}
            placement="end"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Your Shopping Cart</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : (
                <>
                  {cartItems.map((item) => (
                    <Card key={item.id} className="mb-3">
                      <Row className="g-0 align-items-center">
                        <Col xs={4}>
                          <Card.Img
                            src={item.imageUrl}
                            alt={item.name}
                            className="img-fluid rounded-start"
                          />
                        </Col>
                        <Col xs={8}>
                          <Card.Body>
                            <Card.Title className="h6">{item.name}</Card.Title>
                            <Card.Text>
                              {item.currency}{" "}
                              {(item.price * item.quantity).toFixed(2)}
                            </Card.Text>
                            <div className="d-flex align-items-center mb-2">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    item.quantity - 1
                                  )
                                }
                              >
                                -
                              </Button>
                              <span className="mx-2">{item.quantity}</span>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    item.quantity + 1
                                  )
                                }
                              >
                                +
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                className="ms-auto"
                                onClick={() => handleRemoveFromCart(item.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </Card.Body>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                  <div className="d-flex justify-content-between align-items-center mt-3 border-top pt-3">
                    <h5>Total:</h5>
                    <h5>
                      {cartItems.length > 0 ? cartItems[0].currency : "£"}{" "}
                      {calculateCartTotal().toFixed(2)}
                    </h5>
                  </div>
                  <Button
                    variant="dark"
                    className="w-100 mt-3"
                    onClick={handleProceedToCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                </>
              )}
            </Offcanvas.Body>
          </Offcanvas>
        </Container>
      )}
    </>
  );
};

export default LandingPage;
