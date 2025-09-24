import React, { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "../../../core/input/heading";
import { RowContainer } from "../../../styles/containers/styles";
import { ButtonPanel } from "../../../core/list/styles";
import { Button } from "../../../core/elements";
import { io, Socket } from "socket.io-client";
import axios from "axios";

import Loader from "../../../core/loader";
import Message from "../../../core/message";
import NoDataFound from "../../../core/list/nodata";
import { useToast } from "../../../core/toast";
import { GetIcon } from "../../../../icons";
import { getData, postData, putData } from "../../../../backend/api";
import CustomSelect from "../../../core/select";

// Utility function for class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Status Indicator Component
function StatusIndicator({ status }) {
  const statusConfig = {
    disconnected: {
      color: "bg-gray-400",
      text: "Disconnected",
      icon: "AlertCircle",
      pulse: false,
    },
    connecting: {
      color: "bg-amber-500",
      text: "Connecting...",
      icon: "Loader2",
      pulse: true,
    },
    connected: {
      color: "bg-green-500",
      text: "Connected & Recording",
      icon: "CheckCircle",
      pulse: true,
    },
    error: {
      color: "bg-red-500",
      text: "Connection Error",
      icon: "AlertCircle",
      pulse: false,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            config.color,
            config.pulse ? "animate-pulse" : ""
          )}
        />
        <span className="text-sm font-medium text-slate-600">
          {config.text}
        </span>
      </div>
    </div>
  );
}

