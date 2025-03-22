# 👵👴 Elder Companion: 3D Avatar PWA
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📱 Overview

Elder Companion is a Progressive Web App featuring personalized 3D avatars designed specifically for elderly users. The application provides an intuitive, accessible interface with voice interaction capabilities, making technology more approachable for seniors.

## ✨ Features

- 🗣️ **Voice-Activated Interaction** - Natural conversation with avatars using AssemblyAI and Groq for multi-language support
- 👤 **Customizable 3D Avatars** - Create avatars that resemble family members or caregivers
- 📞 **Marketplace & Exercise Regimes** - For essential goods and healthier body 
- 📆 **Reminders & Scheduling** - Medication, appointments, and important events
- 🔍 **Large Text & Simplified UI** - Designed for users with visual impairments
- 📲 **Prescription Formatting** - Scans Prescriptions and notfies when to take them or to visit a doctor
- 🔄 **Cross-Platform** - Functions on smartphones, tablets, and desktop computers

## 🛠️ Technologies

- **Frontend**:
  - Three.js - For 3D avatar rendering
  - Progressive Web App (PWA) architecture
  - Responsive design optimized for larger text and buttons

- **Backend**:
  - Express.js - Backend framework
  - AWS - Cloud infrastructure, storage and OCR
  - Microsoft Azure - Authentication and cognitive services
  - Render - Deployment and hosting

- **AI & Communication**:
  - AssemblyAI - Speech recognition optimized for elderly voices
  - Groq - Fast LLM responses for natural conversations
  - Twilio - Voice and video communication

## 📋 Requirements

- Node.js 18+
- AWS Account
- Microsoft Azure Account
- Twilio Account
- AssemblyAI API key
- Groq API key

## 🚀 Installation

```bash
# Clone repository
git clone https://github.com/sanjayvs1/ho3
cd talking_avatar
cd server
# Install dependencies
npm/pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env file with your API keys and credentials

# Start development server
npm run dev
```

## 💻 Usage

After installation, open the application in a modern web browser. First-time users will be guided through:

1. Account creation process(Personal information for Personalized-Use)
2. Avatar intro and other functionalities
3. Emergency contact configuration
4. Basic tutorial on navigation and features

## 👥 Target Audience

- Elderly individuals (65+)
- Family members of elderly people
- Caregivers and assisted living facilities
- Senior community centers

## 🔄 Updates & Maintenance

The application checks for updates when online and installs them automatically during inactive periods. All user data is securely backed up to the cloud when connected to the internet.

## 🤝 Contributing

Check out our PWA app at : [karuna-ai.vercel.app](https://karuna-ai.vercel.app)
