import React from 'react';
import { Leaf, Github, Twitter, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="flex items-center">
              <Leaf className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-lg font-bold text-gray-900">CarbonledgerAI</span>
            </div>
            <span className="text-gray-500 ml-2 text-sm">© {new Date().getFullYear()} All rights reserved</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 transition-colors duration-200"
            >
              <img src="/bolt-icon.svg" alt="Bolt" className="w-4 h-4" />
              <span>Built with Bolt.new</span>
            </a>
            
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <Github className="w-5 h-5" />
            </a>
            
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">About</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Our Mission</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Team</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Careers</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Press</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Documentation</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">API Reference</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Guides</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Blog</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Terms of Service</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Cookie Policy</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">GDPR</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Contact Us</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Support</a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-gray-900">Partners</a>
                </li>
                <li>
                  <a 
                    href="https://bolt.new" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 flex items-center"
                  >
                    <span>Built with Bolt.new</span>
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}