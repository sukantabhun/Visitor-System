import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { RoleContext } from "../../context/RoleContext"; // Adjust the path as necessary
import Cookies from "js-cookie";

const Header = () => {
  const navigate = useNavigate();
  const { role } = useContext(RoleContext); // Access the role from context using useContext

  const handleCreateUser = () => {
    navigate("/create-user");
  };

  const handleCreatePass = () => {
    navigate("/create-pass");
  };

  const handleLogout = () => {
    Cookies.remove("jwt-token");
    navigate("/login");
  };

  const handleAdmin = () => {
    navigate('/admin')
  }

  return (
    <div className="flex flex-row justify-between w-full p-5 h-20 shadow-[rgba(0,0,15,0.5)_0px_5px_4px_0px]">
      
      <div className="flex flex-row">
      <img src='https://www.ndmc.gov.in/imgs/932-9329692_ndmc-logo-graphics.png' className="w-12 h-12 mr-2" alt="NDMC"/>
        <h1 className="font-bold text-[30px]">Reception Management System</h1>
      </div>
      <div>
        {role === "admin" && ( // Show button only if role is admin
          <>
            <button
              onClick={handleAdmin}
              className="text-white bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-yellow-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 outline-none cursor-pointer active:border-none"
            >
              Admin Controlls
            </button>
            <button
              onClick={handleCreateUser}
              className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 outline-none cursor-pointer active:border-none"
            >
              Create User
            </button>
          </>
        )}
        <button
          type="button"
          className="text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 outline-none cursor-pointer active:border-none"
          onClick={handleCreatePass}
        >
          Create Pass
        </button>
        <button
          type="button"
          className="text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 outline-none cursor-pointer active:border-none"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Header;
