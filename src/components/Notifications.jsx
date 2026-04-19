import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'

export default function Notifications() {
  const notifications = useStore(s => s.notifications)
  return (
    <div className="notif-container">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            className={`notif ${n.type}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
          >
            {n.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
