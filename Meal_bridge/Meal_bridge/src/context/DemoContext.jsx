import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import Modal from '../components/ui/Modal.jsx'
import Toast from '../components/ui/Toast.jsx'

const DemoContext = createContext(null)

export function DemoProvider({ children }) {
  const [modal, setModal] = useState(null)
  const [notice, setNotice] = useState(null)

  const openDemo = useCallback((title, message) => setModal({ title, message }), [])
  const closeDemo = useCallback(() => setModal(null), [])
  const showToast = useCallback((message) => setNotice({ id: Date.now(), message }), [])
  const dismissToast = useCallback(() => setNotice(null), [])

  const value = useMemo(() => ({ openDemo, showToast }), [openDemo, showToast])

  return (
    <DemoContext.Provider value={value}>
      {children}
      <Modal open={Boolean(modal)} title={modal?.title} onClose={closeDemo}>
        {modal?.message}
      </Modal>
      <Toast notice={notice} onDismiss={dismissToast} />
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) {
    throw new Error('useDemo must be used inside DemoProvider')
  }
  return context
}
