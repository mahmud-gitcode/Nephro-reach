"use client";

import React from "react";
import { MessageSquare, BookOpen, Calendar, TrendingUp, Users, Shield } from "lucide-react";

export default function WhatMembersGet() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-blue-600 text-sm font-bold tracking-widest uppercase">What You Get</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">What Members Get</h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto font-medium">
            everything you need to grow
          </p>
        </div>

        {/* 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Daily SMS Prompts</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Carefully crafted questions sent to your phone to spark reflection and mindfulness throughout your day.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Digital Journal</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              A beautiful, private space where all your SMS replies are automatically saved and organized by date.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Monthly Classes</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Live, expert-led sessions focusing on personal growth, habit building, and intentional living.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Progress Tracking</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Look back at your entries over time to see patterns, growth, and shifts in your perspective.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Community Access</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Connect with other members in our moderated forum to share insights and discuss class topics.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Private & Secure</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Your reflections are yours alone. We use industry-standard encryption to keep your journal safe.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
