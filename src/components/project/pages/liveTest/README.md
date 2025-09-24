# Live Transcription Test

## Overview
The LiveTest component provides real-time speech-to-text transcription functionality with integration to the live-transcription-server for broadcasting transcriptions to multiple receivers.

## Features

### 🎤 Real-time Transcription
- **Deepgram Nova-3**: High-accuracy speech recognition
- **Language Support**: Automatic detection of Nova-supported languages
- **Interim Results**: Real-time display of transcription progress
- **Final Results**: Saved transcriptions with timestamps

### 🌐 Live Broadcasting
- **Socket.IO Integration**: Real-time communication with live-transcription-server
- **Room-based Broadcasting**: Transcriptions sent to specific rooms
- **Multi-receiver Support**: Multiple clients can receive transcriptions simultaneously
- **Connection Status**: Real-time socket connection monitoring

### 🎯 Language Management
- **Event-based Languages**: Fetches available languages from event settings
- **Nova Support Detection**: Automatically identifies Nova-supported languages
- **Service Selection**: Uses Nova for supported languages, fallback for others
- **Session Integration**: Optional session-based room management

## Technical Implementation

### Frontend Components
- **useTranscriptionService Hook**: Manages transcription logic and Socket.IO connection
- **StatusIndicator**: Visual connection status display
- **Language Selection**: Native HTML select with Nova support indicators
- **Session Selector**: CustomSelect for session-based room management

### Backend Integration
- **API Endpoints**: Saves transcriptions to database via `live-transcription/save`
- **Socket.IO Client**: Sends transcriptions to live-transcription-server
- **Error Handling**: Comprehensive error management and user feedback

### Real-time Communication Flow
```
LiveTest Component → Socket.IO → live-transcription-server → live-transcription-receiver
```

## Setup Requirements

### 1. Live Transcription Server
Start the live-transcription-server on port 3001:
```bash
cd test_transcription/live-transcription-server
npm install
npm start
```

### 2. Dependencies
Ensure socket.io-client is installed:
```bash
npm install socket.io-client
```

### 3. Environment Variables
Set up Deepgram API key:
```env
VITE_DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

## Usage Flow

### 1. Component Initialization
- Fetches event data and translation languages
- Establishes Socket.IO connection to live-transcription-server
- Joins room based on session ID or event ID

### 2. Language Selection
- Select from available translation languages
- Automatic Nova support detection
- Service indicator shows supported/unsupported status

### 3. Session Management (Optional)
- Select session for room-based transcription
- Uses session ID as room identifier
- Falls back to event ID if no session selected

### 4. Recording Process
- **Start Recording**: Begins transcription and Socket.IO broadcasting
- **Stop Recording**: Stops transcription and closes connections
- **Clear**: Resets local transcription history

### 5. Real-time Broadcasting
- Final transcriptions sent to live-transcription-server
- Server broadcasts to all receivers in the same room
- Connection status displayed in real-time

## API Endpoints

### Backend Storage
- `POST /live-transcription/save`: Saves transcription to database
- `GET /instarecap-setting`: Fetches event translation languages
- `GET /sessions/select`: Fetches available sessions

### Socket.IO Events
- `join-room`: Joins transcription room
- `transcription`: Sends transcription data to server
- `new-transcription`: Receives broadcasted transcriptions (receiver)

## Error Handling

### Connection Issues
- Socket.IO connection timeout handling
- Automatic reconnection attempts
- User-friendly error messages

### Transcription Errors
- Deepgram API error handling
- Microphone permission management
- Language support validation

### Network Issues
- Graceful degradation when server unavailable
- Local transcription storage as backup
- Connection status indicators

## Performance Considerations

### Optimization
- **Interim Results**: Real-time display without server round-trip
- **Final Results**: Only final transcriptions sent to server
- **Connection Pooling**: Efficient Socket.IO connection management

### Scalability
- **Room-based Isolation**: Separate rooms for different events/sessions
- **Server Broadcasting**: Efficient one-to-many communication
- **Memory Management**: Automatic cleanup of old transcriptions

## Integration with Other Components

### Live Transcription Receiver
The live-transcription-receiver can receive transcriptions from this component:
1. Start live-transcription-server
2. Use same room ID in receiver
3. Real-time transcription display

### EventHex CMS Integration
- **Event Context**: Uses event ID for room management
- **Session Management**: Optional session-based transcription
- **Design System**: Follows EventHex UI patterns

## Future Enhancements

### Planned Features
- **Multi-language Support**: Simultaneous transcription in multiple languages
- **Speaker Identification**: Identify different speakers
- **Transcription Analytics**: Usage statistics and insights
- **Export Functionality**: Export transcriptions in various formats

### Technical Improvements
- **WebRTC Integration**: Direct peer-to-peer communication
- **Offline Support**: Local transcription when server unavailable
- **Advanced Filtering**: Filter transcriptions by speaker, time, etc.

## Troubleshooting

### Common Issues
1. **Socket Connection Failed**: Check if live-transcription-server is running on port 3001
2. **Microphone Access**: Ensure browser permissions for microphone
3. **Deepgram API**: Verify VITE_DEEPGRAM_API_KEY is set correctly
4. **Language Support**: Check if selected language is Nova-supported

### Debug Information
- Console logs show connection status and transcription flow
- Network tab shows Socket.IO communication
- Error messages provide specific issue details

## Security Considerations

### Data Privacy
- **Local Processing**: Audio processed locally before sending
- **Room Isolation**: Transcriptions isolated by room ID
- **Session Management**: Optional session-based access control

### API Security
- **Environment Variables**: API keys stored securely
- **CORS Configuration**: Proper cross-origin request handling
- **Input Validation**: Sanitized transcription data

This component provides a complete real-time transcription solution with live broadcasting capabilities, making it ideal for events, meetings, and presentations where multiple participants need access to live transcriptions. 