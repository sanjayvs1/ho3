import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Register from './pages/Register'
function Router() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/'  element={<App/>}/>
            <Route path='/login'  element={<Login/>}/>
            <Route path='/register'  element={<Register/>}/>
        </Routes>
    </BrowserRouter>
  )
}

export default Router