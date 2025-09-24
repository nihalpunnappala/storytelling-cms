import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Package, ExternalLink, FileText, Search, Upload, Image, Link } from "lucide-react";
import { getData, postData, putData, deleteData } from "../../../../backend/api";
import { useUser } from "../../../../contexts/UserContext";

// Utility function for logging
const logAction = (action, details = {}) => {
  console.log(`[Product Catalog] ${action}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};

export default function ProductCatalog({ exhibitorData }) {
  const user = useUser(); // Get current user from context
  
  // Log exhibitor data for debugging
  useEffect(() => {
    logAction("Product Catalog component mounted", { 
      exhibitorData: exhibitorData,
      user: user,
      exhibitorDataKeys: exhibitorData ? Object.keys(exhibitorData) : null,
      userKeys: user ? Object.keys(user) : null
    });
  }, [exhibitorData, user]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    productName: "",
    productDescription: "",
    productLink: "",
    productLogo: "",
    productImage: "",
    BrochureUrl: ""
  });
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentExhibitorId, setCurrentExhibitorId] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);

  // Get current exhibitor ID and event ID
  useEffect(() => {
    logAction("useEffect triggered for ID extraction", { 
      user: user,
      exhibitorData: exhibitorData,
      userKeys: user ? Object.keys(user) : null,
      exhibitorDataKeys: exhibitorData ? Object.keys(exhibitorData) : null
    });

    const getCurrentExhibitorId = () => {
      // First, try to get from exhibitorData (the exhibitor we're managing)
      if (exhibitorData?._id) {
        logAction("Retrieved exhibitor ID from exhibitorData._id", { exhibitorId: exhibitorData._id });
        return exhibitorData._id;
      }
      
      // Try to get from user context as fallback
      if (user?._id) {
        logAction("Retrieved exhibitor ID from user context (fallback)", { exhibitorId: user._id });
        return user._id;
      }
      
      // Try to get from localStorage as last fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.userId) {
            logAction("Retrieved exhibitor ID from localStorage (fallback)", { exhibitorId: userData.userId });
            return userData.userId;
          }
        } catch (error) {
          logAction("Error parsing user data from localStorage", { error: error.message });
        }
      }
      
      logAction("No valid exhibitor ID found", { user: user, exhibitorData: exhibitorData });
      return null;
    };

    const getCurrentEventId = () => {
      logAction("Getting current event ID", { 
        exhibitorData: exhibitorData,
        exhibitorDataEvent: exhibitorData?.event,
        exhibitorDataId: exhibitorData?._id,
        exhibitorDataEventKeys: exhibitorData?.event ? Object.keys(exhibitorData.event) : null
      });
      
      // Try to get event ID from exhibitorData.event._id (populated event object)
      if (exhibitorData?.event?._id) {
        logAction("Retrieved event ID from exhibitorData.event._id", { eventId: exhibitorData.event._id });
        return exhibitorData.event._id;
      }
      
      // Try to get from exhibitorData.event (if it's just the ID string)
      if (exhibitorData?.event && typeof exhibitorData.event === 'string') {
        logAction("Retrieved event ID from exhibitorData.event (string)", { eventId: exhibitorData.event });
        return exhibitorData.event;
      }
      
      // Try to get from exhibitorData directly (fallback)
      if (exhibitorData?._id) {
        logAction("Retrieved event ID from exhibitorData._id (fallback)", { eventId: exhibitorData._id });
        return exhibitorData._id;
      }
      
      logAction("No valid event ID found", { exhibitorData: exhibitorData });
      return null;
    };

    const exhibitorId = getCurrentExhibitorId();
    const eventId = getCurrentEventId();
    
    logAction("Setting IDs", { exhibitorId: exhibitorId, eventId: eventId });
    
    setCurrentExhibitorId(exhibitorId);
    setCurrentEventId(eventId);
  }, [user, exhibitorData]);

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log("user context:", user);
    console.log("exhibitorData prop:", exhibitorData);
    console.log("Current Exhibitor ID:", currentExhibitorId);
    console.log("Current Event ID:", currentEventId);
  }, [currentExhibitorId, currentEventId]);

  // Fetch products from API
  const fetchProducts = async () => {
    if (!currentExhibitorId) {
      logAction("No exhibitor ID available, skipping fetch");
      setIsLoading(false);
      return;
    }

    try {
      logAction("Fetching products", { 
        exhibitorId: currentExhibitorId,
        eventId: currentEventId 
      });
      setIsLoading(true);

      // Build query parameters
      const apiParams = { 
        exhibitor: currentExhibitorId,
        searchkey: "",
        skip: 0,
        limit: 100
      };

      // Add event filter if available
      if (currentEventId) {
        apiParams.event = currentEventId;
      }
      
      logAction("Making API call with params", apiParams);
      
      const response = await getData(apiParams, "product");

      logAction("API response received", { 
        status: response.status,
        success: response.data?.success,
        message: response.data?.message,
        responseData: response.data
      });
      
      if (response.status === 200 && response.data.success) {
        const productsData = response.data.response || [];
        logAction("Products fetched successfully", { 
          count: productsData.length,
          exhibitorId: currentExhibitorId,
          eventId: currentEventId,
          products: productsData
        });
        setProducts(productsData);
      } else {
        logAction("Failed to fetch products", { 
          status: response.status,
          message: response.data?.message,
          fullResponse: response.data
        });
        showToast("Failed to load products", "Please try again", "error");
      }
    } catch (error) {
      logAction("Error fetching products", { error: error.message });
      showToast("Error loading products", "Please check your connection and try again", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Load products when component mounts or exhibitor/event ID changes
  useEffect(() => {
    logAction("useEffect for fetchProducts triggered", { 
      currentExhibitorId: currentExhibitorId, 
      currentEventId: currentEventId 
    });
    
    // Only fetch if exhibitor ID is available
    if (currentExhibitorId) {
      logAction("Exhibitor ID available, calling fetchProducts");
      fetchProducts();
    } else {
      logAction("Missing exhibitor ID, skipping fetchProducts", { 
        currentExhibitorId: currentExhibitorId, 
        currentEventId: currentEventId 
      });
    }
  }, [currentExhibitorId, currentEventId]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.productDescription && product.productDescription.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentExhibitorId) {
      showToast("Error", "Exhibitor ID not available", "error");
      return;
    }

    try {
      const productData = {
        ...formData,
        exhibitor: currentExhibitorId
      };

      // Add event ID if available
      if (currentEventId) {
        productData.event = currentEventId;
      }

      if (editingProduct) {
        // Update existing product
        logAction("Updating product", { productId: editingProduct._id, productData });
        const response = await putData({ ...productData, id: editingProduct._id }, "product");
        
        if (response.status === 200 && response.data.success) {
          logAction("Product updated successfully", { productId: editingProduct._id });
          showToast("Product updated successfully", "", "success");
          setIsEditModalOpen(false);
          setEditingProduct(null);
          fetchProducts(); // Refresh the list
        } else {
          logAction("Failed to update product", { response: response.data });
          showToast("Failed to update product", "Please try again", "error");
        }
      } else {
        // Add new product
        logAction("Creating new product", { productData });
        const response = await postData(productData, "product");
        
        if (response.status === 200 && response.data.success) {
          logAction("Product created successfully", { productId: response.data.response._id });
          showToast("Product added successfully", "", "success");
          setIsAddModalOpen(false);
          fetchProducts(); // Refresh the list
        } else {
          logAction("Failed to create product", { response: response.data });
          showToast("Failed to add product", "Please try again", "error");
        }
      }
      
      resetForm();
    } catch (error) {
      logAction("Error in handleSubmit", { error: error.message });
      showToast("Error", "Something went wrong. Please try again.", "error");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName || "",
      productDescription: product.productDescription || "",
      productLink: product.productLink || "",
      productLogo: product.productLogo || "",
      productImage: product.productImage || "",
      BrochureUrl: product.BrochureUrl || ""
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        logAction("Deleting product", { productId });
        const response = await deleteData({ id: productId }, "product");
        
        if (response.status === 200 && response.data.success) {
          logAction("Product deleted successfully", { productId });
          showToast("Product deleted successfully", "", "success");
          fetchProducts(); // Refresh the list
        } else {
          logAction("Failed to delete product", { response: response.data });
          showToast("Failed to delete product", "Please try again", "error");
        }
      } catch (error) {
        logAction("Error deleting product", { error: error.message });
        showToast("Error", "Something went wrong. Please try again.", "error");
      }
    }
  };

  const resetForm = () => {
    setFormData({ 
      productName: "", 
      productDescription: "", 
      productLink: "", 
      productLogo: "", 
      productImage: "", 
      BrochureUrl: "" 
    });
    setEditingProduct(null);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, [field]: url }));
    }
  };

  // Toast functionality
  const showToast = (title, description, variant = "success") => {
    logAction("Show toast", { title, description, variant });
    setToast({ title, description, variant });
    setTimeout(() => setToast(null), 3000);
  };

  // Show loading or error state if no exhibitor ID
  if (!currentExhibitorId && !isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load product catalog</h3>
          <p className="text-gray-500">
            Please ensure you are logged in as an exhibitor and have selected an event.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px] ${
          toast.variant === 'error' ? 'border-red-200' : 'border-green-200'
        }`}>
          <div className={`text-sm font-medium ${toast.variant === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {toast.title}
          </div>
          {toast.description && (
            <div className="text-sm text-gray-600 mt-1">{toast.description}</div>
          )}
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">
              {exhibitorData?.companyName ? `${exhibitorData.companyName} - Product Catalog` : "Product Catalog"}
            </span>
          </div>
          {exhibitorData && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Exhibitor Info</h3>
              <div className="space-y-1 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Company:</span> {exhibitorData.companyName}
                </div>
                {exhibitorData.boothNumber && (
                  <div>
                    <span className="font-medium">Booth:</span> {exhibitorData.boothNumber}
                  </div>
                )}
                {exhibitorData.category?.categoryName && (
                  <div>
                    <span className="font-medium">Category:</span> {exhibitorData.category.categoryName}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {exhibitorData?.companyName ? `${exhibitorData.companyName} - Product Catalog` : "Product Catalog"}
              </h1>
              <p className="text-sm text-gray-600">Welcome back, Exhibitor</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">User</span>
                <span className="text-sm font-medium text-gray-900">Exhibitor Admin</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Package className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {exhibitorData?.companyName ? `${exhibitorData.companyName} - Product Catalog` : "Product Catalog"}
                    </h1>
                    <p className="text-gray-600">Manage your product showcase</p>
                  </div>
                </div>
                
                {/* <button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button> */}
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Products Grid */}
            <div className="bg-gray-50 rounded-xl p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading products...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product._id} className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 shadow-md bg-white rounded-2xl overflow-hidden">
                      <div className="p-8">
                        <div className="flex flex-col items-center text-center space-y-5">
                          {/* Logo above product name */}
                          <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden group-hover:scale-110 transition-transform duration-300">
                            {product.productLogo ? (
                              <img 
                                src={product.productLogo} 
                                alt={`${product.productName} logo`}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-10 h-10 text-gray-400" />
                            )}
                          </div>
                          
                          {/* Product name */}
                          <div className="space-y-3">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                              {product.productName}
                            </h3>
                            {product.productDescription && (
                              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                {product.productDescription}
                              </p>
                            )}
                          </div>
                          
                          {/* Product links */}
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            {product.productLink && (
                              <a
                                href={product.productLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
                              >
                                <Link className="w-3 h-3" />
                                View Product
                              </a>
                            )}
                            
                            {product.productImage && (
                              <a
                                href={product.productImage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-100 transition-colors"
                              >
                                <Image className="w-3 h-3" />
                                Image
                              </a>
                            )}
                            
                            {product.BrochureUrl && (
                              <a
                                href={product.BrochureUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-100 transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                Brochure
                              </a>
                            )}
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-3 pt-4 border-t border-gray-100 w-full justify-center">
                            <button
                              onClick={() => handleEdit(product)}
                              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="flex items-center gap-2 text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all duration-200 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {filteredProducts.length === 0 && !isLoading && (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Package className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No products found</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchTerm ? "Try adjusting your search terms to find the products you're looking for" : "Start building your product catalog by adding your first product"}
                  </p>
                  {/* {!searchTerm && (
                    <button 
                      onClick={() => setIsAddModalOpen(true)} 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 text-base rounded-lg flex items-center gap-2 mx-auto transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add Product
                    </button>
                  )} */}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
              <div onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="Enter product name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.productDescription}
                    onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Link</label>
                  <input
                    type="url"
                    value={formData.productLink}
                    onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
                    placeholder="https://example.com/product"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Logo URL</label>
                  <input
                    type="url"
                    value={formData.productLogo}
                    onChange={(e) => setFormData({ ...formData, productLogo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image URL</label>
                  <input
                    type="url"
                    value={formData.productImage}
                    onChange={(e) => setFormData({ ...formData, productImage: e.target.value })}
                    placeholder="https://example.com/image.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brochure URL</label>
                  <input
                    type="url"
                    value={formData.BrochureUrl}
                    onChange={(e) => setFormData({ ...formData, BrochureUrl: e.target.value })}
                    placeholder="https://example.com/brochure.pdf"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Edit Product</h2>
              <div onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="Enter product name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.productDescription}
                    onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                    placeholder="Enter product description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Link</label>
                  <input
                    type="url"
                    value={formData.productLink}
                    onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
                    placeholder="https://example.com/product"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Logo URL</label>
                  <input
                    type="url"
                    value={formData.productLogo}
                    onChange={(e) => setFormData({ ...formData, productLogo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image URL</label>
                  <input
                    type="url"
                    value={formData.productImage}
                    onChange={(e) => setFormData({ ...formData, productImage: e.target.value })}
                    placeholder="https://example.com/image.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brochure URL</label>
                  <input
                    type="url"
                    value={formData.BrochureUrl}
                    onChange={(e) => setFormData({ ...formData, BrochureUrl: e.target.value })}
                    placeholder="https://example.com/brochure.pdf"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  >
                    Update Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}