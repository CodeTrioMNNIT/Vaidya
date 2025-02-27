import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { IoIosArrowDropdown } from "react-icons/io";
import { RxAvatar } from "react-icons/rx";
import { CiMenuBurger } from "react-icons/ci";
import { RxCross1 } from "react-icons/rx";
import { useContext } from 'react';
import { AppContext } from '../context/AppContext.jsx';

const Navbar = () => {
    const navigate = useNavigate();
    const [showMenu , setShowMenu] = useState(false);
    const {token , setToken , userData} = useContext(AppContext)

    const logout = () => {
        setToken(false)
        localStorage.removeItem('token')
        navigate('/')
    }
  

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>
        <h1 className="cursor-pointer w-44 mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">Vaidya</span></h1>
        <ul className='hidden md:flex items-start gap-5 font-medium'>
            <NavLink to='/'>
                <li className='py-1'>HOME</li>
                <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden'/>
            </NavLink>
            <NavLink to='/doctors'>
                <li className='py-1'>ALL DOCTORS</li>
                <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden'/>
            </NavLink>
        </ul>
        <div className='flex items-center gap-4'>
            {
                token && userData ? <div className='flex items-center gap-2 cursor-pointer group relative'>
                    {
                        userData.image !== '' ? <img className='w-8 rounded-full'  src={userData.image} alt="" /> 
                        : <RxAvatar size={35}/>
                    }
                    
                    <IoIosArrowDropdown size={16}/>
                    <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                        <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                            <p onClick={()=>navigate("my-profile")} className='hover:text-black cursor-pointer'>My Profile</p>
                            <p onClick={()=>navigate("my-appointments")} className='hover:text-black cursor-pointer'>My Appointments</p>
                            <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
                        </div>
                    </div>
                </div> 
                : <button onClick={() => navigate('/login')} className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>Create account</button>
            }
            <CiMenuBurger onClick={() => setShowMenu(true)} className='md:hidden' size={25}/>
            <div className={`${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
                <div className='flex items-center justify-between px-5 py-6'>
                <h1 className="cursor-pointer w-44 mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl"><span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-600 from-sky-400">Vaidya</span></h1>
                    <RxCross1 size={25} onClick={() => setShowMenu(false)} />
                </div>
                <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
                    <NavLink onClick={() => setShowMenu(false)} to='/'><p className='px-4 py-2 rounded inline-block'>HOME</p></NavLink>
                    <NavLink onClick={() => setShowMenu(false)} to='/doctors'><p className='px-4 py-2 rounded inline-block'>ALL DOCTORS</p></NavLink>
                </ul>
            </div>
        </div>
    </div>
  )
}

export default Navbar