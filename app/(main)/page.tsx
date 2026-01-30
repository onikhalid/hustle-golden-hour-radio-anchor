"use client";

import React from "react";
import { LayoutDashboard, TrendingUp, Users, Award } from "lucide-react";

const statsCards = [
  {
    title: "Total Winners",
    value: "1,234",
    change: "+12.5%",
    icon: Award,
    gradient: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-400",
  },
  {
    title: "Active Agents",
    value: "856",
    change: "+8.2%",
    icon: Users,
    gradient: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    title: "Growth Rate",
    value: "23.5%",
    change: "+4.3%",
    icon: TrendingUp,
    gradient: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
    iconColor: "text-green-400",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
          <LayoutDashboard className="h-6 w-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-sm text-white/60">Welcome back to your admin panel</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`group relative overflow-hidden rounded-3xl border ${stat.borderColor} bg-white/[0.06] p-6 backdrop-blur-xl transition hover:bg-white/[0.1]`}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition group-hover:opacity-100`} />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.gradient} border ${stat.borderColor}`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <span className="text-sm font-medium text-green-400">{stat.change}</span>
                </div>
                <div>
                  <p className="text-sm text-white/60">{stat.title}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="/weekly-winners"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-500/30 hover:bg-white/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Award className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Add Weekly Winner</h3>
              <p className="text-sm text-white/60">Register new scratch card winner</p>
            </div>
          </a>

          <a
            href="/agent-records"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-blue-500/30 hover:bg-white/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">Create Agent</h3>
              <p className="text-sm text-white/60">Add new agent to the system</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}