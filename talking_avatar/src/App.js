import React, { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  useTexture,
  Loader,
  Environment,
  useFBX,
  useAnimations,
  OrthographicCamera,
} from "@react-three/drei";
import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";
import { LinearEncoding, sRGBEncoding } from "three/src/constants";
import { LineBasicMaterial, MeshPhysicalMaterial, Vector2 } from "three";
import ReactAudioPlayer from "react-audio-player";
import createAnimation from "./converter";
import blinkData from "./blendDataBlink.json";
import * as THREE from "three";
import axios from "axios";
import { db } from "./utils/firebaseConfig"; // Adjust path to your firebase.js
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaShoppingBag,
  FaRunning,
  FaUsers,
  FaPaperPlane,
  FaMicrophone,
  FaMicrophoneSlash,
  FaCamera,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaMagic
} from 'react-icons/fa';

const _ = require("lodash");

const host = process.env.REACT_APP_API;

function Avatar({
  avatar_url,
  speak,
  setSpeak,
  text,
  setAudioSource,
  playing,
}) {
  let gltf = useGLTF(avatar_url);
  let morphTargetDictionaryBody = null;
  let morphTargetDictionaryLowerTeeth = null;

  const [
    bodyTexture,
    eyesTexture,
    teethTexture,
    bodySpecularTexture,
    bodyRoughnessTexture,
    bodyNormalTexture,
    teethNormalTexture,
    hairTexture,
    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture,
  ] = useTexture([
    "/images/body.webp",
    "/images/eyes.webp",
    "/images/teeth_diffuse.webp",
    "/images/body_specular.webp",
    "/images/body_roughness.webp",
    "/images/body_normal.webp",
    "/images/teeth_normal.webp",
    "/images/h_color.webp",
    "/images/tshirt_diffuse.webp",
    "/images/tshirt_normal.webp",
    "/images/tshirt_roughness.webp",
    "/images/h_alpha.webp",
    "/images/h_normal.webp",
    "/images/h_roughness.webp",
  ]);

  _.each(
    [
      bodyTexture,
      eyesTexture,
      teethTexture,
      teethNormalTexture,
      bodySpecularTexture,
      bodyRoughnessTexture,
      bodyNormalTexture,
      tshirtDiffuseTexture,
      tshirtNormalTexture,
      tshirtRoughnessTexture,
      hairAlphaTexture,
      hairNormalTexture,
      hairRoughnessTexture,
    ],
    (t) => {
      t.encoding = sRGBEncoding;
      t.flipY = false;
    }
  );

  bodyNormalTexture.encoding = LinearEncoding;
  tshirtNormalTexture.encoding = LinearEncoding;
  teethNormalTexture.encoding = LinearEncoding;
  hairNormalTexture.encoding = LinearEncoding;

  gltf.scene.traverse((node) => {
    if (
      node.type === "Mesh" ||
      node.type === "LineSegments" ||
      node.type === "SkinnedMesh"
    ) {
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;

      if (node.name.includes("Body")) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material = new MeshPhysicalMaterial();
        node.material.map = bodyTexture;
        node.material.roughness = 1.7;
        node.material.roughnessMap = bodyRoughnessTexture;
        node.material.normalMap = bodyNormalTexture;
        node.material.normalScale = new Vector2(0.6, 0.6);
        morphTargetDictionaryBody = node.morphTargetDictionary;
        node.material.envMapIntensity = 0.8;
      }

      if (node.name.includes("Eyes")) {
        node.material = new MeshStandardMaterial();
        node.material.map = eyesTexture;
        node.material.roughness = 0.1;
        node.material.envMapIntensity = 0.5;
      }

      if (node.name.includes("Brows")) {
        node.material = new LineBasicMaterial({ color: 0x000000 });
        node.material.linewidth = 1;
        node.material.opacity = 0.5;
        node.material.transparent = true;
        node.visible = false;
      }

      if (node.name.includes("Teeth")) {
        node.receiveShadow = true;
        node.castShadow = true;
        node.material = new MeshStandardMaterial();
        node.material.roughness = 0.1;
        node.material.map = teethTexture;
        node.material.normalMap = teethNormalTexture;
        node.material.envMapIntensity = 0.7;
      }

      if (node.name.includes("Hair")) {
        node.material = new MeshStandardMaterial();
        node.material.map = hairTexture;
        node.material.alphaMap = hairAlphaTexture;
        node.material.normalMap = hairNormalTexture;
        node.material.roughnessMap = hairRoughnessTexture;
        node.material.transparent = true;
        node.material.depthWrite = false;
        node.material.side = 2;
        node.material.color.setHex(0x000000);
        node.material.envMapIntensity = 0.3;
      }

      if (node.name.includes("TSHIRT")) {
        node.material = new MeshStandardMaterial();
        node.material.map = tshirtDiffuseTexture;
        node.material.roughnessMap = tshirtRoughnessTexture;
        node.material.normalMap = tshirtNormalTexture;
        node.material.color.setHex(0xffffff);
        node.material.envMapIntensity = 0.5;
      }

      if (node.name.includes("TeethLower")) {
        morphTargetDictionaryLowerTeeth = node.morphTargetDictionary;
      }
    }
  });

  const [clips, setClips] = useState([]);
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), []);

  useEffect(() => {
    if (!speak || !text.trim()) return;

    makeSpeech(text)
      .then((response) => {
        let { blendData, filename } = response.data;
        let newClips = [
          createAnimation(blendData, morphTargetDictionaryBody, "HG_Body"),
          createAnimation(
            blendData,
            morphTargetDictionaryLowerTeeth,
            "HG_TeethLower"
          ),
        ];
        filename = host + filename;
        setClips(newClips);
        setAudioSource(filename);
      })
      .catch((err) => {
        console.error("Speech generation error:", err);
        setSpeak(false);
      });
  }, [speak, text, setAudioSource, setSpeak]);

  let idleFbx = useFBX("/idle.fbx");
  let { clips: idleClips } = useAnimations(idleFbx.animations);

  idleClips[0].tracks = _.filter(
    idleClips[0].tracks,
    (track) =>
      track.name.includes("Head") ||
      track.name.includes("Neck") ||
      track.name.includes("Spine2")
  );

  idleClips[0].tracks = _.map(idleClips[0].tracks, (track) => {
    if (track.name.includes("Head")) track.name = "head.quaternion";
    if (track.name.includes("Neck")) track.name = "neck.quaternion";
    if (track.name.includes("Spine")) track.name = "spine2.quaternion";
    return track;
  });

  useEffect(() => {
    let idleClipAction = mixer.clipAction(idleClips[0]);
    idleClipAction.play();

    let blinkClip = createAnimation(
      blinkData,
      morphTargetDictionaryBody,
      "HG_Body"
    );
    let blinkAction = mixer.clipAction(blinkClip);
    blinkAction.play();
  }, [mixer]);

  useEffect(() => {
    if (!playing) return;

    _.each(clips, (clip) => {
      let clipAction = mixer.clipAction(clip);
      clipAction.setLoop(THREE.LoopOnce);
      clipAction.play();
    });
  }, [playing, clips, mixer]);

  useFrame((state, delta) => {
    mixer.update(delta);
  });

  return (
    <group name="avatar">
      <primitive object={gltf.scene} dispose={null} />
    </group>
  );
}

