import React, { useEffect } from 'react'
import Header from '../Header'
import { useNavigate } from 'react-router-dom'
import Cookies from 'js-cookie'

const Home = () => {
  const navigate = useNavigate()
  const jwtToken = Cookies.get('jwt_token')

  useEffect(() => {
    if (!jwtToken) {
      navigate('/login')
    }
  }, [jwtToken, navigate]) 

  return (
    <div className="w-full h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center bg-gray-100">
        <h1 className="text-4xl font-bold text-gray-700">Welcome to Home!</h1>
      </div>
    </div>
  )
}

export default Home
