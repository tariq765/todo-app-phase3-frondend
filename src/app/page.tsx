'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-20 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-10 left-20 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 right-40 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
        <div className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
              <span className="block">Organize Your Life with</span>
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Smart Todo App
              </span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-xl text-gray-600">
              Transform the way you manage tasks. Our intelligent assistant helps you stay organized and productive.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300"
              >
                Get Started Free
              </Link>
              
              <Link
                href="/login"
                className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-xl shadow-lg hover:shadow-xl border border-gray-200 transform hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative rounded-2xl shadow-xl overflow-hidden border border-gray-200 bg-white/80 backdrop-blur-sm">
              <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))]"></div>
              <div className="relative p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Tasks</h3>
                    <p className="text-gray-600">AI-powered task management that learns your habits and suggests priorities.</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Time Tracking</h3>
                    <p className="text-gray-600">Monitor how much time you spend on each task to boost productivity.</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl border border-green-100">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Secure & Private</h3>
                    <p className="text-gray-600">Your data is encrypted and stored securely with industry-leading protection.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Personal AI Assistant</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our intelligent chatbot understands natural language commands. Simply tell it "add a task to buy groceries" 
                or "show me my urgent tasks" and watch it work seamlessly.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-600">Natural language processing for intuitive task creation</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-600">Smart notifications to keep you on track</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-600">Cross-device synchronization</p>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl flex items-center justify-center">
                  <div className="bg-white rounded-xl w-64 h-64 p-4 flex flex-col">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-lg p-3 overflow-y-auto">
                      <div className="text-xs text-gray-500 mb-2">You:</div>
                      <div className="bg-blue-100 rounded-lg p-2 mb-3 text-sm">Add a task to buy groceries</div>
                      
                      <div className="text-xs text-gray-500 mb-2">Assistant:</div>
                      <div className="bg-green-100 rounded-lg p-2 text-sm">Sure! I've added "buy groceries" to your task list. Would you like to set a priority or due date?</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}