// Custom Hook for Transcription Service
function useTranscriptionService(
  targetLanguage = "en-US",
  roomId = null,
  sessionId = null,
  socket = null,
  setSocketConnected = null,
  onRecordingComplete = null,
  translationEnabled = false,
  translationSocket = null,
  translationSocketConnected = false,
  novaModel = "nova-3",
  targetLanguages = []
) {
  // console.log('useTranscriptionService called with:', { targetLanguage, roomId, sessionId, socket: !!socket, translationEnabled, translationSocket: !!translationSocket, translationSocketConnected, novaModel });

  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [transcriptionResults, setTranscriptionResults] = useState([]);
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(""); // Start with default, will be updated when sessionId is available
  const [serviceProvider, setServiceProvider] = useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const deepgramConnectionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const currentSessionIdRef = useRef(sessionId);
  const recordingChunksRef = useRef([]);

  // Use refs to store current translation state to avoid stale closures
  const translationEnabledRef = useRef(translationEnabled);
  const translationSocketRef = useRef(translationSocket);
  const translationSocketConnectedRef = useRef(translationSocketConnected);

  // Update refs when translation parameters change
  useEffect(() => {
    translationEnabledRef.current = translationEnabled;
    translationSocketRef.current = translationSocket;
    translationSocketConnectedRef.current = translationSocketConnected;
    console.log("Translation refs updated:", {
      translationEnabled: translationEnabledRef.current,
      translationSocket: !!translationSocketRef.current,
      translationSocketConnected: translationSocketConnectedRef.current,
    });
  }, [translationEnabled, translationSocket, translationSocketConnected]);

  // Note: Socket initialization moved to main component

  // Update currentRoomId when sessionId changes (for display purposes)
  useEffect(() => {
    if (sessionId) {
      console.log("Setting currentRoomId to session ID:", sessionId);
      setCurrentRoomId(sessionId);
    } else {
      console.log("Clearing currentRoomId - no session selected");
      setCurrentRoomId("");
    }
  }, [sessionId]);

  // Determine service provider based on language support
  const isNovaSupported = (languageCode) => {
    // Nova-3 supported languages (multilingual support for English, Spanish, French, German, Hindi, Russian, Portuguese, Japanese, Italian, and Dutch)
    const NOVA_3_SUPPORTED_LANGUAGES = [
      "en", "en-US", "es", "fr", "de", "hi", "ru", "pt", "ja", "it", "nl"
    ];

    // Nova-2 supported languages (additional languages not in Nova-3)
    const NOVA_2_SUPPORTED_LANGUAGES = [
      "bg", "ca", "zh", "zh-CN", "zh-Hans", "zh-TW", "zh-Hant", "zh-HK",
      "cs", "da", "da-DK", "en-AU", "en-GB", "en-NZ", "en-IN", "et", "fi",
      "nl-BE", "fr-CA", "de-CH", "el", "hi-Latn", "hu", "id", "ko", "ko-KR",
      "lv", "lt", "ms", "no", "pl", "pt-BR", "pt-PT", "ro", "sk", "es-419",
      "sv", "sv-SE", "th", "th-TH", "tr", "uk", "vi"
    ];

    const baseLanguage = languageCode.split("-")[0];
    return (
      NOVA_3_SUPPORTED_LANGUAGES.includes(languageCode) ||
      NOVA_3_SUPPORTED_LANGUAGES.includes(baseLanguage) ||
      NOVA_2_SUPPORTED_LANGUAGES.includes(languageCode) ||
      NOVA_2_SUPPORTED_LANGUAGES.includes(baseLanguage)
    );
  };

  const startTranscription = useCallback(async () => {
    console.log("startTranscription called");
    console.log("Target language:", targetLanguage);
    console.log("Nova model:", novaModel);
    console.log("Current room ID:", currentRoomId);

    try {
      setError(null);
      setConnectionStatus("connecting");

      // Check if Deepgram API key is available
      const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

      if (!apiKey) {
        throw new Error(
          "Deepgram API key not found. Please set VITE_DEEPGRAM_API_KEY environment variable."
        );
      }

      // Get user microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      // Dynamically import Deepgram SDK
      const { createClient, LiveTranscriptionEvents } = await import(
        "@deepgram/sdk"
      );

      const deepgramClient = createClient(apiKey);

      // Setup Deepgram live connection with appropriate model
      const deepgramLive = deepgramClient.listen.live({
        model: novaModel,
        language: targetLanguage,
        interim_results: true,
        punctuate: true,
        smart_format: true,
      });

      deepgramConnectionRef.current = deepgramLive;

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (deepgramLive.getReadyState() !== 1) {
          console.error("Connection timeout - WebSocket failed to open");
          setError(
            "Connection timeout. Please check your internet connection and try again."
          );
          setConnectionStatus("error");
          deepgramLive.requestClose();
        }
      }, 10000);

      // Handle Deepgram connection events
      deepgramLive.on(LiveTranscriptionEvents.Open, () => {
        clearTimeout(connectionTimeout);
        console.log("Deepgram connection opened successfully");
        setConnectionStatus("connected");
        setServiceProvider("deepgram");

        // Start MediaRecorder
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorderRef.current = mediaRecorder;
        recordingChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          console.log("MediaRecorder data available:", {
            size: event.data.size,
            readyState: deepgramLive.getReadyState(),
          });
          if (event.data.size > 0 && deepgramLive.getReadyState() === 1) {
            deepgramLive.send(event.data);
            console.log("Sent audio data to Deepgram");
          }
          // Capture recording chunks for saving
          if (event.data.size > 0) {
            recordingChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          console.log("MediaRecorder stopped, creating recording blob");
          const recordingBlob = new Blob(recordingChunksRef.current, {
            type: "audio/wav",
          });
          if (onRecordingComplete) {
            onRecordingComplete(recordingBlob);
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          setError("MediaRecorder error occurred");
          setConnectionStatus("error");
        };

        mediaRecorder.start(100); // Send data every 100ms
        setIsRecording(true);
      });

      deepgramLive.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        console.log("Deepgram transcript received:", {
          transcript,
          isFinal: data.is_final || false,
        });
        console.log("Full Deepgram data:", data);
        if (transcript) {
          console.log("Calling addTranscriptionResult with:", {
            transcript,
            isFinal: data.is_final || false,
            sessionId,
          });
          addTranscriptionResult(transcript, data.is_final || false);
        } else {
          console.log("No transcript in Deepgram data");
        }
      });

      deepgramLive.on(LiveTranscriptionEvents.Error, (error) => {
        console.error("Deepgram error:", error);
        const errorMsg =
          error?.error?.message || error?.message || "Unknown connection error";
        setError(`Connection failed: ${errorMsg}`);
        setConnectionStatus("error");
      });

      deepgramLive.on(LiveTranscriptionEvents.Close, () => {
        console.log("Deepgram connection closed");
        setConnectionStatus("disconnected");
        setIsRecording(false);
      });
    } catch (err) {
      console.error("Error starting transcription:", err);
      setError(err.message || "Failed to start transcription");
      setConnectionStatus("error");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [targetLanguage, novaModel]);

  const addTranscriptionResult = useCallback(
    async (text, isFinal) => {
      console.log("addTranscriptionResult called:", {
        text,
        isFinal,
        currentRoomId,
        sessionId,
        socket: !!socket,
      });
      console.log("Hook sessionId parameter:", sessionId);
      console.log("Hook socket parameter:", socket);
      console.log("Translation parameters in hook:", {
        translationEnabled: translationEnabledRef.current,
        translationSocket: !!translationSocketRef.current,
        translationSocketConnected: translationSocketConnectedRef.current,
      });
      if (text.trim() === "") {
        console.log("Empty text, returning early");
        return;
      }

      // Always update interim text for real-time display
      if (!isFinal) {
        setInterimText(text);
      }

      const currentSessionId = currentSessionIdRef.current;
      console.log("Checking socket and sessionId for sending:", {
        socket: !!socket,
        sessionId: currentSessionId,
      });

      if (socket && currentSessionId && socket.connected) {
        // console.log('Sending transcription with session ID:', currentSessionId);
        // console.log('Transcription data:', {
        //   roomId: currentSessionId,
        //   text: text,
        //   timestamp: new Date(),
        //   isFinal: isFinal
        // });

        // Send both interim and final results to server
        socket.emit("transcription", {
          roomId: currentSessionId,
          text: text,
          timestamp: new Date(),
          isFinal: isFinal,
        });
        // console.log('Sent transcription to server (interim:', !isFinal, 'final:', isFinal, ')');
      } else {
        // console.log('Socket not available or no session ID for sending transcription');
        // console.log('Socket details:', { socket: !!socket, sessionId: currentSessionId, socketConnected: socket?.connected });
        // console.log('Socket ready state:', socket?.readyState);
        // console.log('Socket connected state:', socket?.connected);
      }

      if (isFinal) {
        // console.log('Processing FINAL transcription:', { text, isFinal });
        const result = {
          text: text,
          isFinal,
          timestamp: new Date(),
          language: targetLanguage,
          roomId: currentRoomId,
          novaModel: novaModel,
        };

        setTranscriptionResults((prev) => [result,...prev]);
        setInterimText(""); // Clear interim when final arrives
        // Send final transcription to translation server if translation is enabled
        console.log("Checking translation conditions:", {
          translationEnabled: translationEnabledRef.current,
          translationSocket: !!translationSocketRef.current,
          translationSocketConnected: translationSocketConnectedRef.current,
          currentSessionId,
          isFinal,
        });
        // console.log('isTranslationEnabled?? processing translation', isTranslationEnabled);
        if (translationEnabledRef.current) {
          const translationRoomId = `${currentSessionId}+translation`;

          // Use passed target languages or fallback to hardcoded languages
          const languagesToTranslate =
            targetLanguages && targetLanguages.length > 0
              ? targetLanguages.filter(
                  (lang) => lang !== targetLanguage.split("-")[0]
                ) // Exclude source language
              : ["es", "fr", "de", "hi", "ru", "pt", "ja", "it", "nl"]; // Fallback to Nova-3 supported languages

          // Validate that all languages are in the correct format (language codes)
          const validatedLanguages = languagesToTranslate.filter(lang => {
            // Check if it's a valid language code (2-3 characters, lowercase)
            const isValidCode = /^[a-z]{2,3}(-[A-Z]{2})?$/.test(lang);
            if (!isValidCode) {
              console.warn(`Invalid language code format: ${lang}. Expected format: 'en', 'fr', 'en-US', etc.`);
            }
            return isValidCode;
          });

          console.log("Translation hook - language selection:", {
            targetLanguages,
            sourceLanguage: targetLanguage,
            filteredLanguages: languagesToTranslate,
            validatedLanguages,
            source: targetLanguages && targetLanguages.length > 0 ? "Passed Parameter" : "Hardcoded Fallback",
            validationWarnings: languagesToTranslate.length !== validatedLanguages.length ? 
              `${languagesToTranslate.length - validatedLanguages.length} languages filtered out due to invalid format` : 
              "All languages have valid format"
          });

          console.log("Sending final transcription to translation server:", {
            roomId: translationRoomId,
            text: text,
            timestamp: new Date(),
            sourceLanguage: targetLanguage,
            targetLanguages: validatedLanguages,
            originalTargetLanguages: languagesToTranslate,
          });

          translationSocketRef.current.emit("transcription-for-translation", {
            roomId: translationRoomId,
            text: text,
            timestamp: new Date(),
            sourceLanguage: targetLanguage,
            targetLanguages: validatedLanguages,
          });
          console.log(
            "Sent transcription to translation server with target languages:",
            validatedLanguages
          );
          console.log("Translation data sent:", {
            roomId: translationRoomId,
            text: text,
            sourceLanguage: targetLanguage,
            targetLanguages: validatedLanguages,
            translationEnabled: translationEnabledRef.current,
            translationSocketConnected: translationSocketConnectedRef.current,
          });
        } else {
          console.log("Translation conditions not met:", {
            translationEnabled: translationEnabledRef.current,
            translationSocket: !!translationSocketRef.current,
            translationSocketConnected: translationSocketConnectedRef.current,
            currentSessionId,
            isFinal,
            isTranslationEnabled: translationEnabledRef.current,
          });
        }
        // if (translationEnabled && translationSocket && translationSocketConnected && currentSessionId && isFinal) {
        //   const translationRoomId = `${currentSessionId}+translation`;
        //   console.log('Sending final transcription to translation server:', {
        //     roomId: translationRoomId,
        //     text: text,
        //     timestamp: new Date(),
        //     sourceLanguage: targetLanguage
        //   });

        //   translationSocket.emit('transcription-for-translation', {
        //     roomId: translationRoomId,
        //     text: text,
        //     timestamp: new Date(),
        //     sourceLanguage: targetLanguage
        //   });
        //   console.log('Sent transcription to translation server');
        // } else {
        //   console.log('Translation conditions not met:', {
        //     translationEnabled,
        //     translationSocket: !!translationSocket,
        //     translationSocketConnected,
        //     currentSessionId,
        //     isFinal
        //   });
        // }
      }
    },
    [socket, targetLanguage, currentRoomId]
  );

  // Debug: Log when currentRoomId changes
  useEffect(() => {
    console.log("currentRoomId changed to:", currentRoomId);
  }, [currentRoomId]);

  // Debug: Log when sessionId changes in hook
  useEffect(() => {
    console.log("Hook sessionId changed to:", sessionId);
    currentSessionIdRef.current = sessionId;
  }, [sessionId]);

  const stopTranscription = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (deepgramConnectionRef.current) {
      deepgramConnectionRef.current.finish();
      deepgramConnectionRef.current = null;
    }

    setIsRecording(false);
    setConnectionStatus("disconnected");
    setInterimText("");
  }, [isRecording]);

  const clearTranscription = useCallback(() => {
    setTranscriptionResults([]);
    setInterimText("");
    setError(null);
  }, []);

  return {
    isRecording,
    connectionStatus,
    transcriptionResults,
    interimText,
    error,
    startTranscription,
    stopTranscription,
    clearTranscription,
    serviceProvider,
    isNovaSupported: isNovaSupported(targetLanguage),
    currentRoomId,
  };
}

