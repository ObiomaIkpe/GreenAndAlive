import React, { useState } from 'react';
import { ShoppingCart, MapPin, Shield, Star, Filter } from 'lucide-react';
import { CarbonCredit } from '../types';

const mockCredits: CarbonCredit[] = [
  {
    id: '1',
    type: 'forest',
    price: 45.50,
    quantity: 1000,
    location: 'Amazon Rainforest, Brazil',
    verified: true,
    description: 'Protecting 500 hectares of primary rainforest',
    vintage: 2024,
    seller: 'EcoForest Initiative',
    certification: 'VCS'
  },
  {
    id: '2',
    type: 'renewable',
    price: 32.75,
    quantity: 2500,
    location: 'Wind Farm, Texas',
    verified: true,
    description: 'Clean energy from wind turbines',
    vintage: 2024,
    seller: 'GreenWind Energy',
    certification: 'Gold Standard'
  },
  {
    id: '3',
    type: 'efficiency',
    price: 28.90,
    quantity: 800,
    location: 'Industrial Complex, California',
    verified: true,
    description: 'Energy efficiency improvements in manufacturing',
    vintage: 2023,
    seller: 'EcoTech Solutions',
    certification: 'CAR'
  },
  {
    id: '4',
    type: 'capture',
    price: 85.25,
    quantity: 500,
    location: 'Direct Air Capture, Iceland',
    verified: true,
    description: 'Direct CO₂ capture and storage technology',
    vintage: 2024,
    seller: 'CarbonCapture Inc.',
    certification: 'VCS'
  }
];

const typeColors = {
  forest: 'bg-green-100 text-green-800',
  renewable: 'bg-blue-100 text-blue-800',
  efficiency: 'bg-purple-100 text-purple-800',
  capture: 'bg-indigo-100 text-indigo-800'
};

export default function Marketplace() {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('price');

  const filteredCredits = mockCredits.filter(credit => 
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Carbon Credit Marketplace</h2>
            <p className="text-gray-600">Discover and purchase verified carbon credits</p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="price">Sort by Price</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="vintage">Sort by Vintage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Credit Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedCredits.map((credit) => (
          <div key={credit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
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
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">${credit.price}</p>
                  <p className="text-sm text-gray-500">per credit</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{credit.description}</h3>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                <span>{credit.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Available:</span>
                  <span className="font-medium text-gray-900 ml-2">{credit.quantity.toLocaleString()} credits</span>
                </div>
                <div>
                  <span className="text-gray-500">Vintage:</span>
                  <span className="font-medium text-gray-900 ml-2">{credit.vintage}</span>
                </div>
                <div>
                  <span className="text-gray-500">Seller:</span>
                  <span className="font-medium text-gray-900 ml-2">{credit.seller}</span>
                </div>
                <div>
                  <span className="text-gray-500">Standard:</span>
                  <span className="font-medium text-gray-900 ml-2">{credit.certification}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <Star className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-600 ml-1">4.0 (124 reviews)</span>
                </div>
                
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Purchase</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Market Statistics */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">$42.15</p>
            <p className="text-sm text-gray-600">Average Price per Credit</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">15,847</p>
            <p className="text-sm text-gray-600">Credits Traded Today</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">+12.5%</p>
            <p className="text-sm text-gray-600">Market Growth This Month</p>
          </div>
        </div>
      </div>
    </div>
  );
}