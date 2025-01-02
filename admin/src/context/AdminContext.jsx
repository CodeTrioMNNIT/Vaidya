import { useState } from "react";
import { createContext } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'

export const AdminContext = createContext()

export const AdminContextProvider = (props) => {

    const [aToken , setAToken] = useState(localStorage.getItem('aToken')?localStorage.getItem('aToken'):'')
    const backendUrL = import.meta.env.VITE_BACKEND_URL

    const [doctors, setDoctors] = useState([])

    const getAllDoctors = async () => {
        try {
            const {data} = await axios.post(
                backendUrL + '/api/admin/all-doctors', 
                {}, 
                { 
                    headers: { 
                        Authorization: `${aToken}` 
                    }
                }
            );
            if(data.success) {
                setDoctors(data.doctors)
                console.log(data.doctors)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const changeAvailability = async (docId) => {
        try {
            const { data } = await axios.post(backendUrL + '/api/admin/change-availability', {docId}, 
                { 
                    headers: { 
                        Authorization: `${aToken}` 
                    }
                })
            if(data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    const value = {
        aToken, setAToken, backendUrL, doctors, getAllDoctors, changeAvailability
    }

    return(
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}
