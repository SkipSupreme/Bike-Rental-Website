import { useState, useEffect } from 'react'
import { Search, User, Mail, Phone, FileText, DollarSign, X, Eye } from 'lucide-react'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerDetails, setCustomerDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [search])

  const fetchCustomers = async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/customers${params}`, { credentials: 'include' })
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (err) {
      console.error('Failed to load customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const viewCustomer = async (customerId) => {
    setSelectedCustomer(customerId)
    setLoadingDetails(true)

    try {
      const res = await fetch(`/api/customers/${customerId}`, { credentials: 'include' })
      const data = await res.json()
      setCustomerDetails(data)
    } catch (err) {
      console.error('Failed to load customer details:', err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const viewSignature = async (customerId) => {
    try {
      const res = await fetch(`/api/waiver/signature/${customerId}`, { credentials: 'include' })
      const data = await res.json()

      if (data.signature) {
        // Open signature in new window
        const win = window.open('', '_blank')
        win.document.write(`
          <html>
            <head><title>Waiver Signature - ${data.name}</title></head>
            <body style="margin:20px;font-family:sans-serif;">
              <h2>Waiver Signature</h2>
              <p><strong>Name:</strong> ${data.name}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Signed:</strong> ${new Date(data.signedAt).toLocaleString()}</p>
              <hr/>
              <img src="${data.signature}" style="max-width:500px;border:1px solid #ccc;"/>
            </body>
          </html>
        `)
      }
    } catch (err) {
      console.error('Failed to load signature:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-heading text-3xl mb-6">Customers</h1>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="input pl-10"
        />
      </div>

      {/* Customers List */}
      {customers.length === 0 ? (
        <div className="card text-center py-12">
          <User className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">
            {search ? 'No customers found' : 'No customers yet'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bike-dark/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Customer</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Contact</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-400">Waiver</th>
                  <th className="text-center p-4 text-sm font-medium text-gray-400">Rentals</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Total Spent</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bike-gray/30">
                {customers.map(customer => (
                  <tr key={customer.id} className="hover:bg-bike-dark/30">
                    <td className="p-4">
                      <p className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                        <Mail size={14} />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Phone size={14} />
                          {customer.phone}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {customer.waiver_signed ? (
                        <button
                          onClick={() => viewSignature(customer.id)}
                          className="inline-flex items-center gap-1 text-green-400 text-sm hover:text-green-300"
                        >
                          <FileText size={14} />
                          View
                        </button>
                      ) : (
                        <span className="text-yellow-400 text-sm">Not signed</span>
                      )}
                    </td>
                    <td className="p-4 text-center">{customer.rental_count || 0}</td>
                    <td className="p-4 text-right text-bike-orange">
                      ${(customer.total_spent || 0).toFixed(0)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => viewCustomer(customer.id)}
                        className="p-2 text-gray-400 hover:text-white"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-4">
        Total: {customers.length} customers
      </p>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-xl">Customer Details</h2>
              <button onClick={() => { setSelectedCustomer(null); setCustomerDetails(null); }}>
                <X size={24} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex items-center justify-center h-32">
                <div className="spinner"></div>
              </div>
            ) : customerDetails && (
              <>
                {/* Customer Info */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">
                      {customerDetails.customer.first_name} {customerDetails.customer.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{customerDetails.customer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{customerDetails.customer.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="font-medium">
                      {new Date(customerDetails.customer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-bike-dark/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-semibold text-bike-orange">
                      {customerDetails.stats.totalRentals}
                    </p>
                    <p className="text-sm text-gray-400">Total Rentals</p>
                  </div>
                  <div className="bg-bike-dark/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-semibold text-green-400">
                      ${customerDetails.stats.totalSpent?.toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-400">Total Spent</p>
                  </div>
                  <div className="bg-bike-dark/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-semibold text-yellow-400">
                      ${customerDetails.stats.outstandingBalance?.toFixed(0)}
                    </p>
                    <p className="text-sm text-gray-400">Outstanding</p>
                  </div>
                </div>

                {/* Rental History */}
                <h3 className="font-semibold mb-3">Rental History</h3>
                {customerDetails.rentals.length === 0 ? (
                  <p className="text-gray-500 text-sm">No rentals yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customerDetails.rentals.map(rental => (
                      <div
                        key={rental.id}
                        className="flex items-center justify-between p-3 bg-bike-dark/30 rounded-lg text-sm"
                      >
                        <div>
                          <p className="font-medium">{rental.bike_name}</p>
                          <p className="text-gray-500">
                            {new Date(rental.start_time).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-bike-orange">${rental.total_amount?.toFixed(2)}</p>
                          <p className={`text-xs ${
                            rental.status === 'completed' ? 'text-gray-400' :
                            rental.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {rental.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
