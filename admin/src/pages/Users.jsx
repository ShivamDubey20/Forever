import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "react-toastify"
import { backendUrl } from "../App"

const Users = ({ token }) => {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/user/all`, {
        headers: { token: token },
      })
      if (response.data.success) {
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to fetch users")
    }
  }

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/user/delete`,
          { userId },
          {
            headers: { token: token },
          },
        )
        if (response.data.success) {
          toast.success("User deleted successfully")
          fetchUsers()
        }
      } catch (error) {
        console.error("Error deleting user:", error)
        toast.error("Failed to delete user")
      }
    }
  }

  const handleBan = async (userId) => {
    if (window.confirm("Are you sure you want to ban this user?")) {
      try {
        const response = await axios.post(
          `${backendUrl}/api/user/ban`,
          { userId },
          {
            headers: { token: token },
          },
        )
        if (response.data.success) {
          toast.success("User banned successfully")
          fetchUsers()
        }
      } catch (error) {
        console.error("Error banning user:", error)
        toast.error("Failed to ban user")
      }
    }
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td className="py-2 px-4 border-b">{user.name}</td>
              <td className="py-2 px-4 border-b">{user.email}</td>
              <td className="py-2 px-4 border-b">
                <button onClick={() => handleDelete(user._id)} className="bg-red-500 text-white px-2 py-1 rounded mr-2">
                  Delete
                </button>
                <button onClick={() => handleBan(user._id)} className="bg-yellow-500 text-white px-2 py-1 rounded">
                  Ban
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Users

