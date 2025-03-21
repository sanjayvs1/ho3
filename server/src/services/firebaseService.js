// src/services/firebaseService.js
const { db } = require('./firebase');
const { collection, addDoc, getDocs, doc, getDoc, updateDoc } = require('firebase/firestore');

async function savePrescription(data) {
  try {
    const docRef = await addDoc(collection(db, 'prescriptions'), data);
    return docRef;
  } catch (error) {
    console.error('Error saving to Firebase:', error);
    throw error;
  }
}

async function getAllPrescriptions() {
  try {
    const querySnapshot = await getDocs(collection(db, 'prescriptions'));
    const prescriptions = [];
    
    querySnapshot.forEach((doc) => {
      prescriptions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return prescriptions;
  } catch (error) {
    console.error('Error getting prescriptions:', error);
    throw error;
  }
}

async function getPrescriptionById(id) {
  try {
    const docRef = doc(db, 'prescriptions', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting prescription:', error);
    throw error;
  }
}

async function updatePrescription(id, updateData) {
  try {
    const docRef = doc(db, 'prescriptions', id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating prescription:', error);
    throw error;
  }
}

module.exports = {
  savePrescription,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescription
};