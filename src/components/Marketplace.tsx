import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, Shield, Star, Filter, Heart, Trash2, Plus, Minus } from 'lucide-react';
import { marketplaceService, CarbonCreditAPI, PurchaseData } from '../services/marketplaceService';
import { notificationService } from '../services/notificationService';
import { authService } from '../services/authService';

interface CartItem {
  id: string;
  type: string;
  price: number;
  quantity: number;
  description: string;
  seller: string;
}

const typeColors = {
  forest: 'bg-green-100 text-green-800',
  renewable: 'bg-blue-100 text-blue-800',
  efficiency: 'bg-purple-100 text-purple-800',
  capture: 'bg-indigo-100 text-indigo-800'
};

export default function Marketplace() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('price');
  const [credits, setCredits] = useState<CarbonCreditAPI[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCredits();
  }, []);

  useEffect(() => {
    loadCredits();
  }, [selectedType, sortBy]);

  const loadCredits = async () => {
    setLoading(true);
    try {
      const filters = {
        type: selectedType === 'all' ? undefined : selectedType,
        sortBy: sortBy === 'price' ? 'price' : sortBy,
        sortOrder: 'ASC' as const,
        limit: 20
      };
      const data = await marketplaceService.getCredits(filters);
      setCredits(data);
    } catch (error) {
      console.error('Failed to load credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCredits = credits.filter(credit => 
    selectedType === 'all' || credit.type === selectedType
  );

  const sortedCredits = [...filteredCredits].sort((a, b) => {
    switch (sortBy) {
      case 'price': return a.price - b.price;
      case 'quantity': return b.quantity - a.quantity;
      case 'vintage': return b.vintage - a.vintage;
      default: return 0;
    }
  });

  const addToCart = (credit: CarbonCreditAPI, quantity: number = 1) => {
    if (!authService.isAuthenticated()) {
      notificationService.warning('Login Required', 'Please log in to add items to cart');
      return;
    }

    const cartItem: CartItem = {
      id: credit.id,
      type: credit.type,
      price: credit.price,
      quantity,
      description: credit.description,
      seller: credit.seller
    };

    const existingItem = cart.find(item => item.id === credit.id);
    if (existingItem) {
      setCart(prev => prev.map(item => 
        item.id === credit.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart(prev => [...prev, cartItem]);
    }

    notificationService.success(
      'Added to Cart',
      `${quantity} ${credit.description} credit${quantity > 1 ? 's' : ''} added to cart`
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));

    notificationService.info('Removed from Cart', 'Item removed from your cart');
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const toggleWishlist = (creditId: string) => {
    const isInWishlist = wishlist.includes(creditId);
    if (isInWishlist) {
      setWishlist(prev => prev.filter(id => id !== creditId));
    } else {
      setWishlist(prev => [...prev, creditId]);
    }

    const isAdded = !isInWishlist;
    notificationService.info(
      isAdded ? 'Added to Wishlist' : 'Removed from Wishlist',
      isAdded ? 'Credit added to your wishlist' : 'Credit removed from your wishlist'
    );
  };

  const checkout = async () => {
    if (!authService.isAuthenticated()) {
      notificationService.warning('Login Required', 'Please log in to complete your purchase');
      return;
    }

    if (cart.length === 0) {
      notificationService.warning('Empty Cart', 'Add some credits to your cart before checkout');
      return;
    }

    try {
      // Process each cart item as a separate purchase
      for (const item of cart) {
        const purchaseData: PurchaseData = {
          carbonCreditId: item.id,
          quantity: item.quantity,
          notes: `Purchased via marketplace cart`
        };
        await marketplaceService.purchaseCredit(purchaseData);
      }
      
      setCart([]);
      setShowCart(false);
      
      const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      notificationService.success(
        'Purchase Successful!',
        `Successfully purchased ${totalQuantity} carbon credits for $${totalPrice.toFixed(2)}`
      );
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Carbon Credit Marketplace</h2>
              <p className="text-gray-600">Discover and purchase verified carbon credits</p>
            </div>
            
            <button
              onClick={() => setShowCart(!showCart)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 relative"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Cart ({cartItemCount})</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="forest">Forest Protection</option>
              <option value="renewable">Renewable Energy</option>
              <option value="efficiency">Energy Efficiency</option>
              <option value="capture">Carbon Capture</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="price">Sort by Price</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="vintage">Sort by Vintage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shopping Cart */}
      {showCart && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
          </div>
          
          <div className="p-4 sm:p-6">
            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.description}</h4>
                      <p className="text-sm text-gray-600">{item.seller}</p>
                      <p className="text-sm font-medium text-emerald-600">${item.price} per credit</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-600 hover:text-gray-900"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-900">Total: ${cartTotal.toFixed(2)}</span>
                    <button
                      onClick={checkout}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Your cart is empty</p>
                <p className="text-sm text-gray-500 mt-1">Add some credits to get started</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credit Cards */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading carbon credits...</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {sortedCredits.map((credit) => (
          <div key={credit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[credit.type]}`}>
                    {credit.type.charAt(0).toUpperCase() + credit.type.slice(1)}
                  </span>
                  {credit.verified && (
                    <span className="flex items-center space-x-1 text-emerald-600">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </span>
                  )}
                  <button
                    onClick={() => toggleWishlist(credit.id)}
                    className={`p-1 rounded-full transition-colors duration-200 ${
                      wishlist.includes(credit.id)
                        ? 'text-red-600 hover:text-red-700'
                        : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(credit.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">${credit.price}</p>
                  <p className="text-sm text-gray-500">per credit</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{credit.description}</h3>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{credit.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Available:</span>
                  <span className="font-medium text-gray-900 ml-2 block sm:inline">{credit.quantity.toLocaleString()} credits</span>
                </div>
                <div>
                  <span className="text-gray-500">Vintage:</span>
                  <span className="font-medium text-gray-900 ml-2 block sm:inline">{credit.vintage}</span>
                </div>
                <div>
                  <span className="text-gray-500">Seller:</span>
                  <span className="font-medium text-gray-900 ml-2 block sm:inline truncate">{credit.seller}</span>
                </div>
                <div>
                  <span className="text-gray-500">Standard:</span>
                  <span className="font-medium text-gray-900 ml-2 block sm:inline">{credit.certification}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-600 ml-1">{credit.rating?.toFixed(1) || '4.0'} ({credit.reviewCount || 124} reviews)</span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => addToCart(credit, 1)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Market Statistics */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">$42.15</p>
            <p className="text-sm text-gray-600">Average Price per Credit</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">15,847</p>
            <p className="text-sm text-gray-600">Credits Traded Today</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">+12.5%</p>
            <p className="text-sm text-gray-600">Market Growth This Month</p>
          </div>
        </div>
      </div>
    </div>
  );
}