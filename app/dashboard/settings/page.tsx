"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard/layout"
import { Card } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Building2, Bell, Lock, CreditCard, Zap, Save, Upload } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    businessName: "Juan's Cafe",
    email: "juan@cafe.com",
    phone: "+63 912 345 6789",
    address: "Manila, Philippines",
    website: "juanscafe.com",
    timezone: "UTC+8 (Asia/Manila)",
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <DashboardLayout>
      <motion.div className="space-y-8" initial="hidden" animate="visible" variants={containerVariants}>
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your business profile and preferences</p>
          </div>
        </motion.div>

        {/* Business Profile */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Business Profile</h2>
            </div>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium mb-3">Business Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">JC</span>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition">
                    <Upload className="w-4 h-4" />
                    Change Logo
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-background"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Business Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-background"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition bg-background"
                  >
                    <option>UTC+8 (Asia/Manila)</option>
                    <option>UTC+7 (Asia/Bangkok)</option>
                    <option>UTC+9 (Asia/Tokyo)</option>
                  </select>
                </div>
              </div>

              <button className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
                <Save className="w-4 h-4" />
                Save Profile
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-secondary" />
              <h2 className="text-xl font-bold">Notification Preferences</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  id: "email-sales",
                  label: "Email for new sales",
                  desc: "Get notified when a customer completes a transaction",
                },
                {
                  id: "email-rewards",
                  label: "Email for reward redemptions",
                  desc: "Alerts when customers redeem rewards",
                },
                {
                  id: "sms-alerts",
                  label: "SMS alerts for high activity",
                  desc: "Receive SMS when there's unusual activity",
                },
                {
                  id: "weekly-digest",
                  label: "Weekly performance digest",
                  desc: "Get a summary of weekly metrics every Monday",
                },
                { id: "low-stock", label: "Low stock alerts", desc: "Notify when reward inventory is running low" },
              ].map((notification) => (
                <div key={notification.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{notification.label}</p>
                    <p className="text-sm text-muted-foreground">{notification.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5 rounded cursor-pointer accent-primary mt-1"
                  />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Payment & Billing */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-5 h-5 text-warning" />
              <h2 className="text-xl font-bold">Payment & Billing</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">Current Plan: Growth</p>
                    <p className="text-sm text-muted-foreground">Unlimited customers, advanced features</p>
                    <p className="text-sm font-semibold mt-2">₱4,999/month</p>
                  </div>
                  <button className="px-4 py-1 text-sm border border-border rounded hover:bg-background transition">
                    Change Plan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                  <p className="font-medium">Visa ending in 4242</p>
                  <button className="text-sm text-primary hover:underline mt-2">Update Payment</button>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Next Billing Date</p>
                  <p className="font-medium">January 15, 2026</p>
                  <button className="text-sm text-primary hover:underline mt-2">View Invoice</button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Integrations */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-5 h-5 text-secondary" />
              <h2 className="text-xl font-bold">Integrations</h2>
            </div>

            <div className="space-y-3">
              {[
                { name: "Slack", status: "connected", desc: "Send notifications to Slack" },
                { name: "Google Analytics", status: "connected", desc: "Track analytics" },
                { name: "Facebook Pixel", status: "disconnected", desc: "Run ads and track conversions" },
                { name: "Mailchimp", status: "disconnected", desc: "Email marketing automation" },
              ].map((integration, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-muted-foreground">{integration.desc}</p>
                  </div>
                  <button
                    className={`px-4 py-1 text-sm rounded transition ${
                      integration.status === "connected"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "border border-border hover:bg-background"
                    }`}
                  >
                    {integration.status === "connected" ? "Connected" : "Connect"}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-error" />
              <h2 className="text-xl font-bold">Security</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your password regularly</p>
                </div>
                <button className="px-4 py-2 border border-border rounded-lg hover:bg-background transition">
                  Change
                </button>
              </div>

              <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <button className="px-4 py-2 border border-border rounded-lg hover:bg-background transition">
                  Enable
                </button>
              </div>

              <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">Active Sessions</p>
                  <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
                </div>
                <button className="px-4 py-2 border border-border rounded-lg hover:bg-background transition">
                  View
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 border-error/50 bg-error/5">
            <h2 className="text-xl font-bold text-error mb-4">Danger Zone</h2>
            <div className="flex items-center justify-between p-4 bg-error/10 rounded-lg border border-error/20">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <button className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition">Delete</button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}
