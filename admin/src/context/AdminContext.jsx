import { useState } from "react";
import { createContext } from "react";

export const AdminContext = createContext()

export const AdminContextProvider = (props) => {

    const [aToken , setAToken] = useState(localStorage.getItem('aToken')?localStorage.getItem('aToken'):'')
    const backendUrL = import.meta.env.VITE_BACKEND_URL
    const value = {
        aToken, setAToken,backendUrL
    }

    return(
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}