function makeSpeech(text) {
  if (!text || typeof text !== "string") {
    return Promise.reject(new Error("Invalid text input"));
  }
  return axios.post(host + "/talk", { text });
}

function App() {
  const audioPlayer = useRef();
  const navigate = useNavigate();
  const chatAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [speak, setSpeak] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [editedPrescription, setEditedPrescription] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [actionButtonState, setActionButtonState] = useState('idle');
  const [actionData, setActionData] = useState(null);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (content, isUser = true) => {
    if (!content.trim()) return;
    setMessages((prev) => [
      ...prev,
      { content, isUser, timestamp: Date.now() },
    ]);
  };

  const playerEnded = () => {
    console.debug("Audio playback ended");
    setSpeak(false);
    setPlaying(false);
  };

  const playerReady = () => {
    console.debug("Audio ready to play");
    if (audioPlayer.current && audioPlayer.current.audioEl.current) {
      audioPlayer.current.audioEl.current.play().catch((err) => {
        console.error("Audio play error:", err);
        setSpeak(false);
        setPlaying(false);
        addMessage("Error playing audio", false);
      });
      setPlaying(true);
      setSpeak(true);
    }
  };

  const handleSpeak = async (pass = false) => {
    if (!text.trim() || speak) return;
    setLoading(true);
    setSpeak(true);
    try {
      const response = await makeSpeech(text);
      const { filename } = response.data;
      setAudioSource(`${host}${filename}`);
      if (!pass) {
        addMessage(text);
      }
      setText("");
    } catch (err) {
      console.error("Speak error:", err);
      setSpeak(false);
      addMessage("Error generating speech", false);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      const userText = text;
      const response = await axios.post(`${host}/groq`, { prompt: text });
      const { response: groqResponse } = response.data;
      if (!groqResponse) throw new Error("No response from chat API");
      addMessage(userText);
      addMessage(groqResponse, false);
      setText("");
      setText(groqResponse);
      await handleSpeak(true);
    } catch (error) {
      console.error("Chat error:", error);
      addMessage("Error processing chat", false);
      setSpeak(false);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || loading) return;
    setLoading(true);
    console.debug('Starting recording...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.debug('Audio stream obtained');

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      const chunks = [];

      recorder.ondataavailable = (e) => {
        console.debug('Recording data chunk received:', e.data.size, 'bytes');
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        console.debug('Recording stopped, processing audio...');
        const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          // Step 1: Get transcription
          const transcribeResponse = await axios.post(`${host}/transcribe`, formData);
          const { transcript } = transcribeResponse.data;

          if (!transcript) throw new Error('No transcript received');

          // Step 2: Add user's transcribed message to chat
          addMessage(transcript, true);

          // Step 3: Get AI response with structured prompt
          console.debug('Getting AI response...');
          const structuredPrompt = `
            Based on this elderly person's message: "${transcript}"
            Generate ONLY a JSON object with these fields:
            - response: A warm, clear, and simple response (required)
            - action: One of these values if relevant: "openApp", "call", "sendSMS", "emergency", or null
            - data: Additional data for the action (e.g., "https://chat.whatsapp.com" for openApp)
            
            If they need:
            - Social connection → suggest opening WhatsApp (openApp)
            - Medical emergency → suggest emergency action
            - Medicine reminder → suggest sendSMS
            - Immediate help → suggest call
            
            Return ONLY the JSON object, no other text.
          `;

          const chatResponse = await axios.post(`${host}/groq`, { prompt: structuredPrompt });
          const { response: groqResponse } = chatResponse.data;
          console.log("groq", groqResponse);
          // Clean and parse the JSON response
          try {
            // Remove ```json and ``` from the response if present
            const cleanJson = groqResponse
              .replace(/```json\s*/g, '')  // Remove all instances of ```json
              .replace(/```\s*/g, '')      // Remove all instances of ```
              .trim();                     // Remove any whitespace

            const parsedResponse = JSON.parse(cleanJson);
            console.debug('Parsed AI response:', parsedResponse);

            if (!parsedResponse || !parsedResponse.response) {
              throw new Error('Invalid response format');
            }

            // Step 4: Add AI response to messages
            addMessage(parsedResponse.response, false);

            // Step 5: Handle action if present
            if (parsedResponse.action) {
              setActionButtonState(parsedResponse.action);
              if (parsedResponse.data) {
                setActionData(parsedResponse.data);
              }
              // Automatically trigger the action
              setTimeout(() => handleDynamicAction(), 1000);
            } else {
              setActionButtonState('idle');
            }

            // Step 6: Generate and play speech for AI response only
            console.debug('Generating speech for AI response...');
            const speechResponse = await makeSpeech(parsedResponse.response);
            const { filename } = speechResponse.data;

            setAudioSource(`${host}${filename}`);
            setSpeak(true);

          } catch (jsonError) {
            console.error('JSON parsing error:', jsonError);
            // If JSON parsing fails, treat the entire response as a simple message
            addMessage("I'm sorry, I encountered an error processing that. Could you please try again?", false);
            setActionButtonState('idle');
            setSpeak(false);
          }

        } catch (err) {
          console.error('Processing error:', err);
          addMessage("I'm sorry, I couldn't process your message. Please try again.", false);
          setSpeak(false);
        } finally {
          setLoading(false);
          stream.getTracks().forEach(track => {
            track.stop();
            console.debug('Audio track stopped:', track.kind);
          });
        }
      };

      recorder.onerror = (err) => {
        console.error('MediaRecorder error:', err.name, err.message);
        setIsRecording(false);
        setLoading(false);
        addMessage(`Recording error: ${err.message}`, false);
      };

      // Start recording
      recorder.start(10);
      console.debug('Recording started');
      setMediaRecorder(recorder);
      setIsRecording(true);

    } catch (err) {
      console.error('Recording initialization error:', err);
      addMessage(
        `Failed to start recording: ${err.name === 'NotAllowedError' ?
          'Microphone permission denied' :
          err.message}`,
        false
      );
      setLoading(false);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) return;
    mediaRecorder.stop();
    setIsRecording(false);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("prescription", file);
      const uploadResponse = await axios.post(`${host}/ocr/upload`, formData);
      const { prescriptionId, extractedText } = uploadResponse.data;

      if (!prescriptionId || !extractedText)
        throw new Error("No prescription ID or extracted text received");

      const ocrResponse = await axios.get(
        `${host}/ocr/prescriptions/${prescriptionId}`
      );
      const prescriptionDataRaw = ocrResponse.data;

      const parsedData = prescriptionDataRaw;
      console.log(parsedData);
      setPrescriptionData(parsedData);
      setEditedPrescription(JSON.parse(JSON.stringify(parsedData))); // Deep copy
      setModalOpen(true);
      addMessage("Uploaded prescription image", true);
    } catch (error) {
      console.error("Image upload/OCR/Groq error:", error);
      addMessage(`Error processing image: ${error.message}`, false);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFieldChange = (path, value) => {
    const newData = { ...editedPrescription };
    let current = newData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setEditedPrescription(newData);
  };

  const validateAndFormatTime = (timeStr) => {
    if (!timeStr) return "12:00"; // Default to noon if empty

    // If it's already in HH:mm format, validate it
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
      return timeStr;
    }

    // Try to parse the time string
    let hours = 12; // Default to noon
    let minutes = 0;

    // Handle different time formats
    if (timeStr.includes(':')) {
      const [h, m] = timeStr.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        hours = h;
        minutes = m;
      }
    } else if (timeStr.includes('am') || timeStr.includes('pm')) {
      // Handle 12-hour format
      const isPM = timeStr.includes('pm');
      const numStr = timeStr.replace(/[^0-9]/g, '');
      hours = parseInt(numStr) || 12;
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    } else {
      // Try to parse as 24-hour number
      const num = parseInt(timeStr);
      if (!isNaN(num)) {
        hours = Math.floor(num / 100);
        minutes = num % 100;
      }
    }

    // Validate and normalize hours and minutes
    hours = hours % 24;
    minutes = Math.min(59, Math.max(0, minutes));

    // Format as 24-hour time
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (index, value) => {
    const formattedTime = validateAndFormatTime(value);
    handleFieldChange(
      ["patientInfo", "treatmentDetails", index, "timing"],
      formattedTime
    );
  };

  const saveToFirebase = async () => {
    try {
      // Update the prescription using the API route
      const response = await axios.put(
        `${host}/ocr/prescriptions/${prescriptionData.id}`,
        editedPrescription
      );

      // Send SMS notification for the first treatment detail
      if (editedPrescription.patientInfo.treatmentDetails && editedPrescription.patientInfo.treatmentDetails.length > 0) {
        const treatment = editedPrescription.patientInfo.treatmentDetails[0];
        const smsData = {
          time: treatment.timing,
          phoneNumber: "+919967463620",
          message: `Take your medication: ${treatment.medication}`
        };

        await axios.post(`${host}/sms/add`, smsData);
      }

      if (response.status === 200) {
        addMessage(`Prescription updated successfully and SMS notification sent`, false);
        setModalOpen(false);
      } else {
        throw new Error("Failed to update prescription");
      }
    } catch (error) {
      console.error("Prescription update error:", error);
      addMessage(`Error saving prescription: ${error.message}`, false);
    }
  };

  const handleDynamicAction = async () => {
    if (actionButtonState === 'idle') return;

    try {
      switch (actionButtonState) {
        case 'openApp':
          // Open the stored URL (e.g., WhatsApp)
          if (actionData) {
            window.location.href = actionData;
          }
          break;

        case 'call':
          window.location.href = 'tel:+919967463620';
          break;

        case 'sendSMS':
          // Get current time and add 1 minute
          const now = new Date();
          const futureTime = new Date(now.getTime() + 60000); // Add 1 minute
          const formattedTime = futureTime.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          });

          // Send SMS with medication reminder
          const smsData = {
            time: formattedTime,
            phoneNumber: "+919967463620",
            message: "Take your medication"
          };

          await axios.post(`${host}/sms/add`, smsData);
          addMessage("SMS reminder scheduled for 1 minute from now", false);
          break;

        case 'emergency':
          // Send emergency SMS
          const emergencySmsData = {
            time: new Date().toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            }),
            phoneNumber: "+919967463620",
            message: "EMERGENCY: Please contact emergency services immediately"
          };

          await axios.post(`${host}/sms/add`, emergencySmsData);
          addMessage("Emergency SMS sent", false);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Dynamic action error:", error);
      addMessage(`Error performing action: ${error.message}`, false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-transparent font-sans relative overflow-hidden">
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-white shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Toggle Menu"
      >
        <div className="w-6 h-6 flex flex-col justify-around">
          <span className={`block w-full h-0.5 bg-[#00a884] transform transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
          <span className={`block w-full h-0.5 bg-[#00a884] transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-full h-0.5 bg-[#00a884] transform transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
        </div>
      </button>

      {/* Slide-out Menu */}
      <div
        className={`fixed inset-0 z-20 transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[#00a884] ml-10">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes className="text-gray-500 text-xl" />
              </button>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-b border-gray-200">
              <Link
                to="/profile"
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-[#e8f5e9] transition-colors"
              >
                <div className="w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center">
                  <FaUser className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800">My Profile</h3>
                  <p className="text-sm text-gray-500">View and edit profile</p>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-3">
              <Link
                to="/profile"
                className={`flex items-center p-4 rounded-xl text-xl font-medium transition-all duration-200 ${location.pathname === '/profile'
                  ? 'bg-[#00a884] text-white shadow-md'
                  : 'text-gray-700 hover:bg-[#e8f5e9] hover:text-[#00a884]'
                  }`}
              >
                <FaUser className="mr-3 text-2xl" />
                Profile
              </Link>
              <Link
                to="/market"
                className={`flex items-center p-4 rounded-xl text-xl font-medium transition-all duration-200 ${location.pathname === '/market'
                  ? 'bg-[#00a884] text-white shadow-md'
                  : 'text-gray-700 hover:bg-[#e8f5e9] hover:text-[#00a884]'
                  }`}
              >
                <FaShoppingBag className="mr-3 text-2xl" />
                Market
              </Link>
              <Link
                to="/exercise"
                className={`flex items-center p-4 rounded-xl text-xl font-medium transition-all duration-200 ${location.pathname === '/exercise'
                  ? 'bg-[#00a884] text-white shadow-md'
                  : 'text-gray-700 hover:bg-[#e8f5e9] hover:text-[#00a884]'
                  }`}
              >
                <FaRunning className="mr-3 text-2xl" />
                Exercise
              </Link>
              <Link
                to="/community"
                className={`flex items-center p-4 rounded-xl text-xl font-medium transition-all duration-200 ${location.pathname === '/community'
                  ? 'bg-[#00a884] text-white shadow-md'
                  : 'text-gray-700 hover:bg-[#e8f5e9] hover:text-[#00a884]'
                  }`}
              >
                <FaUsers className="mr-3 text-2xl" />
                Community
              </Link>
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-gray-200">
              <button
                className="flex items-center w-full p-4 rounded-xl text-xl font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('sessionExpiry');
                  localStorage.removeItem('userId');

                  // Close the menu
                  setIsMenuOpen(false);

                  // Navigate to login page
                  navigate('/login');
                }}
              >
                <FaSignOutAlt className="mr-3 text-2xl" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add this new button component */}
      <button
        onClick={handleDynamicAction}
        className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-50 
          w-16 h-16 rounded-full bg-white border-2 border-black
          flex items-center justify-center
          shadow-lg transition-all duration-300
          hover:scale-110 active:scale-95
          ${actionButtonState !== 'idle' ? 'animate-pulse' : ''}
          group`}
      >
        <div className="absolute inset-0 rounded-full border-2 border-black animate-ping opacity-75"></div>
        <div className="absolute inset-0 rounded-full border-2 border-black animate-pulse"></div>
        <FaMagic className="text-2xl text-black group-hover:text-white transition-colors duration-300" />
      </button>

      <Canvas
        dpr={window.devicePixelRatio}
        className="absolute top-0 left-0 w-full h-full z-0"
        onCreated={(ctx) => {
          ctx.gl.physicallyCorrectLights = true;
        }}
      >
        <OrthographicCamera makeDefault zoom={2000} position={[0, 1.65, 1]} />
        <Suspense fallback={null}>
          <Environment
            background={false}
            files="/images/photo_studio_loft_hall_1k.hdr"
          />
        </Suspense>
        <Suspense fallback={null}>
          <Bg />
        </Suspense>
        <Suspense fallback={null}>
          <Avatar
            avatar_url="/model.glb"
            speak={speak}
            setSpeak={setSpeak}
            text={text}
            setAudioSource={setAudioSource}
            playing={playing}
          />
        </Suspense>
      </Canvas>

      <div
        ref={chatAreaRef}
        className="max-h-[40vh] md:max-h-[30vh] overflow-y-auto p-2.5 bg-transparent flex flex-col gap-2 z-10 absolute bottom-[80px] md:bottom-[60px] left-2.5 right-2.5 rounded-lg"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[85%] md:max-w-[80%] p-3 md:p-2 rounded-md text-sm md:text-base leading-relaxed break-words shadow-sm ${msg.isUser ? "bg-[#dcf8c6] self-end" : "bg-[#e3f2fd] self-start"
              }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="flex items-center p-3 md:p-4 bg-[rgba(240,242,245,0.98)] border-t-2 border-[#00a884] shadow-[0_-4px_15px_rgba(0,0,0,0.1)] z-10 absolute bottom-0 left-0 right-0">
        <input
          className="flex-1 px-3 md:px-4 py-2 md:py-3 border-2 border-[#00a884] rounded-full bg-white mr-2 md:mr-3 text-base md:text-lg outline-none shadow-inner disabled:opacity-50 placeholder:text-gray-400 focus:border-[#008f6f] transition-colors"
          value={text}
          onChange={(e) => setText(e.target.value.substring(0, 200))}
          placeholder="Type your message here..."
          disabled={loading || isRecording}
          onKeyPress={(e) => e.key === "Enter" && handleChat()}
        />
        <div className="flex gap-2 md:gap-3">
          <button
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#00a884] bg-[#00a884] text-white flex items-center justify-center cursor-pointer transition-all hover:bg-[#008f6f] hover:scale-105 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed shadow-md`}
            onClick={handleChat}
            disabled={loading || isRecording || !text.trim()}
            title="Send Message"
          >
            <FaPaperPlane className="text-lg md:text-xl" />
          </button>
          <button
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#00a884] bg-[#00a884] text-white flex items-center justify-center cursor-pointer transition-all hover:bg-[#008f6f] hover:scale-105 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed shadow-md`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isRecording && loading}
            title={isRecording ? "Stop Recording" : "Start Voice Recording"}
          >
            {isRecording ? (
              <FaMicrophoneSlash className="text-lg md:text-xl" />
            ) : (
              <FaMicrophone className="text-lg md:text-xl" />
            )}
          </button>
          <button
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#00a884] bg-[#00a884] text-white flex items-center justify-center cursor-pointer transition-all hover:bg-[#008f6f] hover:scale-105 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed shadow-md`}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || isRecording}
            title="Upload Prescription Photo"
          >
            <FaCamera className="text-lg md:text-xl" />
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Updated Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Edit Prescription</h2>
            {editedPrescription && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Doctor Information</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium">Name</label>
                      <input
                        type="text"
                        value={editedPrescription.doctorInfo.name}
                        onChange={(e) =>
                          handleFieldChange(
                            ["doctorInfo", "name"],
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Qualifications
                      </label>
                      <input
                        type="text"
                        value={editedPrescription.doctorInfo.qualifications.join(
                          ", "
                        )}
                        onChange={(e) =>
                          handleFieldChange(
                            ["doctorInfo", "qualifications"],
                            e.target.value.split(", ")
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Address
                      </label>
                      <input
                        type="text"
                        value={editedPrescription.doctorInfo.address}
                        onChange={(e) =>
                          handleFieldChange(
                            ["doctorInfo", "address"],
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Contact Info
                      </label>
                      <input
                        type="text"
                        value={editedPrescription.doctorInfo.contactInfo}
                        onChange={(e) =>
                          handleFieldChange(
                            ["doctorInfo", "contactInfo"],
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        value={editedPrescription.doctorInfo.registrationNumber}
                        onChange={(e) =>
                          handleFieldChange(
                            ["doctorInfo", "registrationNumber"],
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Hospital Details</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium">Name</label>
                      <input
                        type="text"
                        value={
                          editedPrescription.doctorInfo.hospitalDetails.name
                        }
                        onChange={(e) =>
                          handleFieldChange(
                            ["doctorInfo", "hospitalDetails", "name"],
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Address
                      </label>
                      <input
                        type="text"
                        value={
                          editedPrescription.doctorInfo.hospitalDetails.address
                        }
                        onChange={(e) =>
                          handleFieldChange(
                            ["doctorInfo", "hospitalDetails", "address"],
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Contact Info
                      </label>
                      <input
                        type="text"
                        value={
                          editedPrescription.doctorInfo.hospitalDetails
                            .contactInfo
                        }
                        onChange={(e) =>
                          handleFieldChange(
                            ["doctorInfo", "hospitalDetails", "contactInfo"],
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Patient Information</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium">Name</label>
                      <input
                        type="text"
                        value={editedPrescription.patientInfo.name}
                        onChange={(e) =>
                          handleFieldChange(
                            ["patientInfo", "name"],
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Age</label>
                      <input
                        type="number"
                        value={editedPrescription.patientInfo.age}
                        onChange={(e) =>
                          handleFieldChange(
                            ["patientInfo", "age"],
                            Number(e.target.value)
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Gender
                      </label>
                      <input
                        type="text"
                        value={editedPrescription.patientInfo.gender || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            ["patientInfo", "gender"],
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Treatment Details</h3>
                  {editedPrescription.patientInfo.treatmentDetails.map(
                    (treatment, index) => (
                      <div key={index} className="space-y-2 mb-4">
                        <div>
                          <label className="block text-sm font-medium">
                            Medication
                          </label>
                          <input
                            type="text"
                            value={treatment.medication}
                            onChange={(e) =>
                              handleFieldChange(
                                [
                                  "patientInfo",
                                  "treatmentDetails",
                                  index,
                                  "medication",
                                ],
                                e.target.value
                              )
                            }
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">
                            Dosage
                          </label>
                          <input
                            type="text"
                            value={treatment.dosage}
                            onChange={(e) =>
                              handleFieldChange(
                                [
                                  "patientInfo",
                                  "treatmentDetails",
                                  index,
                                  "dosage",
                                ],
                                e.target.value
                              )
                            }
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">
                            Timing (24-hour format)
                          </label>
                          <input
                            type="time"
                            value={treatment.timing || "12:00"}
                            onChange={(e) => handleTimeChange(index, e.target.value)}
                            className="w-full p-2 border rounded"
                            step="300"
                            min="00:00"
                            max="23:59"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Select time in 24-hour format (00:00-23:59)
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold">Diagnosis</h3>
                  <input
                    type="text"
                    value={editedPrescription.patientInfo.diagnosis.join(", ")}
                    onChange={(e) =>
                      handleFieldChange(
                        ["patientInfo", "diagnosis"],
                        e.target.value.split(", ")
                      )
                    }
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-between">
              <button
                className="px-4 py-2 bg-[#00a884] text-white rounded hover:bg-[#008f6d]"
                onClick={saveToFirebase}
              >
                Save
              </button>
              <button
                className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[#00a884] text-lg z-[1000]">
          Loading...
        </div>
      )}

      <ReactAudioPlayer
        src={audioSource}
        ref={audioPlayer}
        onEnded={playerEnded}
        onCanPlayThrough={playerReady}
        onError={(err) => {
          console.error("Audio player error:", err);
          setSpeak(false);
          setPlaying(false);
          addMessage("Error playing audio", false);
        }}
      />

      <Loader dataInterpolation={(p) => `Loading... ${p.toFixed(0)}%`} />
    </div>
  );
}

function Bg() {
  const texture = useTexture("/images/bg.webp");
  return (
    <mesh position={[0, 1.5, -2]} scale={[0.8, 0.8, 0.8]}>
      <planeBufferGeometry />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export default App;
