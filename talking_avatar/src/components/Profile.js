import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaCalendarAlt, FaClock, FaPills, FaNotesMedical, FaHospital } from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('No user ID found');
        }

        const response = await axios.get(`${process.env.REACT_APP_API}/users/${userId}`);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchPrescriptions = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API}/ocr/prescriptions`);
        setPrescriptions(response.data);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchPrescriptions();
  }, []);

  // Group prescriptions by doctor name
  const groupedPrescriptions = prescriptions.reduce((acc, prescription) => {
    const doctorName = prescription.doctorInfo.name;
    if (!acc[doctorName]) {
      acc[doctorName] = [];
    }
    acc[doctorName].push(prescription);
    return acc;
  }, {});

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Not specified';
    return timeString;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00a884]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* User Profile Section */}
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center">
            <FaUser className="text-white text-3xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.name || 'User Name'}</h1>
            <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
      </div>

      {/* Prescription History Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Prescription History</h2>
        
        {Object.entries(groupedPrescriptions).map(([doctorName, doctorPrescriptions]) => (
          <div key={doctorName} className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <FaUser className="text-[#00a884] text-xl" />
              <h3 className="text-xl font-semibold text-gray-800">
                Dr. {doctorName}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctorPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  onClick={() => {
                    setSelectedPrescription(prescription);
                    setIsModalOpen(true);
                  }}
                  className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500 flex items-center">
                      <FaCalendarAlt className="mr-1" />
                      {formatDate(prescription.createdAt)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ID: {prescription.id}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Patient</p>
                      <p className="font-medium text-gray-900">{prescription.patientInfo.name}</p>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <FaPills className="mr-2" />
                      {prescription.patientInfo.treatmentDetails.length} Medications
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <FaHospital className="mr-2" />
                      {prescription.doctorInfo.hospitalDetails.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Prescription Modal */}
      {isModalOpen && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Prescription Details</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Doctor Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Doctor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedPrescription.doctorInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Qualifications</p>
                    <p className="font-medium">{selectedPrescription.doctorInfo.qualifications.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registration Number</p>
                    <p className="font-medium">{selectedPrescription.doctorInfo.registrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-medium">{selectedPrescription.doctorInfo.contactInfo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{selectedPrescription.doctorInfo.address}</p>
                  </div>
                </div>
              </div>

              {/* Hospital Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Hospital Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedPrescription.doctorInfo.hospitalDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{selectedPrescription.doctorInfo.hospitalDetails.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-medium">{selectedPrescription.doctorInfo.hospitalDetails.contactInfo}</p>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedPrescription.patientInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">{selectedPrescription.patientInfo.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium">{selectedPrescription.patientInfo.gender || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Treatment Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Treatment Details</h3>
                <div className="space-y-4">
                  {selectedPrescription.patientInfo.treatmentDetails.map((treatment, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Medication</p>
                          <p className="font-medium">{treatment.medication}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Dosage</p>
                          <p className="font-medium">{treatment.dosage}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Timing</p>
                          <p className="font-medium">{treatment.timing}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnosis */}
              {selectedPrescription.patientInfo.diagnosis && selectedPrescription.patientInfo.diagnosis.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Diagnosis</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPrescription.patientInfo.diagnosis.map((diagnosis, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {diagnosis}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p>Created: {formatDate(selectedPrescription.createdAt)}</p>
                </div>
                {selectedPrescription.updatedAt && (
                  <div>
                    <p>Last Updated: {formatDate(selectedPrescription.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 