// Language mapping utility for translation
const LANGUAGE_NAME_TO_CODE_MAP = {
  // English variants
  "English": "en",
  "English (US)": "en-US",
  "English (UK)": "en-GB",
  "English (Australia)": "en-AU",
  "English (India)": "en-IN",
  "English (New Zealand)": "en-NZ",
  
  // Spanish variants
  "Spanish": "es",
  "Spanish (Spain)": "es-ES",
  "Spanish (Latin America)": "es-419",
  
  // French variants
  "French": "fr",
  "French (France)": "fr-FR",
  "French (Canada)": "fr-CA",
  
  // German variants
  "German": "de",
  "German (Germany)": "de-DE",
  "German (Switzerland)": "de-CH",
  
  // Portuguese variants
  "Portuguese": "pt",
  "Portuguese (Brazil)": "pt-BR",
  "Portuguese (Portugal)": "pt-PT",
  
  // Chinese variants
  "Chinese": "zh",
  "Chinese (Simplified)": "zh",
  "Chinese (Traditional)": "zh-TW",
  "Chinese (Mandarin)": "zh",
  "Chinese (Cantonese)": "yue",
  
  // Other major languages
  "Arabic": "ar",
  "Hindi": "hi",
  "Japanese": "ja",
  "Korean": "ko",
  "Russian": "ru",
  "Italian": "it",
  "Dutch": "nl",
  "Polish": "pl",
  "Turkish": "tr",
  "Swedish": "sv",
  "Danish": "da",
  "Norwegian": "no",
  "Finnish": "fi",
  "Czech": "cs",
  "Hungarian": "hu",
  "Romanian": "ro",
  "Bulgarian": "bg",
  "Croatian": "hr",
  "Slovak": "sk",
  "Slovenian": "sl",
  "Estonian": "et",
  "Latvian": "lv",
  "Lithuanian": "lt",
  "Maltese": "mt",
  "Greek": "el",
  "Hebrew": "he",
  "Indonesian": "id",
  "Malay": "ms",
  "Filipino": "tl",
  "Bengali": "bn",
  "Urdu": "ur",
  "Persian": "fa",
  "Gujarati": "gu",
  "Kannada": "kn",
  "Malayalam": "ml",
  "Punjabi": "pa",
  "Tamil": "ta",
  "Telugu": "te",
  "Nepali": "ne",
  "Sinhala": "si",
  "Myanmar (Burmese)": "my",
  "Khmer": "km",
  "Lao": "lo",
  "Georgian": "ka",
  "Amharic": "am",
  "Swahili": "sw",
  "Zulu": "zu",
  "Afrikaans": "af",
  "Albanian": "sq",
  "Armenian": "hy",
  "Azerbaijani": "az",
  "Basque": "eu",
  "Belarusian": "be",
  "Catalan": "ca",
  "Welsh": "cy",
  "Galician": "gl",
  "Icelandic": "is",
  "Irish": "ga",
  "Macedonian": "mk",
  "Mongolian": "mn",
  "Serbian": "sr",
  "Ukrainian": "uk",
  "Yiddish": "yi",
  "Thai": "th",
  "Vietnamese": "vi",
  "Esperanto": "eo",
  "Assamese": "as",
  "Aymara": "ay",
  "Bambara": "bm",
  "Bhojpuri": "bho",
  "Bosnian": "bs",
  "Cebuano": "ceb",
  "Chichewa": "ny",
  "Corsican": "co",
  "Dhivehi": "dv",
  "Dogri": "doi",
  "Ewe": "ee",
  "Frisian": "fy",
  "Guarani": "gn",
  "Hausa": "ha",
  "Hawaiian": "haw",
  "Hmong": "hmn",
  "Igbo": "ig",
  "Ilocano": "ilo",
  "Javanese": "jv",
  "Kazakh": "kk",
  "Kinyarwanda": "rw",
  "Konkani": "kok",
  "Krio": "kri",
  "Kurdish (Kurmanji)": "ku",
  "Kurdish (Sorani)": "ckb",
  "Kyrgyz": "ky",
  "Latin": "la",
  "Lingala": "ln",
  "Luganda": "lg",
  "Luxembourgish": "lb",
  "Maithili": "mai",
  "Malagasy": "mg",
  "Maori": "mi",
  "Marathi": "mr",
  "Meiteilon (Manipuri)": "mni",
  "Mizo": "lus",
  "Odia (Oriya)": "or",
  "Oromo": "om",
  "Pashto": "ps",
  "Quechua": "qu",
  "Samoan": "sm",
  "Sanskrit": "sa",
  "Scots Gaelic": "gd",
  "Sepedi": "nso",
  "Sesotho": "st",
  "Shona": "sn",
  "Sindhi": "sd",
  "Somali": "so",
  "Sundanese": "su",
  "Tagalog": "tl",
  "Tajik": "tg",
  "Tatar": "tt",
  "Tigrinya": "ti",
  "Tsonga": "ts",
  "Turkmen": "tk",
  "Twi": "tw",
  "Uyghur": "ug",
  "Uzbek": "uz",
  "Xhosa": "xh",
  "Yoruba": "yo"
};

