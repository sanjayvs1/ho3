import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { FaUser, FaPhone, FaHospital, FaEdit, FaSave, FaIdCard, FaBirthdayCake, FaVenusMars, FaMapMarkerAlt, FaHeartbeat, FaAllergies, FaPills, FaCalendarAlt, FaClock, FaNotesMedical } from 'react-icons/fa';

const Profile = () => {
    const [profileData, setProfileData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editedData, setEditedData] = useState(null);
    const [saveStatus, setSaveStatus] = useState('');
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchProfileData();
        fetchPrescriptions();
    }, []);

    const fetchProfileData = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const docRef = doc(db, 'dependents', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setProfileData(docSnap.data());
                setEditedData(docSnap.data());
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setLoading(false);
        }
    };

    const fetchPrescriptions = async () => {
        try {
            const prescriptionsRef = collection(db, 'prescriptions');
            const q = query(prescriptionsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const prescriptionsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPrescriptions(prescriptionsData);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        }
    };

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

    const handleEdit = () => {
        setIsEditing(true);
        setSaveStatus('');
    };

    const handleSave = async () => {
        try {
            setSaveStatus('saving');
            const userId = localStorage.getItem('userId');
            const docRef = doc(db, 'dependents', userId);

            await updateDoc(docRef, {
                ...editedData,
                updatedAt: new Date().toISOString()
            });

            setProfileData(editedData);
            setIsEditing(false);
            setSaveStatus('saved');

            setTimeout(() => {
                setSaveStatus('');
            }, 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setSaveStatus('error');
        }
    };

    const handleChange = (e) => {
        setEditedData({
            ...editedData,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-2xl text-[#00a884]">Loading profile...</div>
            </div>
        );
    }

    const ProfileField = ({ icon: Icon, label, name, value, type = "text" }) => (
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 text-[#00a884] mb-2">
                <Icon className="text-lg sm:text-xl" />
                <label className="font-medium text-gray-700 text-sm sm:text-base">{label}</label>
            </div>
            {isEditing ? (
                <input
                    type={type}
                    name={name}
                    value={editedData[name]}
                    onChange={handleChange}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00a884] focus:border-transparent transition-all text-base sm:text-lg"
                />
            ) : (
                <p className="text-base sm:text-lg text-gray-900 pl-6 sm:pl-8 break-words">{value}</p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#00a884] rounded-full flex items-center justify-center">
                                <FaUser className="text-white text-2xl sm:text-3xl" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Profile Settings</h1>
                                <p className="text-sm sm:text-base text-gray-500">Manage your personal information</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-4">
                            {saveStatus === 'saved' && (
                                <span className="text-sm sm:text-base text-green-500 animate-fade-out">Saved!</span>
                            )}
                            {saveStatus === 'error' && (
                                <span className="text-sm sm:text-base text-red-500">Error saving</span>
                            )}
                            <button
                                onClick={isEditing ? handleSave : handleEdit}
                                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-white text-sm sm:text-base transition-all ${isEditing
                                    ? 'bg-[#00a884] hover:bg-[#008f6f]'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    } ${saveStatus === 'saving' ? 'opacity-50 cursor-wait' : ''}`}
                                disabled={saveStatus === 'saving'}
                            >
                                {isEditing ? (
                                    <>
                                        <FaSave className="text-lg sm:text-xl" />
                                        {saveStatus === 'saving' ? 'Saving...' : 'Save'}
                                    </>
                                ) : (
                                    <>
                                        <FaEdit className="text-lg sm:text-xl" />
                                        Edit
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                    {/* Basic Information */}
                    <div className="sm:col-span-2">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 px-1">
                            Basic Information
                        </h2>
                    </div>
                    <ProfileField
                        icon={FaIdCard}
                        label="First Name"
                        name="firstName"
                        value={profileData.firstName}
                    />
                    <ProfileField
                        icon={FaIdCard}
                        label="Last Name"
                        name="lastName"
                        value={profileData.lastName}
                    />
                    <ProfileField
                        icon={FaIdCard}
                        label="Nickname"
                        name="nickname"
                        value={profileData.nickname}
                    />
                    <ProfileField
                        icon={FaBirthdayCake}
                        label="Age"
                        name="age"
                        value={profileData.age}
                        type="number"
                    />

                    {/* Contact Information */}
                    <div className="sm:col-span-2 mt-4 sm:mt-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 px-1">
                            Contact Information
                        </h2>
                    </div>
                    <ProfileField
                        icon={FaPhone}
                        label="Guardian Phone"
                        name="guardianPhone"
                        value={profileData.guardianPhone}
                        type="tel"
                    />
                    <ProfileField
                        icon={FaPhone}
                        label="Emergency Number"
                        name="emergencyNumber"
                        value={profileData.emergencyNumber}
                        type="tel"
                    />
                    <ProfileField
                        icon={FaMapMarkerAlt}
                        label="Address"
                        name="address"
                        value={profileData.address}
                    />
                    <ProfileField
                        icon={FaHospital}
                        label="Nearest Hospital"
                        name="nearestHospitalNumber"
                        value={profileData.nearestHospitalNumber}
                        type="tel"
                    />

                    {/* Medical Information */}
                    <div className="sm:col-span-2 mt-4 sm:mt-6">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 px-1">
                            Medical Information
                        </h2>
                    </div>
                    <div className="sm:col-span-2">
                        <ProfileField
                            icon={FaHeartbeat}
                            label="Health Issues"
                            name="healthIssues"
                            value={profileData.healthIssues}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <ProfileField
                            icon={FaAllergies}
                            label="Allergies"
                            name="allergies"
                            value={profileData.allergies}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <ProfileField
                            icon={FaPills}
                            label="Medications"
                            name="medications"
                            value={profileData.medications}
                        />
                    </div>
                </div>

                {/* Prescription History Section */}
                <div className="mt-8">
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
