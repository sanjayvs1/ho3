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
  FaSignOutAlt
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const transcribeResponse = await axios.post(
            `${host}/transcribe`,
            formData
          );
          const { transcript } = transcribeResponse.data;
          if (!transcript) throw new Error("No transcript received");
          setText(transcript);
          await handleChat();
        } catch (err) {
          console.error("Recording error:", err);
          addMessage("Error transcribing audio", false);
          setSpeak(false);
        } finally {
          setLoading(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      recorder.onerror = (err) => {
        console.error("Recorder error:", err);
        setIsRecording(false);
        setLoading(false);
        addMessage("Recording error occurred", false);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Recording initialization error:", err);
      addMessage("Failed to start recording", false);
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

  const saveToFirebase = async () => {
    try {
      // Update the prescription using the API route
      const response = await axios.put(
        `${host}/ocr/prescriptions/${prescriptionData.id}`,
        editedPrescription
      );

      if (response.status === 200) {
        addMessage(`Prescription updated successfully`, false);
        setModalOpen(false);
      } else {
        throw new Error("Failed to update prescription");
      }
    } catch (error) {
      console.error("Prescription update error:", error);
      addMessage(`Error saving prescription: ${error.message}`, false);
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
                            Timing
                          </label>
                          <input
                            type="text"
                            value={treatment.timing}
                            onChange={(e) =>
                              handleFieldChange(
                                [
                                  "patientInfo",
                                  "treatmentDetails",
                                  index,
                                  "timing",
                                ],
                                e.target.value
                              )
                            }
                            className="w-full p-2 border rounded"
                          />
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
