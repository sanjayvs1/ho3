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
const _ = require("lodash");

const host = process.env.REACT_APP_API;

// Avatar component (unchanged)
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
  const chatAreaRef = useRef(null);
  const [speak, setSpeak] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleSpeak = async () => {
    if (!text.trim() || speak) return;
    setLoading(true);
    setSpeak(true);
    try {
      const response = await makeSpeech(text);
      const { filename } = response.data;
      setAudioSource(`${host}${filename}`);
      addMessage(text);
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
      setText(groqResponse); // Set AI response for speaking
      await handleSpeak();
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

  return (
    <div className="h-screen w-screen flex flex-col bg-transparent font-sans relative overflow-hidden">
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
        className="max-h-[30vh] overflow-y-auto p-2.5 bg-transparent flex flex-col gap-2 z-10 absolute bottom-[60px] left-2.5 right-2.5 rounded-lg"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[80%] p-2 rounded-md text-sm leading-relaxed break-words shadow-sm ${
              msg.isUser 
                ? "bg-[#dcf8c6] self-end" 
                : "bg-[#e3f2fd] self-start"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div className="flex items-center p-2.5 bg-[rgba(240,242,245,0.95)] border-t border-[#d1d7db] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-10 absolute bottom-0 left-0 right-0">
        <input
          className="flex-1 px-3 py-2.5 border-none rounded-full bg-white mr-2 text-sm outline-none shadow-inner disabled:opacity-50"
          value={text}
          onChange={(e) => setText(e.target.value.substring(0, 200))}
          placeholder="Type a message..."
          disabled={loading || isRecording}
          onKeyPress={(e) => e.key === "Enter" && handleChat()}
        />
        <button
          className={`w-9 h-9 rounded-full border-none bg-[#00a884] text-white flex items-center justify-center cursor-pointer transition-colors mr-1.5 disabled:bg-gray-300 disabled:cursor-not-allowed`}
          onClick={handleChat}
          disabled={loading || isRecording || !text.trim()}
          title="Send"
        >
          ➤
        </button>
        <button
          className={`w-9 h-9 rounded-full border-none bg-[#00a884] text-white flex items-center justify-center cursor-pointer transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isRecording && loading}
          title={isRecording ? "Stop Recording" : "Start Recording"}
        >
          {isRecording ? "■" : "🎤"}
        </button>
      </div>

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
