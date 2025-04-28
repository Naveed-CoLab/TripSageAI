import { Globe, Facebook, Twitter, Instagram, Youtube, MapPin, Mail, Phone, ChevronDown, CreditCard, Shield } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { SiVisa, SiMastercard, SiPaypal, SiAmericanexpress, SiGoogleearth } from "react-icons/si";
import { FaFacebookF, FaTwitter, FaYoutube } from "react-icons/fa";

export default function Footer() {
  const [email, setEmail] = useState("");
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white text-slate-700 border-t border-gray-200">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/support" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  Customer Support
                </Link>
              </li>
              <li>
                <Link href="/guarantee" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  Service Guarantee
                </Link>
              </li>
              <li>
                <Link href="/service-info" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  More Service Info
                </Link>
              </li>
            </ul>
            
            <div className="mt-6 flex space-x-4">
              <a href="#" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <FaFacebookF className="h-4 w-4 text-slate-600" />
              </a>
              <a href="#" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <FaTwitter className="h-4 w-4 text-slate-600" />
              </a>
              <a href="#" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <FaYoutube className="h-4 w-4 text-slate-600" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">About</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  About TripSage.com
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  News
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  Privacy and Cookies
                </Link>
              </li>
              <li>
                <Link href="/about-group" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  About TripSage Group
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Other Services</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/investor-relations" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  Investor Relations
                </Link>
              </li>
              <li>
                <Link href="/rewards" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  TripSage Rewards
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  Affiliate Program
                </Link>
              </li>
              <li>
                <Link href="/property" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link href="/hotels" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  All Hotels
                </Link>
              </li>
              <li>
                <Link href="/supplier" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  Become a Supplier
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-sm text-slate-600 hover:text-blue-600 transition-colors duration-200">
                  Security
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Payment Methods</h3>
              <div className="flex flex-wrap gap-3 mb-6">
                <SiVisa className="w-8 h-8 text-blue-700" />
                <SiMastercard className="w-8 h-8 text-orange-500" />
                <SiAmericanexpress className="w-8 h-8 text-blue-500" />
                <SiPaypal className="w-8 h-8 text-blue-800" />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Our Partners</h3>
              <div className="flex flex-wrap gap-4">
                <SiGoogleearth className="w-10 h-10" style={{ color: '#4285F4' }} />
                <div className="flex items-center">
                  <span className="text-blue-500 font-bold text-lg">Trip</span>
                  <span className="text-green-500 font-bold text-lg">advisor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/9/9e/Placeholder_Image_Award-Vector_%28Transparent%29.svg" 
                alt="Good Design Award 2024" 
                className="h-12"
              />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
                    CC
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Contact Center</span>
                    <span className="text-xs text-gray-500">of the year 2024</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-slate-500">
            Copyright © {currentYear} TripSage Travel Pte. Ltd. All rights reserved
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Site Operator: TripSage Travel Pte. Ltd.
          </p>
        </div>
      </div>
    </footer>
  );
}
