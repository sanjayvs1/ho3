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
    if (!speak) return;

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
        console.error(err);
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
  return axios.post(host + "/talk", { text });
}

const STYLES = {
  area: {
    position: "absolute",
    bottom: "20px",
    left: "20px",
    zIndex: 500,
    background: "rgba(0,0,0,0.7)",
    padding: "20px",
    borderRadius: "10px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  text: {
    margin: "0px",
    width: "300px",
    padding: "12px",
    background: "rgba(255,255,255,0.1)",
    color: "#ffffff",
    fontSize: "1.2em",
    border: "none",
    borderRadius: "6px",
    resize: "none",
  },
  button: {
    padding: "12px 20px",
    marginTop: "10px",
    marginRight: "10px",
    display: "inline-block",
    color: "#FFFFFF",
    background: "rgba(255,255,255,0.2)",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1em",
    transition: "background 0.3s ease",
  },
  audioControls: {
    marginTop: "10px",
    display: "flex",
    gap: "10px",
  },
};

function App() {
  const audioPlayer = useRef();
  const [speak, setSpeak] = useState(false);
  const [text, setText] = useState(
    "My name is Arwen. I’m a virtual human who can speak whatever you type here along with realistic facial movements."
  );
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const playerEnded = () => {
    setSpeak(false);
    setPlaying(false);
  };

  const playerReady = () => {
    audioPlayer.current.audioEl.current.play();
    setPlaying(true);
    setSpeak(true); // Sync avatar animation with playback
  };

  const togglePlayPause = () => {
    const audioEl = audioPlayer.current.audioEl.current;
    if (playing) {
      audioEl.pause();
      setPlaying(false);
      setSpeak(false);
    } else {
      audioEl.play();
      setPlaying(true);
      setSpeak(true);
    }
  };

  const replayAudio = () => {
    const audioEl = audioPlayer.current.audioEl.current;
    audioEl.currentTime = 0;
    audioEl.play();
    setPlaying(true);
    setSpeak(true);
  };

  const handleSpeak = async () => {
    setSpeak(true);
    try {
      const response = await makeSpeech(text);
      const { filename } = response.data;
      setAudioSource(`${host}${filename}`);
    } catch (err) {
      console.error("Speak error:", err);
      setSpeak(false);
    }
  };

  const handleChat = async () => {
    try {
      const response = await axios.post(`${host}/groq`, {
        prompt: text,
      });
      const { response: groqResponse } = response.data;
      setText(groqResponse);
      handleSpeak();
    } catch (error) {
      console.error("Chat error:", error);
      setSpeak(false);
    }
  };

  const startRecording = async () => {
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
          // Step 1: Send to /transcribe
          const transcribeResponse = await axios.post(
            `${host}/transcribe`,
            formData
          );
          const { transcript } = transcribeResponse.data;
          setText(transcript);

          handleChat();
        } catch (err) {
          console.error("Recording error:", err);
          setSpeak(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="full">
      <div style={STYLES.area}>
        <textarea
          rows={4}
          style={STYLES.text}
          value={text}
          onChange={(e) => setText(e.target.value.substring(0, 200))}
          placeholder="Type your message here..."
        />
        <br />
        <button onClick={handleSpeak} style={STYLES.button} disabled={speak}>
          {speak ? "Speaking..." : "Speak"}
        </button>
        <button onClick={handleChat} style={STYLES.button} disabled={speak}>
          Chat
        </button>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          style={STYLES.button}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>

        {/* Audio controls */}
        {audioSource && (
          <div style={STYLES.audioControls}>
            <button onClick={togglePlayPause} style={STYLES.button}>
              {playing ? "Pause" : "Play"}
            </button>
            <button onClick={replayAudio} style={STYLES.button}>
              Replay
            </button>
          </div>
        )}
      </div>

      <ReactAudioPlayer
        src={audioSource}
        ref={audioPlayer}
        onEnded={playerEnded}
        onCanPlayThrough={playerReady}
      />

      <Canvas
        dpr={2}
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
      <Loader dataInterpolation={(p) => `Loading... please wait`} />
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
