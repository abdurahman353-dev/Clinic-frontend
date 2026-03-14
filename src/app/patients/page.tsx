import { Search, Plus, MoreHorizontal, Filter } from "lucide-react";
import Link from "next/link";

export default function PatientsList() {
  const patients = [
    { id: "P-10024", name: "Sarah Johnson", age: 34, gender: "Female", phone: "+1 (555) 123-4567", lastVisit: "2023-10-24", status: "Active" },
    { id: "P-10025", name: "Michael Brown", age: 45, gender: "Male", phone: "+1 (555) 987-6543", lastVisit: "2023-10-22", status: "Active" },
    { id: "P-10026", name: "Emily Davis", age: 28, gender: "Female", phone: "+1 (555) 456-7890", lastVisit: "2023-09-15", status: "Inactive" },
    { id: "P-10027", name: "James Wilson", age: 62, gender: "Male", phone: "+1 (555) 234-5678", lastVisit: "2023-10-25", status: "Active" },
    { id: "P-10028", name: "Olivia Martinez", age: 19, gender: "Female", phone: "+1 (555) 876-5432", lastVisit: "2023-08-10", status: "Inactive" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h1>
          <p className="text-slate-500 mt-1">Manage patient records and histories</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 py-2 shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, ID, or phone..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
            />
          </div>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 h-9 px-3 shadow-sm">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Visit</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-4">
                        <Link href={`/patients/${patient.id}`} className="text-sm font-medium text-slate-900 hover:text-primary-600">
                          {patient.name}
                        </Link>
                        <div className="text-sm text-slate-500">{patient.id} &bull; {patient.age} yrs, {patient.gender}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{patient.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {patient.lastVisit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-slate-400 hover:text-slate-600 focus:outline-none">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
          <div className="hidden sm:block text-sm text-slate-700">
            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">124</span> results
          </div>
          <div className="flex-1 flex justify-between sm:justify-end gap-2">
            <button className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
              Previous
            </button>
            <button className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
