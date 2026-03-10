'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ComprarPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#071521',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <span style={{
        color: '#F2B233',
        fontSize: '16px',
        fontFamily: 'Poppins, sans-serif'
      }}>
        Redirigiendo...
      </span>
    </div>
  )
}
