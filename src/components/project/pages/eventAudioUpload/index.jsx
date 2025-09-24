import { useState, useEffect, useRef } from 'react';
import { getData } from '../../../../backend/api';
import axios from 'axios';
import UploadAudio from '../event/uploadAudio';
import PopupView from "../../../core/popupview";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { SubPageHeader } from '../../../core/input/heading';
import { ListTableSkeleton } from '../../../core/loader/shimmer';
import { Button } from '../../../core/elements';

const API_BASE_URL = import.meta.env.VITE_INSTARECAP_API || "https://instarecap-app.ambitiousforest-1ab41110.centralindia.azurecontainerapps.io/api";

const EventAudioUpload = (props) => {
  const [recordings, setRecordings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showAudioUpload, setShowAudioUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mode, setMode] = useState('upload');
  const [audioFile, setAudioFile] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [translatedLanguages, setTranslatedLanguages] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/audio-details?event=${props.openData.data._id}`);
        if (response.data.success) {
          const formattedRecordings = response.data.audio.map(recording => ({
            id: recording._id,
            title: recording.originalFileName,
            status: recording.status,
            session: recording.session?.title || null,
            progress: recording.processingProgress?.percentComplete || 0,
            error: recording.processingProgress?.error || null
          }));
          setRecordings(formattedRecordings);
        }
      } catch (error) {
        console.error("Error fetching recordings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecordings();
  }, [props]);

  useEffect(() => {
    const fetchTranslatedLanguages = async () => {
      try {
        const response = await getData({event : props.openData.data._id}, "instarecap-setting");
        if(response.data.success) {
            console.log("Translated languages:", response.data.response[0].translationLanguages);
          setTranslatedLanguages(response.data.response[0].translationLanguages);
        }
      } catch (error) {
        console.error("Error fetching translated languages:", error);
        toast.error("Error fetching translated languages, error: " + error);
      }
    };
    fetchTranslatedLanguages();
  }, [props]);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const response = await getData({event: props.openData.data._id}, "sessions/select");
        setSessions(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setSessions([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, [props]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setRecordedAudio(url);
        setAudioFile(new File([blob], 'recording.wav', { type: 'audio/wav' }));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Error starting recording:", err);
      setUploadError({ message: "Could not access microphone" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('event', props.openData.data._id);
    formData.append('freeUpload', true);
    try {
      const response = await axios.post(`${API_BASE_URL}/upload-free-audio`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        const updatedRecordings = [...recordings];
        updatedRecordings.unshift({
          id: response.data.audio._id,
          title: file.name,
          status: 'queued',
          progress: 0
        });
        setRecordings(updatedRecordings);
        toast.success('Audio uploaded successfully!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error uploading file';
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const mapSession = async (sessionId) => {
    if (selectedRecording && sessionId) {
      try {
        let response;
        if(sessionId === 'none') {
            response = await axios.post(`${API_BASE_URL}/audio/map-to-none`, {
                audioId: selectedRecording.id
            });
        } else {
            response = await axios.post(`${API_BASE_URL}/audio/map-session`, {
                audio: selectedRecording.id,
                session: sessionId
            });
        }
        if (response.data.success) {
          const selectedSessionChanged = sessions.find(s => s.id === sessionId);
          const sessionValue = selectedSessionChanged ? selectedSessionChanged.value : '';

          setRecordings(prev => prev.map(rec => 
            rec.id === selectedRecording.id 
              ? {...rec, session: sessionValue}
              : rec
          ));
          toast.success('Session mapped successfully!');
        }
      } catch (error) {
        console.error("Error mapping session:", error);
        toast.error('Failed to map session, error: ' + error);
      }
      setShowModal(false);
    }
  };

  const handleRecordedAudioUpload = () => {
    if (!audioFile) {
      toast.error('No recording available to upload');
      return;
    }
    handleFileUpload(audioFile);
    setRecordedAudio(null);
    setAudioFile(null);
    setShowUploadOptions(false);
  };

  const handleDelete = async (recordingId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/audio?audioId=${recordingId}`);
      if (response.data.success) {
        setRecordings(prev => prev.filter(rec => rec.id !== recordingId));
        toast.success('Recording deleted successfully!');
      }
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast.error('Failed to delete recording: ' + (error.response?.data?.message || error.message));
    }
    setShowDeleteModal(false);
    setRecordingToDelete(null);
  };

  if(isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="container mx-auto  w-full">
          <div className="p-4">
            <ListTableSkeleton viewMode="simple" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="container mx-auto  w-full">

        <div className='w-full flex mb-5 justify-between items-center'>

        {/* <h1 className="text-[22px] font-medium">Event Session Transcriber</h1> */} 
        <div className=''>

        <SubPageHeader
          title="Event Session Transcriber"
          line={false}
          description='Recordings'
          />
          </div>
         {/* Show Upload Button */}
         {!showUploadOptions && (
          <div className="flex justify-center ">
            <Button
              value="New Recording"
              icon="add"
              ClickEvent={() => setShowUploadOptions(true)}
              type="primary"
              align="bg-primary-base hover:bg-primary-dark text-white"
            />
          </div>
        )}

        </div>
        
       
        {/* Upload/Record Section - Only show when showUploadOptions is true */}
        {showUploadOptions && (
          <>
            <div className="flex pt-4 gap-3 justify-center mb-8">
              <div className="flex gap-3 p-1 bg-gray-100 rounded-xl">
                <Button
                  value="Upload Audio"
                  ClickEvent={() => setMode("upload")}
                  type="secondary"
                  align={`px-8 py-2.5 rounded-lg font-medium transition-all duration-200 ${mode === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                />
                <Button
                  value="Record Audio"
                  ClickEvent={() => setMode("record")}
                  type="secondary"
                  align={`px-8 py-2.5 rounded-lg font-medium transition-all duration-200 ${mode === "record" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                />
              </div>
            </div>

            <div className="space-y-6 p-6 mx-auto max-w-2xl">
              {mode === "upload" ? (
                <div className="space-y-4">
                  <input type="file" id="audio-upload" accept="audio/*" onChange={(e) => handleFileUpload(e.target.files[0])} className="hidden" />

                  {isUploading ? (
                    <div className="space-y-6">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Uploading Audio</h3>
                        <p className="text-sm text-gray-500">Please wait while we upload your file</p>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Uploading...</span>
                          <span className="text-sm text-gray-500">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="audio-upload"
                      className="block w-full py-12 px-6 text-center bg-gray-50 
                        rounded-xl border-2 border-dashed border-gray-200 cursor-pointer
                        hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-900">Click to upload audio</p>
                          <p className="text-sm text-gray-500">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">MP3, WAV, or M4A up to 10MB</p>
                      </div>
                    </label>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium 
                          hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={isPaused ? resumeRecording : pauseRecording}
                          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium 
                            hover:bg-gray-200 transition-colors duration-200"
                        >
                          {isPaused ? "Resume" : "Pause"}
                        </button>
                        <button
                          onClick={stopRecording}
                          className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium 
                            hover:bg-red-600 transition-colors duration-200"
                        >
                          Stop Recording
                        </button>
                      </>
                    )}
                  </div>

                  {recordedAudio && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                      <p className="text-sm text-gray-600 mb-2">Preview recording</p>
                      <audio controls src={recordedAudio} className="w-full" />
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={handleRecordedAudioUpload}
                          disabled={isUploading}
                          className={`px-6 py-3 bg-green-500 text-white rounded-lg font-medium 
                            hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2
                            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isUploading ? (
                            <>
                              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Upload Recording
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add Cancel button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => {
                  setShowUploadOptions(false);
                  setMode('upload');
                  setRecordedAudio(null);
                  setAudioFile(null);
                }}
                className="px-6 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Recordings List */}
        <div>
          {/* <h1 className="text-[22px] font-medium mb-4">Recordings</h1> */}
          <div className="space-y-4">
            {recordings.map(recording => (
              <div key={recording.id} className="p-4 border rounded-lg shadow-md bg-white">
                <div className="flex justify-between flex-wrap">
                  <div>
                    <h3 className="font-medium">{recording.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      recording.status === 'processed' 
                        ? 'bg-green-100 text-green-700'
                        : recording.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {recording.status === 'processed' ? 'Processed' : recording.status === 'failed' ? 'Failed' : 'Processing'}
                      {recording.status !== 'processed' && recording.progress > 0 && ` (${recording.progress}%)`}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t flex justify-between items-center flex-wrap">
                  <div>
                    <span className="text-sm font-medium">Session: </span>
                    <span className="text-sm text-gray-700">
                      {recording.session || 'Not mapped'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap mt-2 sm:mt-0">
                    {recording.session ? (
                      <button 
                        onClick={() => {
                          setSelectedRecording(recording);
                          setShowModal(true);
                        }}
                        className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
                      >
                        Re-map Session
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedRecording(recording);
                          setShowModal(true);
                        }}
                        className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
                      >
                        Map to Session
                      </button>
                    )}
                    
                    {recording.status === 'processed' && (
                      <button 
                        className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50" 
                        onClick={() => {
                          setSelectedRecording(recording);
                          setSelectedSession(recording.session);
                          setShowAudioUpload(true);
                        }}
                      >
                        View Transcript
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        setRecordingToDelete(recording);
                        setShowDeleteModal(true);
                      }}
                      className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Mapping Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Map Recording to Session</h3>
              <p className="mb-2 text-sm text-gray-600">
                Recording: {selectedRecording?.title}
              </p>
              
              <Select
                className="mb-4"
                classNamePrefix="select"
                options={[
                  { value: 'none', label: 'None' },
                  ...sessions.map(session => ({
                    value: session.id,
                    label: session.value
                  }))
                ]}
                onChange={(option) => setSelectedOption(option)}
                value={selectedOption}
                placeholder="Select a session"
                isClearable
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: 'white',
                    borderColor: '#e2e8f0',
                    '&:hover': {
                      borderColor: '#cbd5e1'
                    }
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: 'white'
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? '#f1f5f9' : 'white',
                    color: '#1e293b',
                    '&:hover': {
                      backgroundColor: '#f1f5f9'
                    }
                  })
                }}
              />
              
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setSelectedOption(null);
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    mapSession(selectedOption?.value);
                    setSelectedOption(null);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  Map to Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Delete Recording</h3>
              <p className="mb-4 text-gray-600">
                Are you sure you want to delete "{recordingToDelete?.title}"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setRecordingToDelete(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(recordingToDelete.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAudioUpload && (
        <PopupView
          itemTitle={{ name: "title", type: "text", collection: "" }}
          popupData={<UploadAudio {...props} data={{title: selectedRecording.session, _id: selectedRecording.id}} translatedLanguages={translatedLanguages} selectedAudio={selectedRecording.id} />}
          openData={{
            data: {
              _id: "print_preparation",
              title: "Upload Audio / " + selectedRecording?.title,
            },
          }}
          customClass={"large"}
          closeModal={() => setShowAudioUpload(false)}
        ></PopupView>
      )}
    </div>
  );
};

export default EventAudioUpload;
