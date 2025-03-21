import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { FaUser, FaPhone, FaHospital, FaEdit, FaSave, FaIdCard, FaBirthdayCake, FaVenusMars, FaMapMarkerAlt, FaHeartbeat, FaAllergies, FaPills } from 'react-icons/fa';

const Profile = () => {
    const [profileData, setProfileData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editedData, setEditedData] = useState(null);
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        fetchProfileData();
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
            </div>
        </div>
    );
};

export default Profile;
