import React from 'react'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  return (
    <motion.div className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-subtitle">Coming soon</div>
      </div>
    </motion.div>
  )
}