// Function to convert language name to code
const convertLanguageNameToCode = (languageName) => {
  if (!languageName || languageName.trim() === "") return null;
  
  const normalizedName = languageName.trim();
  const code = LANGUAGE_NAME_TO_CODE_MAP[normalizedName];
  
  if (code) {
    return code;
  }
  
  // Try to find partial matches for common variations
  const lowerName = normalizedName.toLowerCase();
  for (const [name, code] of Object.entries(LANGUAGE_NAME_TO_CODE_MAP)) {
    if (name.toLowerCase().includes(lowerName) || lowerName.includes(name.toLowerCase())) {
      return code;
    }
  }
  
  // Return null if no match found
  return null;
};

// Function to convert language code to name
const convertLanguageCodeToName = (languageCode) => {
  if (!languageCode) return null;
  
  for (const [name, code] of Object.entries(LANGUAGE_NAME_TO_CODE_MAP)) {
    if (code === languageCode) {
      return name;
    }
  }
  
  return languageCode; // Return the code if no name found
};

const LiveTest = (props) => {
  console.log("props", props);
  const [eventId, setEventId] = useState(null);
  const [translationLanguages, setTranslationLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(props.selectedSession);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Translation feature state
  const [translationEnabled, setTranslationEnabled] = useState(true);
  const [translationSocket, setTranslationSocket] = useState(null);
  const [translationSocketConnected, setTranslationSocketConnected] =
    useState(false);
  const [availableTranslationLanguages, setAvailableTranslationLanguages] =
    useState([]);

  // New state variables for recording functionality
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingChunks, setRecordingChunks] = useState([]);
  const [mediaRecorderInstance, setMediaRecorderInstance] = useState(null);

  const toast = useToast();

  // Define supported languages with Nova-2 and Nova-3 support
  const SUPPORTED_LANGUAGES = [
    // Nova-3 supported languages (multilingual support for English, Spanish, French, German, Hindi, Russian, Portuguese, Japanese, Italian, and Dutch)
    { code: "en", name: "English", novaSupport: "nova-3" },
    { code: "en-US", name: "English (US)", novaSupport: "nova-3" },
    { code: "es", name: "Spanish", novaSupport: "nova-3" },
    { code: "fr", name: "French", novaSupport: "nova-3" },
    { code: "de", name: "German", novaSupport: "nova-3" },
    { code: "hi", name: "Hindi", novaSupport: "nova-3" },
    { code: "ru", name: "Russian", novaSupport: "nova-3" },
    { code: "pt", name: "Portuguese", novaSupport: "nova-3" },
    { code: "ja", name: "Japanese", novaSupport: "nova-3" },
    { code: "it", name: "Italian", novaSupport: "nova-3" },
    { code: "nl", name: "Dutch", novaSupport: "nova-3" },

    // Nova-2 supported languages (additional languages not in Nova-3)
    { code: "bg", name: "Bulgarian", novaSupport: "nova-2" },
    { code: "ca", name: "Catalan", novaSupport: "nova-2" },
    { code: "zh", name: "Chinese (Mandarin, Simplified)", novaSupport: "nova-2" },
    { code: "zh-CN", name: "Chinese (Mandarin, Simplified)", novaSupport: "nova-2" },
    { code: "zh-Hans", name: "Chinese (Mandarin, Simplified)", novaSupport: "nova-2" },
    { code: "zh-TW", name: "Chinese (Mandarin, Traditional)", novaSupport: "nova-2" },
    { code: "zh-Hant", name: "Chinese (Mandarin, Traditional)", novaSupport: "nova-2" },
    { code: "zh-HK", name: "Chinese (Cantonese, Traditional)", novaSupport: "nova-2" },
    { code: "cs", name: "Czech", novaSupport: "nova-2" },
    { code: "da", name: "Danish", novaSupport: "nova-2" },
    { code: "da-DK", name: "Danish (Denmark)", novaSupport: "nova-2" },
    { code: "en-AU", name: "English (Australia)", novaSupport: "nova-2" },
    { code: "en-GB", name: "English (United Kingdom)", novaSupport: "nova-2" },
    { code: "en-NZ", name: "English (New Zealand)", novaSupport: "nova-2" },
    { code: "en-IN", name: "English (India)", novaSupport: "nova-2" },
    { code: "et", name: "Estonian", novaSupport: "nova-2" },
    { code: "fi", name: "Finnish", novaSupport: "nova-2" },
    { code: "nl-BE", name: "Flemish", novaSupport: "nova-2" },
    { code: "fr-CA", name: "French (Canada)", novaSupport: "nova-2" },
    { code: "de-CH", name: "German (Switzerland)", novaSupport: "nova-2" },
    { code: "el", name: "Greek", novaSupport: "nova-2" },
    { code: "hi-Latn", name: "Hindi (Latin)", novaSupport: "nova-2" },
    { code: "hu", name: "Hungarian", novaSupport: "nova-2" },
    { code: "id", name: "Indonesian", novaSupport: "nova-2" },
    { code: "ko", name: "Korean", novaSupport: "nova-2" },
    { code: "ko-KR", name: "Korean (South Korea)", novaSupport: "nova-2" },
    { code: "lv", name: "Latvian", novaSupport: "nova-2" },
    { code: "lt", name: "Lithuanian", novaSupport: "nova-2" },
    { code: "ms", name: "Malay", novaSupport: "nova-2" },
    { code: "no", name: "Norwegian", novaSupport: "nova-2" },
    { code: "pl", name: "Polish", novaSupport: "nova-2" },
    { code: "pt-BR", name: "Portuguese (Brazil)", novaSupport: "nova-2" },
    { code: "pt-PT", name: "Portuguese (Portugal)", novaSupport: "nova-2" },
    { code: "ro", name: "Romanian", novaSupport: "nova-2" },
    { code: "sk", name: "Slovak", novaSupport: "nova-2" },
    { code: "es-419", name: "Spanish (Latin America and the Caribbean)", novaSupport: "nova-2" },
    { code: "sv", name: "Swedish", novaSupport: "nova-2" },
    { code: "sv-SE", name: "Swedish (Sweden)", novaSupport: "nova-2" },
    { code: "th", name: "Thai", novaSupport: "nova-2" },
    { code: "th-TH", name: "Thai (Thailand)", novaSupport: "nova-2" },
    { code: "tr", name: "Turkish", novaSupport: "nova-2" },
    { code: "uk", name: "Ukrainian", novaSupport: "nova-2" },
    { code: "vi", name: "Vietnamese", novaSupport: "nova-2" },
  ];

  // Function to map language names to proper language codes
  const mapLanguageToCode = (languageName) => {
    const exactMatch = SUPPORTED_LANGUAGES.find(
      (lang) => lang.name.toLowerCase() === languageName.toLowerCase()
    );
    if (exactMatch) {
      return exactMatch.code;
    }

    const commonMappings = {
      english: "en",
      "english (us)": "en-US",
      french: "fr",
      spanish: "es",
      german: "de",
      italian: "it",
      portuguese: "pt",
      arabic: "ar-SA",
      malayalam: "ml-IN",
      esperanto: "eo",
      hindi: "hi",
      chinese: "zh",
      mandarin: "zh",
      cantonese: "zh-HK",
      "traditional chinese": "zh-TW",
      "simplified chinese": "zh",
      "portuguese (brazil)": "pt-BR",
      "portuguese (portugal)": "pt-PT",
      "spanish (latin america)": "es-419",
      "english (australia)": "en-AU",
      "english (india)": "en-IN",
      "english (new zealand)": "en-NZ",
      "english (united kingdom)": "en-GB",
      "french (canada)": "fr-CA",
      "german (switzerland)": "de-CH",
      "hindi (latin)": "hi-Latn",
      "modern greek": "el",
      tamasheq: "tmh",
    };

    const normalizedName = languageName.toLowerCase();
    return commonMappings[normalizedName] || "en";
  };

  // Get available languages from translation languages (only from eventData)
  const getAvailableLanguages = () => {
    // Always return all supported languages instead of relying on recap-settings
    return SUPPORTED_LANGUAGES.map((lang) => ({
      name: lang.name,
      code: lang.code,
      originalName: lang.name,
      isNovaSupported: true, // All languages in SUPPORTED_LANGUAGES are supported
      novaSupport: lang.novaSupport,
    }));
  };

  const isNovaSupported = (languageCode) => {
    const languageInfo = SUPPORTED_LANGUAGES.find(
      (lang) => lang.code === languageCode
    );
    return languageInfo ? true : false;
  };

  const getNovaModelForLanguage = (languageCode) => {
    const languageInfo = SUPPORTED_LANGUAGES.find(
      (lang) => lang.code === languageCode
    );
    return languageInfo ? languageInfo.novaSupport : null;
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    console.log("Creating socket connection");
    // Use local server for testing, fallback to environment variable
    const baseurl =
      import.meta.env.VITE_LIVE_TRANSCRIPTION_SERVER_URL ||
      "http://localhost:3002";
    const newSocket = io(baseurl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setSocketConnected(true);

      // Join room if sessionId is available
      if (selectedSessionId) {
        console.log("Joining room with session ID:", selectedSessionId);
        newSocket.emit("join-room", selectedSessionId);
        console.log("Joined room:", selectedSessionId);
      }
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setSocketConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
      setSocketConnected(false);
    });

    // Auto-reconnect logic
    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setSocketConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, []); // Only create socket once

  // Initialize Translation Socket.IO connection
  useEffect(() => {
    console.log("Translation socket useEffect triggered:", {
      translationEnabled,
    });

    if (!translationEnabled) {
      // Clean up translation socket if translation is disabled
      if (translationSocket) {
        console.log("Cleaning up translation socket - translation disabled");
        translationSocket.close();
        setTranslationSocket(null);
        setTranslationSocketConnected(false);
      }
      return;
    }

    console.log("Creating translation socket connection");
    // Use translation server URL, fallback to environment variable
    const translationServerUrl =
      import.meta.env.VITE_TRANSLATION_SERVER_URL || "http://localhost:3003";
    console.log("Translation server URL:", translationServerUrl);

    const newTranslationSocket = io(translationServerUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
    });
    setTranslationSocket(newTranslationSocket);

    newTranslationSocket.on("connect", () => {
      console.log("Connected to translation server");
      setTranslationSocketConnected(true);

      // Join translation room if sessionId is available
      if (selectedSessionId) {
        const translationRoomId = `${selectedSessionId}+translation`;
        console.log("Joining translation room:", translationRoomId);
        newTranslationSocket.emit("join-room", translationRoomId);
        console.log("Joined translation room:", translationRoomId);
      } else {
        console.log("No sessionId available for translation room");
      }
    });

    newTranslationSocket.on("disconnect", () => {
      console.log("Disconnected from translation server");
      setTranslationSocketConnected(false);
    });

    newTranslationSocket.on("error", (error) => {
      console.error("Translation socket error:", error);
      setTranslationSocketConnected(false);
    });

    newTranslationSocket.on("connect_error", (error) => {
      console.error("Translation connection error:", error);
      console.error("Translation connection error details:", {
        message: error.message,
        type: error.type,
        description: error.description,
      });
      setTranslationSocketConnected(false);
    });

    // Handle available languages from translation server
    newTranslationSocket.on("available-languages", (languages) => {
      console.log("Received available translation languages:", languages);
      setAvailableTranslationLanguages(languages);
    });

    return () => {
      newTranslationSocket.close();
    };
  }, [translationEnabled, selectedSessionId]); // Recreate when translation is enabled/disabled

  // Join translation room when sessionId changes
  useEffect(() => {
    if (translationSocket && translationSocketConnected && selectedSessionId) {
      const translationRoomId = `${selectedSessionId}+translation`;
      console.log(
        "Joining translation room with session ID:",
        translationRoomId
      );
      translationSocket.emit("join-room", translationRoomId);
      console.log("Joined translation room:", translationRoomId);
    }
  }, [translationSocket, translationSocketConnected, selectedSessionId]);

  // Join room when sessionId changes
  useEffect(() => {
    if (socket && selectedSessionId) {
      console.log("Joining room with session ID:", selectedSessionId);
      socket.emit("join-room", selectedSessionId);
      console.log("Joined room:", selectedSessionId);
    } else {
      console.log("Cannot join room:", {
        socket: !!socket,
        selectedSessionId,
        socketConnected,
      });
    }
  }, [socket, selectedSessionId, socketConnected]);

  // Initialize component
  useEffect(() => {
    console.log("LiveTest props:", props);

    if (props.openData && props.openData.data && props.openData.data._id) {
      setEventId(props.openData.data._id);
    }
  }, [props]);

  // Fetch event data and translation languages
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) return;

      try {
        setLoading(true);
        const response = await getData(
          { event: eventId },
          "instarecap-setting"
        );

        if (
          response.status === 200 &&
          response.data.response &&
          response.data.response.length > 0
        ) {
          const eventData = response.data.response[0];
          setTranslationLanguages(eventData.translationLanguages || []);

          // Set initial language
          const availableLanguagesForInit = getAvailableLanguages();
          if (availableLanguagesForInit.length > 0) {
            setSelectedLanguage(availableLanguagesForInit[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
        setError("Failed to fetch event data");
        toast.error("Failed to fetch event data");
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  // Auto-connect when component mounts or when session changes
  useEffect(() => {
    if (selectedLanguage && (eventId || selectedSessionId)) {
      // Auto-connect logic can be added here if needed
      console.log("Auto-connect triggered:", {
        selectedLanguage,
        eventId,
        selectedSessionId,
      });
    }
  }, [selectedLanguage, eventId, selectedSessionId]);

  // Handle recording completion - defined before useTranscriptionService
  const handleRecordingComplete = (recordingBlob) => {
    console.log("Recording completed, blob size:", recordingBlob.size);
    setRecordingBlob(recordingBlob);
    setShowSaveModal(true);
  };

  // Use transcription service
  console.log("Calling useTranscriptionService with:", {
    language: selectedLanguage?.code || "en-US",
    eventId,
    selectedSessionId,
    socket: !!socket,
    translationEnabled,
    translationSocket: !!translationSocket,
    translationSocketConnected,
  });

  // Debug translation state
  console.log("Translation state in main component:", {
    translationEnabled,
    translationSocket: !!translationSocket,
    translationSocketConnected,
    selectedSessionId,
  });

  // Get target languages for translation - prioritize languages from translation server, then event data, then hardcoded
  const availableLanguagesForTranslation = availableTranslationLanguages && availableTranslationLanguages.length > 0
    ? availableTranslationLanguages
    : translationLanguages && translationLanguages.length > 0
    ? translationLanguages
        .filter(lang => lang && lang.trim() !== "") // Filter out empty strings
        .map(lang => {
          const code = convertLanguageNameToCode(lang);
          return code ? { code, name: lang } : null;
        })
        .filter(lang => lang !== null) // Remove any failed conversions
    : getAvailableLanguages(); // Final fallback to hardcoded languages

  console.log("Translation language sources:", {
    fromTranslationServer: availableTranslationLanguages,
    fromEventData: translationLanguages,
    finalSelected: availableLanguagesForTranslation,
    priority: availableTranslationLanguages && availableTranslationLanguages.length > 0 
      ? "Translation Server" 
      : translationLanguages && translationLanguages.length > 0 
      ? "Event Data" 
      : "Hardcoded Fallback",
    languageConversion: translationLanguages && translationLanguages.length > 0 
      ? translationLanguages.map(lang => ({
          original: lang,
          converted: convertLanguageNameToCode(lang)
        }))
      : "No event languages"
  });
  
  const targetLanguagesForTranslation = availableLanguagesForTranslation
    .filter(
      (lang) => lang.code !== (selectedLanguage?.code || "en-US").split("-")[0]
    ) // Exclude source language
    .map((lang) => lang.code);

  console.log("Translation target languages:", {
    availableLanguages: availableLanguagesForTranslation,
    targetLanguages: targetLanguagesForTranslation,
    selectedLanguage: selectedLanguage?.code,
    translationEnabled,
  });

  const {
    isRecording,
    connectionStatus,
    transcriptionResults,
    interimText,
    error: transcriptionError,
    startTranscription,
    stopTranscription,
    clearTranscription,
    serviceProvider,
    isNovaSupported: currentLanguageSupported,
    currentRoomId,
  } = useTranscriptionService(
    selectedLanguage?.code || "en-US",
    eventId,
    selectedSessionId,
    socket,
    setSocketConnected,
    handleRecordingComplete,
    translationEnabled,
    translationSocket,
    translationSocketConnected,
    getNovaModelForLanguage(selectedLanguage?.code || "en-US"),
    targetLanguagesForTranslation
  );

  // Debug: Log the room ID being used
  useEffect(() => {
    console.log("LiveTest - Current room ID:", currentRoomId);
    console.log("LiveTest - Selected session ID:", selectedSessionId);
    console.log("LiveTest - Event ID:", eventId);
    console.log("LiveTest - Hook parameters:", {
      language: selectedLanguage?.code || "en-US",
      eventId: eventId,
      selectedSessionId: selectedSessionId,
    });
  }, [currentRoomId, selectedSessionId, eventId, selectedLanguage]);

  // Handle language selection
  const handleLanguageSelect = (option) => {
    const selected = availableLanguagesForUI.find(
      (lang) => lang.code === option.id
    );
    setSelectedLanguage(selected);
    if (isRecording) {
      stopTranscription();
    }
  };

  // Handle session selection
  const handleSessionSelect = (option) => {
    console.log("Session selected:", option);
    console.log(
      "Setting session ID to:",
      option?.id || option?.value || option
    );
    setSelectedSessionId(option?.id || option?.value || option);
    // The room ID will be updated automatically via the useEffect
  };

  // Handle start recording
  const handleStartRecording = async () => {
    console.log("Start recording clicked");
    console.log("Selected language:", selectedLanguage);
    console.log("Current language supported:", currentLanguageSupported);
    console.log("Current room ID:", currentRoomId);

    if (!selectedLanguage) {
      toast.error("Please select a language first");
      return;
    }

    if (!currentLanguageSupported) {
      setMessage({
        type: 1,
        content: `Language "${selectedLanguage.name}" is not supported by Nova. Please select a supported language.`,
        icon: "warning",
        title: "Language Not Supported",
      });
      return;
    }

    try {
      console.log("Starting transcription...");

      // Update session live status
      if (selectedSessionId) {
        try {
          await putData(
            {
              id: selectedSessionId,
              isLive: true,
              liveMethod: "Nova",
            },
            "sessions"
          );
          console.log("Session live status updated to true");
        } catch (error) {
          console.error("Failed to update session live status:", error);
          // Continue with recording even if session update fails
        }
      }

      await startTranscription();
      console.log("Transcription started successfully");
      toast.success("Recording started successfully");
    } catch (error) {
      console.error("Failed to start transcription:", error);
      toast.error("Failed to start recording");
    }
  };

  // Handle stop recording
  const handleStopRecording = async () => {
    try {
      // Update session live status
      if (selectedSessionId) {
        try {
          await putData(
            {
              id: selectedSessionId,
              isLive: false,
            },
            "sessions"
          );
          console.log("Session live status updated to false");
        } catch (error) {
          console.error("Failed to update session live status:", error);
          // Continue with stopping recording even if session update fails
        }
      }

      stopTranscription();
      toast.success("Recording stopped");
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast.error("Failed to stop recording");
    }
  };

  // Handle clear transcription
  const handleClearTranscription = () => {
    clearTranscription();
    toast.success("Transcription cleared");
  };

  // Handle save recording
  const handleSaveRecording = async () => {
    if (!recordingBlob) {
      toast.error("No recording available to save");
      return;
    }

    setIsUploadingRecording(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      const audioFile = new File(
        [recordingBlob],
        `live-recording-${Date.now()}.wav`,
        { type: "audio/wav" }
      );
      formData.append("audio", audioFile);
      formData.append("event", eventId);
      // formData.append("freeUpload", true);
      formData.append("session", selectedSessionId);

      const API_BASE_URL =
        import.meta.env.VITE_INSTARECAP_API ||
        "https://instarecap-app.ambitiousforest-1ab41110.centralindia.azurecontainerapps.io/api";

      const response = await axios.post(
        `${API_BASE_URL}/upload-audio`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      if (response.data.success) {
        toast.success("Recording saved successfully!");
        setShowSaveModal(false);
        setRecordingBlob(null);
        setUploadProgress(0);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error saving recording:", error);
      const errorMessage =
        error.response?.data?.message || "Error saving recording";
      toast.error(errorMessage);
    } finally {
      setIsUploadingRecording(false);
      setUploadProgress(0);
    }
  };

  // Handle discard recording
  const handleDiscardRecording = () => {
    setShowSaveModal(false);
    setRecordingBlob(null);
    toast.info("Recording discarded");
  };

  const availableLanguagesForUI = getAvailableLanguages();
  const languageOptions = availableLanguagesForUI.map((lang) => ({
    id: lang.code,
    value: `${lang.name}`,
    // ${
    //   lang.isNovaSupported
    //     ? ` → ${lang.novaSupport?.toUpperCase() || "Nova-3"}`
    //     : " → Not Supported"
    // }`,
  }
  ));

  if (loading) {
    return (
      <RowContainer className="data-layout">
        <Loader message="Loading event data..." />
      </RowContainer>
    );
  }

  if (error) {
    return (
      <RowContainer className="data-layout">
        <div className="text-center py-8">
          <GetIcon
            icon="alert"
            className="w-16 h-16 text-red-500 mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-text-main mb-2">
            Error Loading Event
          </h3>
          <p className="text-text-sub">{error}</p>
        </div>
      </RowContainer>
    );
  }

  return (
    <RowContainer className="data-layout">
      {/* Header */}
      <PageHeader
        title="Live Transcription"
        description="Real-time speech-to-text transcription."
        line={false}
      />

      {/* Action Panel */}
      <div className="flex items-center justify-between w-full flex-col gap-4">
        <div className="flex justify-between w-full md:flex-row flex-col items-center gap-3">
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-sub">Language:</span>
              <div className="w-64">
                <CustomSelect
                  apiType="JSON"
                  selectApi={languageOptions}
                  value={selectedLanguage?.code}
                  onSelect={handleLanguageSelect}
                  placeholder="Select language"
                  disabled={isRecording}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                {/* Translation Status */}
                {translationEnabled && (
                  <div className="flex items-center gap-2">
                    {/* <span className="text-sm font-medium text-text-sub">
                      Translation Socket:
                    </span> */}
                    {/* <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        translationSocketConnected
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {translationSocketConnected ? "Connected" : "Disconnected"}
                    </span> */}
                  </div>
                )}
              </div>
              {/* <div>
                {selectedLanguage && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-sub">
                        Session:
                      </span>
                      <div className="w-64">
                        <CustomSelect
                          value={selectedSessionId || ""}
                          placeholder="Select Session"
                          onSelect={handleSessionSelect}
                          apiType="API"
                          selectApi={`sessions/select?event=${eventId}`}
                          selectName="sessionId"
                          selectLabel="Session"
                          selectPlaceholder="Select Session"
                          selectOptions={[]}
                          disabled={isRecording}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div> */}
            </div>
          </div>
        </div>

        {/* Room Information */}
        {currentRoomId !== "" && (
          <div className="flex items-center gap-3">
            {/* <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-sub">
                Room ID:
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {currentRoomId}
              </span>
            </div> */}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full justify-end items-center gap-3">
          {currentRoomId !== "" && (
            <Button
              ClickEvent={handleStartRecording}
              isDisabled={
                isRecording || !selectedLanguage || !currentLanguageSupported
              }
              value="Start Recording"
              icon="mic"
              type="primary"
            />
          )}

          {currentRoomId !== "" && (
            <Button
              ClickEvent={handleStopRecording}
              isDisabled={!isRecording}
              value="Stop Recording"
              icon="square"
              type="secondary"
            />
          )}

          {currentRoomId !== "" && (
            <Button
              ClickEvent={handleClearTranscription}
              value="Clear"
              icon="trash"
              type="secondary"
            />
          )}

          {/* { currentRoomId !== '' && <Button 
              ClickEvent={() => {
                if (socket && selectedSessionId) {
                  console.log('Testing socket connection...');
                  socket.emit('transcription', {
                    roomId: selectedSessionId,
                    text: 'Test message from CMS',
                    timestamp: new Date()
                  });
                  console.log('Test message sent');
                } else {
                  console.log('Cannot send test message:', { socket: !!socket, selectedSessionId });
                }
              }}
              value="Test Socket"
              icon="send"
              type="secondary"
            />} */}

          {/* { currentRoomId !== '' && <Button 
              ClickEvent={() => {
                if (socket && selectedSessionId) {
                  console.log('Testing transcription sending...');
                  socket.emit('transcription', {
                    roomId: selectedSessionId,
                    text: 'Test transcription from CMS',
                    timestamp: new Date()
                  });
                  console.log('Test transcription sent');
                } else {
                  console.log('Cannot send test transcription:', { socket: !!socket, selectedSessionId });
                }
              }}
              value="Test Transcription"
              icon="mic"
              type="secondary"
            />} */}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mb-6">
        <StatusIndicator status={connectionStatus} />
      </div>

      {/* Error Display */}
      {transcriptionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <GetIcon icon="alert" />
            <span className="text-sm font-medium">
              Error: {transcriptionError}
            </span>
          </div>
        </div>
      )}

      {/* Live Transcription Display */}
      <div className="space-y-4   ">
        <div className="w-full  flex justify-center items-center">
          <button className="text-[14px]  border border-gray-200 rounded-md p-2  font-medium text-text-main mb-4">
            Live Transcription
          </button>
        </div>

        {/* Interim Results - Always visible when recording */}
        {isRecording && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-700 font-medium">
                  Live (Interim):
                </span>
              </div>
              <div className="flex items-center gap-2">
                {socketConnected && interimText && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    ✓ Broadcasting
                  </span>
                )}
                {!socketConnected && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    ✗ Not broadcasting
                  </span>
                )}
              </div>
            </div>
            <div className="text-text-main font-mono text-sm leading-relaxed min-h-[20px]">
              {interimText || "Listening..."}
            </div>
          </div>
        )}

        {/* Final Transcription Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-text-main">
              Final Transcriptions
            </h4>
            <span className="text-xs text-text-sub">
              {transcriptionResults.length} saved
            </span>
          </div>

          {transcriptionResults.length === 0 ? (
            <NoDataFound
              shortName="Transcriptions"
              icon="mic"
              addPrivilege={false}
              description="Start recording to see final transcriptions here"
            />
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-4">
              {transcriptionResults.map((result, index) => (
                <div
                  key={index}
                  className="p-4 bg-bg-white rounded-lg border border-stroke-soft shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-text-sub font-medium">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Final
                      </span>
                      <GetIcon
                        icon="check"
                        className="w-4 h-4 text-green-600"
                      />
                    </div>
                  </div>
                  <p className="text-text-main leading-relaxed">
                    {result.text}
                  </p>
                  <div className="mt-2 text-xs text-text-sub">
                    Language: {result.language} • Room: {result.roomId} •
                    Service:{" "}
                    {result.novaModel?.toUpperCase() || serviceProvider}
                    {socketConnected && (
                      <span className="ml-2 text-green-600">
                        ✓ Final broadcasted
                      </span>
                    )}
                    {!socketConnected && (
                      <span className="ml-2 text-red-600">
                        ✗ Not broadcasted (socket disconnected)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Component */}
      {message && (
        <Message
          type={message.type}
          content={message.content}
          icon={message.icon}
          title={message.title}
          onClose={() => setMessage(null)}
        />
      )}

      {/* Save Recording Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Recording</h3>
            <p className="mb-4 text-gray-600">
              Your recording has been completed. Would you like to save it to
              the event's audio library?
            </p>

            {isUploadingRecording && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Uploading...
                  </span>
                  <span className="text-sm text-gray-500">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleDiscardRecording}
                disabled={isUploadingRecording}
                className={`px-4 py-2 border rounded-lg hover:bg-gray-50 ${
                  isUploadingRecording ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Discard
              </button>
              <button
                onClick={handleSaveRecording}
                disabled={isUploadingRecording}
                className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${
                  isUploadingRecording ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUploadingRecording ? "Saving..." : "Save Recording"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RowContainer>
  );
};

export default LiveTest;
