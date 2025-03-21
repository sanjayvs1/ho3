import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';

const GuardianOnboarding = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uid, setUid] = useState('');

    // Form data state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nickname: '',
        age: '',
        gender: '',
        address: '',
        guardianPhone: '',
        childPhone: '',
        nearestHospitalNumber: '',
        emergencyNumber: '',
        healthIssues: '',
        allergies: '',
        medications: '',
        hobbies: [],
        hobbyInput: '',
    });

    // Validation state
    const [validation, setValidation] = useState({
        firstName: { valid: true, message: '' },
        lastName: { valid: true, message: '' },
        age: { valid: true, message: '' },
        guardianPhone: { valid: true, message: '' },
        emergencyNumber: { valid: true, message: '' },
    });

    // Fetch UID from localStorage on mount
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.uid) {
            setError('User not authenticated. Please log in again.');
            navigate('/login'); // Redirect to login if no UID
        } else {
            setUid(userData.uid);
        }
    }, [navigate]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear validation errors when user types
        if (validation[name]) {
            setValidation((prev) => ({
                ...prev,
                [name]: { valid: true, message: '' },
            }));
        }
    };

    // Add hobby to the list
    const addHobby = () => {
        if (formData.hobbyInput.trim() !== '') {
            setFormData((prev) => ({
                ...prev,
                hobbies: [...prev.hobbies, prev.hobbyInput.trim()],
                hobbyInput: '',
            }));
        }
    };

    // Remove hobby from the list
    const removeHobby = (index) => {
        setFormData((prev) => ({
            ...prev,
            hobbies: prev.hobbies.filter((_, i) => i !== index),
        }));
    };

    // Handle hobby input keypress (add on Enter)
    const handleHobbyKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addHobby();
        }
    };

    // Validate phone number format
    const validatePhone = (phone) => {
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        return phoneRegex.test(phone);
    };

    // Unified validation function
    const validateForm = () => {
        let isValid = true;
        const newValidation = { ...validation };

        // Step 1 required fields
        if (!formData.firstName.trim()) {
            newValidation.firstName = { valid: false, message: 'First name is required' };
            isValid = false;
        }
        if (!formData.lastName.trim()) {
            newValidation.lastName = { valid: false, message: 'Last name is required' };
            isValid = false;
        }
        if (!formData.age || isNaN(formData.age) || parseInt(formData.age) <= 0) {
            newValidation.age = { valid: false, message: 'Please enter a valid age' };
            isValid = false;
        }

        // Step 2 required fields
        if (!validatePhone(formData.guardianPhone)) {
            newValidation.guardianPhone = { valid: false, message: 'Please enter a valid phone number' };
            isValid = false;
        }
        if (!validatePhone(formData.emergencyNumber)) {
            newValidation.emergencyNumber = { valid: false, message: 'Please enter a valid emergency number' };
            isValid = false;
        }

        setValidation(newValidation);
        return isValid;
    };

    // Validate current step before moving to next
    const validateStep = () => {
        let isValid = true;
        const newValidation = { ...validation };

        if (step === 1) {
            if (!formData.firstName.trim()) {
                newValidation.firstName = { valid: false, message: 'First name is required' };
                isValid = false;
            }
            if (!formData.lastName.trim()) {
                newValidation.lastName = { valid: false, message: 'Last name is required' };
                isValid = false;
            }
            if (!formData.age || isNaN(formData.age) || parseInt(formData.age) <= 0) {
                newValidation.age = { valid: false, message: 'Please enter a valid age' };
                isValid = false;
            }
        } else if (step === 2) {
            if (!validatePhone(formData.guardianPhone)) {
                newValidation.guardianPhone = { valid: false, message: 'Please enter a valid phone number' };
                isValid = false;
            }
            if (!validatePhone(formData.emergencyNumber)) {
                newValidation.emergencyNumber = { valid: false, message: 'Please enter a valid emergency number' };
                isValid = false;
            }
        }

        setValidation(newValidation);
        return isValid;
    };
    useEffect(() => { console.log(step) }, [step])

    // Handle form submission (only on final step)
    let isfirsttime = true
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isfirsttime) {
            isfirsttime = false
            return
        }
        // if (step <= 3) return; // Only submit on step 3
        console.log("in")
        if (!validateForm()) {
            setError('Please complete all required fields.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (!userData.uid) throw new Error('User ID not found. Please log in again.');

            const dataToSave = { ...formData };
            delete dataToSave.hobbyInput;

            const completeData = {
                ...dataToSave,
                uid: userData.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'dependents', userData.uid), completeData);

            userData.onboardingComplete = true;
            localStorage.setItem('user', JSON.stringify(userData));
            console.log(123123)
            navigate('/');
        } catch (err) {
            console.error('Error saving data:', err);
            setError(err.message || 'There was a problem saving the information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle navigation
    const handleNext = () => {
        if (validateStep()) {
            setStep((prev) => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const handlePrevious = () => {
        setStep((prev) => prev - 1);
        window.scrollTo(0, 0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-400 py-6 px-6 text-white">
                        <h1 className="text-2xl md:text-3xl font-bold text-center">Dependent Registration</h1>
                        <p className="text-center mt-2 text-white/80">Please provide information about your dependent</p>
                        <div className="flex justify-between mt-6">
                            <div className={`w-1/3 h-2 rounded-full mx-1 ${step >= 1 ? 'bg-white' : 'bg-white/40'}`} />
                            <div className={`w-1/3 h-2 rounded-full mx-1 ${step >= 2 ? 'bg-white' : 'bg-white/40'}`} />
                            <div className={`w-1/3 h-2 rounded-full mx-1 ${step >= 3 ? 'bg-white' : 'bg-white/40'}`} />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 p-4 m-6 rounded-lg border-l-4 border-red-400">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6">
                        {step === 1 && (
                            <div className="space-y-5">
                                <h2 className="text-xl font-semibold text-purple-700 mb-4">Personal Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-gray-700 font-medium mb-1">
                                            First Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 rounded-xl border ${!validation.firstName.valid ? 'border-red-500' : 'border-purple-200'
                                                } focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50`}
                                            required
                                        />
                                        {!validation.firstName.valid && (
                                            <p className="text-red-500 text-sm mt-1">{validation.firstName.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-gray-700 font-medium mb-1">
                                            Last Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2 rounded-xl border ${!validation.lastName.valid ? 'border-red-500' : 'border-purple-200'
                                                } focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50`}
                                            required
                                        />
                                        {!validation.lastName.valid && (
                                            <p className="text-red-500 text-sm mt-1">{validation.lastName.message}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="nickname" className="block text-gray-700 font-medium mb-1">
                                        Nickname
                                    </label>
                                    <input
                                        type="text"
                                        id="nickname"
                                        name="nickname"
                                        value={formData.nickname}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="age" className="block text-gray-700 font-medium mb-1">
                                            Age <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            id="age"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            min="0"
                                            className={`w-full px-4 py-2 rounded-xl border ${!validation.age.valid ? 'border-red-500' : 'border-purple-200'
                                                } focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50`}
                                            required
                                        />
                                        {!validation.age.valid && (
                                            <p className="text-red-500 text-sm mt-1">{validation.age.message}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="gender" className="block text-gray-700 font-medium mb-1">
                                            Gender
                                        </label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
                                        >
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                            <option value="prefer-not-to-say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="address" className="block text-gray-700 font-medium mb-1">
                                        Address
                                    </label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
                                    />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-5">
                                <h2 className="text-xl font-semibold text-purple-700 mb-4">Contact Information</h2>
                                <div>
                                    <label htmlFor="guardianPhone" className="block text-gray-700 font-medium mb-1">
                                        Guardian Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="guardianPhone"
                                        name="guardianPhone"
                                        value={formData.guardianPhone}
                                        onChange={handleChange}
                                        placeholder="e.g. +1234567890"
                                        className={`w-full px-4 py-2 rounded-xl border ${!validation.guardianPhone.valid ? 'border-red-500' : 'border-purple-200'
                                            } focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50`}
                                        required
                                    />
                                    {!validation.guardianPhone.valid && (
                                        <p className="text-red-500 text-sm mt-1">{validation.guardianPhone.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="childPhone" className="block text-gray-700 font-medium mb-1">
                                        Child's Phone Number (if applicable)
                                    </label>
                                    <input
                                        type="tel"
                                        id="childPhone"
                                        name="childPhone"
                                        value={formData.childPhone}
                                        onChange={handleChange}
                                        placeholder="e.g. +1234567890"
                                        className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="nearestHospitalNumber" className="block text-gray-700 font-medium mb-1">
                                        Nearest Hospital Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="nearestHospitalNumber"
                                        name="nearestHospitalNumber"
                                        value={formData.nearestHospitalNumber}
                                        onChange={handleChange}
                                        placeholder="e.g. +1234567890"
                                        className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="emergencyNumber" className="block text-gray-700 font-medium mb-1">
                                        Emergency Contact Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="emergencyNumber"
                                        name="emergencyNumber"
                                        value={formData.emergencyNumber}
                                        onChange={handleChange}
                                        placeholder="e.g. +1234567890"
                                        className={`w-full px-4 py-2 rounded-xl border ${!validation.emergencyNumber.valid ? 'border-red-500' : 'border-purple-200'
                                            } focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50`}
                                        required
                                    />
                                    {!validation.emergencyNumber.valid && (
                                        <p className="text-red-500 text-sm mt-1">{validation.emergencyNumber.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-5">
                                <h2 className="text-xl font-semibold text-purple-700 mb-4">Health and Interests</h2>
                                <div>
                                    <label htmlFor="healthIssues" className="block text-gray-700 font-medium mb-1">
                                        Health Issues or Conditions
                                    </label>
                                    <textarea
                                        id="healthIssues"
                                        name="healthIssues"
                                        value={formData.healthIssues}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Please list any health issues, conditions, or special needs"
                                        className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="allergies" className="block text-gray-700 font-medium mb-1">
                                        Allergies
                                    </label>
                                    <textarea
                                        id="allergies"
                                        name="allergies"
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        rows="2"
                                        placeholder="Please list any allergies"
                                        className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="medications" className="block text-gray-700 font-medium mb-1">
                                        Medications
                                    </label>
                                    <textarea
                                        id="medications"
                                        name="medications"
                                        value={formData.medications}
                                        onChange={handleChange}
                                        rows="2"
                                        placeholder="Please list any medications"
                                        className="w-full px-4 py-2 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="hobbyInput" className="block text-gray-700 font-medium mb-1">
                                        Hobbies and Interests
                                    </label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            id="hobbyInput"
                                            name="hobbyInput"
                                            value={formData.hobbyInput}
                                            onChange={handleChange}
                                            onKeyPress={handleHobbyKeyPress}
                                            placeholder="Add a hobby or interest"
                                            className="flex-grow px-4 py-2 rounded-l-xl border border-purple-200 focus:ring-2 focus:ring-purple-300 focus:border-purple-300 bg-purple-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={addHobby}
                                            className="bg-purple-500 text-white px-4 py-2 rounded-r-xl hover:bg-purple-600 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {formData.hobbies.map((hobby, index) => (
                                            <div
                                                key={index}
                                                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center"
                                            >
                                                <span>{hobby}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeHobby(index)}
                                                    className="ml-2 text-purple-500 hover:text-purple-700"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h3 className="font-medium text-gray-700">Unique Identifier (UID)</h3>
                                    <p className="text-gray-500 text-sm my-1">
                                        This identifier will be used to access your dependent's information.
                                    </p>
                                    <div className="bg-white p-3 rounded border border-gray-200 font-mono text-sm break-all">
                                        {uid}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex justify-between">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handlePrevious}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                                >
                                    Previous
                                </button>
                            ) : (
                                <div />
                            )}
                            {step < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors shadow-md"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors shadow-md disabled:opacity-70"
                                >
                                    {loading ? 'Saving...' : 'Complete Registration'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GuardianOnboarding;