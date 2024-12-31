import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { MdDashboard } from "react-icons/md"
import { FaUserDoctor } from "react-icons/fa6"
import { FaUsers } from "react-icons/fa6"
import { FaCalendarAlt } from "react-icons/fa"
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
    const {aToken} = useContext(AdminContext)

  return (
    <div className='min-h-screen bg-white border-r'>
        {
            aToken && <ul className='text-[#515151] mt-5'>
                <NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/admin-dashboard'}>
                    <MdDashboard />
                    <p>Dashboard</p>
                </NavLink>
        
                <NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/all-appointments'}>
                    <FaCalendarAlt />
                    <p>Appointments</p>
                </NavLink>

                <NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/add-doctor'}>
                    <FaUserDoctor />
                    <p>Add Doctor</p>
                </NavLink>

                <NavLink className={({isActive})=> `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''}`} to={'/doctor-list'}>
                    <FaUsers />
                    <p>Doctor's List</p>
                </NavLink>
            </ul>
        }
    </div>
  )
}

export default Sidebar