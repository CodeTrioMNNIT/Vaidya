import React from 'react'
import { MdArrowRightAlt } from "react-icons/md";

const Header = () => {
  return (
<div className="bg-gradient-to-r to-emerald-600 from-sky-400">
    <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white"> Book Appointment With Trusted Doctors</h1>
        <p className="mb-8 text-lg font-normal text-gray-900 lg:text-xl sm:px-16 xl:px-48 dark:text-white"><br/>Simply browse through our extensive list of trusted doctors, schedule your appointment hassle-free</p>
        <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <a href="#speciality" className="inline-flex justify-center items-center py-3 px-5 text-base font-bold text-center text-white rounded-lg bg-primary-900 hover:bg-primary-900 focus:ring-4 focus:ring-primary-900 dark:focus:ring-primary-900">
                Book appointment
                <MdArrowRightAlt size={16} />
            </a>  
        </div> 
    </div>
</div>
  )
}

export default Header
