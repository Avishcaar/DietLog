import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../Components/authContext';
import { vapi } from '../../lib/vapi.sdk';
import { configureHealthAssistant } from '../../lib/voiceConfig';
import API from '../../Components/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Container,
    Alert,
    Snackbar,
    Chip,
    CircularProgress,
} from '@mui/material';
import {
    Mic as MicIcon,
    MicOff as MicOffIcon,
    Phone as PhoneIcon,
    PhoneDisabled as PhoneDisabledIcon,
    History as HistoryIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import Card from '../../Components/ui/Card';
import './voiceCompanion.css';
import '../home.css';

const BracketCorners = () => (
    <>
        <span className="bracket-corner bracket-tl" aria-hidden="true" />
        <span className="bracket-corner bracket-tr" aria-hidden="true" />
        <span className="bracket-corner bracket-bl" aria-hidden="true" />
        <span className="bracket-corner bracket-br" aria-hidden="true" />
    </>
);

const CallStatus = {
    INACTIVE: 'INACTIVE',
    LOADING: 'LOADING',
    CONNECTING: 'CONNECTING',
    ACTIVE: 'ACTIVE',
    FINISHED: 'FINISHED',
};

export const VoiceCompanion = () => {
    const { email, loggedIn } = useAuth();
    const [callStatus, setCallStatus] = useState(CallStatus.INACTIVE);
    const [messages, setMessages] = useState([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isAISpeaking, setIsAISpeaking] = useState(false);
    const [userContext, setUserContext] = useState('');
    const [pastSessions, setPastSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [callStartTime, setCallStartTime] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('success');

    const messagesRef = useRef([]);
    const transcriptEndRef = useRef(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadUserContext = useCallback(async () => {
        try {
            const res = await API.get('/getVoiceContext', {
                params: { email },
            });
            setUserContext(res.data.context || '');
            setPastSessions(res.data.pastSessions || []);
        } catch (error) {
        }
    }, [email]);

    const saveVoiceSession = useCallback(async (transcript, duration) => {
        try {
            await API.post('/saveVoiceSession', {
                email,
                transcript,
                duration,
            });
            console.log('Voice session saved successfully');
        } catch (error) {
            console.error('Error saving voice session:', error);
            showNotification('Failed to save transcript', 'error');
        }
    }, [email]);

    useEffect(() => {
        if (loggedIn && email) {
            loadUserContext();
        }
    }, [loggedIn, email, loadUserContext]);

    useEffect(() => {
        const onCallStart = () => {
            console.log('Call started');
            setCallStatus(CallStatus.ACTIVE);
            setCallStartTime(Date.now());
            showNotification('Call connected! Start speaking...', 'success');
        };

        const onCallEnd = async () => {
            console.log('Call ended');
            setCallStatus(CallStatus.FINISHED);
            setIsAISpeaking(false);

            const duration = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;

            if (messagesRef.current.length > 0) {
                await saveVoiceSession(messagesRef.current, duration);
            }

            showNotification('Call ended. Transcript saved!', 'info');

            setTimeout(() => loadUserContext(), 1000);
        };

        const onMessage = (msg) => {
            console.log('Message received:', msg);

            if (msg.type === 'transcript' && msg.transcriptType === 'final') {
                const newMsg = {
                    role: msg.role,
                    content: msg.transcript,
                    timestamp: new Date().toISOString(),
                };

                setMessages((prev) => {
                    const updated = [...prev, newMsg];
                    messagesRef.current = updated;
                    return updated;
                });
            }
        };

        const onSpeechStart = () => {
            console.log('AI started speaking');
            setIsAISpeaking(true);
        };

        const onSpeechEnd = () => {
            console.log('AI stopped speaking');
            setIsAISpeaking(false);
        };

        const onError = (error) => {
            console.error('VAPI Error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            const errorMsg = error?.error?.message || error?.message || 'Something went wrong';
            showNotification(`Error: ${errorMsg}`, 'error');
            setCallStatus(CallStatus.INACTIVE);
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('error', onError);
        };
    }, [callStartTime, email, loadUserContext, saveVoiceSession]);



    const handleStartCall = async () => {

        try {
            setCallStatus(CallStatus.LOADING);
            setMessages([]);
            messagesRef.current = [];

            const assistant = configureHealthAssistant(userContext);

            console.log('Starting call with assistant config:', assistant);

            await vapi.start(assistant);
            setCallStatus(CallStatus.CONNECTING);
        } catch (error) {
            console.error('Error starting call:', error);
            showNotification('Failed to start call. Check microphone permissions.', 'error');
            setCallStatus(CallStatus.INACTIVE);
        }
    };

    const handleEndCall = () => {
        try {
            vapi.stop();
        } catch (error) {
            console.error('Error ending call:', error);
        }
    };

    const toggleMute = () => {
        const newMuteState = !isMuted;
        vapi.setMuted(newMuteState);
        setIsMuted(newMuteState);
        showNotification(newMuteState ? 'Microphone muted' : 'Microphone unmuted', 'info');
    };

    const showNotification = (message, severity = 'info') => {
        setAlertMessage(message);
        setAlertSeverity(severity);
        setShowAlert(true);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="page-container-glass voice-companion-container">
            <div className="telemetry-grid-canvas" aria-hidden="true" />
            <div className="telemetry-ambient-radial" aria-hidden="true" />
            <Container maxWidth="lg" className="glass-content-wrapper" style={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="voice-header"
                >
                    <div className="header-content">
                        <div className="telemetry-pill-mono" style={{ margin: '0 auto 1rem', display: 'inline-flex' }}>
                            <span className="telemetry-dot-pulse" />
                            <span>AI ADVISOR • REAL-TIME VOICE TELEMETRY</span>
                        </div>
                        <h1 className="voice-title-oswald">
                            VOICE COMPANION<span className="emerald-dot">.</span>
                        </h1>
                        <p className="page-subtitle">
                            Real-time natural voice consultation for your nutrition, macros, and metabolic wellness.
                        </p>
                    </div>
                </motion.div>

                <div className="voice-layout">
                    <div className="call-section">
                        <Card variant="glass" className="call-card bracket-telemetry-panel">
                            <BracketCorners />
                            <div className="voice-visualizer">
                                <AnimatePresence mode="wait">
                                    {callStatus === CallStatus.INACTIVE && (
                                        <motion.div
                                            key="idle"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                            className="avatar-container"
                                        >
                                            <img
                                                src="/avatar-idle.png"
                                                alt="Dr. Sarah - Ready"
                                                className="avatar-image breathing"
                                            />
                                            <p className="avatar-status">Ready to start conversation</p>
                                        </motion.div>
                                    )}

                                    {(callStatus === CallStatus.LOADING || callStatus === CallStatus.CONNECTING) && (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="avatar-container"
                                        >
                                            <div className="loading-overlay">
                                                <CircularProgress size={60} />
                                                <p className="avatar-status">
                                                    {callStatus === CallStatus.LOADING ? 'Initializing' : 'Connecting...'}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {callStatus === CallStatus.ACTIVE && !isAISpeaking && (
                                        <motion.div
                                            key="listening"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                            className="avatar-container"
                                        >
                                            <img
                                                src="/avatar-listening.png"
                                                alt="Dr. Sarah - Listening"
                                                className="avatar-image listening"
                                            />
                                            <p className="avatar-status listening">Listening...</p>
                                        </motion.div>
                                    )}

                                    {callStatus === CallStatus.ACTIVE && isAISpeaking && (
                                        <motion.div
                                            key="speaking"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                            className="avatar-container"
                                        >
                                            <img
                                                src="/avatar-speaking.png"
                                                alt="Dr. Sarah - Speaking"
                                                className="avatar-image speaking"
                                            />
                                            <p className="avatar-status speaking">Dr. Sarah is speaking...</p>
                                        </motion.div>
                                    )}

                                    {callStatus === CallStatus.FINISHED && (
                                        <motion.div
                                            key="finished"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="avatar-container"
                                        >
                                            <img
                                                src="/avatar-idle.png"
                                                alt="Dr. Sarah - Finished"
                                                className="avatar-image breathing"
                                            />
                                            <p className="avatar-status">Call ended</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="call-controls">
                                {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED ? (
                                    <button
                                        onClick={handleStartCall}
                                        className="btn-call btn-start"
                                        disabled={callStatus === CallStatus.LOADING}
                                    >
                                        <PhoneIcon />
                                        <span>Start Conversation</span>
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={toggleMute}
                                            className={`btn-call btn-mute ${isMuted ? 'muted' : ''}`}
                                            disabled={callStatus !== CallStatus.ACTIVE}
                                        >
                                            {isMuted ? <MicOffIcon /> : <MicIcon />}
                                        </button>
                                        <button
                                            onClick={handleEndCall}
                                            className="btn-call btn-end"
                                        >
                                            <PhoneDisabledIcon />
                                            <span>End Call</span>
                                        </button>
                                    </>
                                )}
                            </div>

                            {messages.length > 0 && (
                                <div className="transcript-container">
                                    <h3 className="transcript-title">Live Transcript</h3>
                                    <div className="transcript-messages">
                                        {messages.map((msg, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`message ${msg.role}`}
                                            >
                                                <div className="message-content">
                                                    <span className="message-role">
                                                        {msg.role === 'user' ? 'You' : 'Dr. Sarah'}
                                                    </span>
                                                    <p>{msg.content}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                        <div ref={transcriptEndRef} />
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="history-section">
                        <Card variant="glass" className="history-card bracket-telemetry-panel">
                            <BracketCorners />
                            <div className="history-header">
                                <HistoryIcon />
                                <h3>Past Sessions</h3>
                            </div>

                            {pastSessions.length === 0 ? (
                                <div className="empty-history">
                                    <p>No past conversations yet</p>
                                    <p className="empty-hint">Start your first session!</p>
                                </div>
                            ) : (
                                <div className="history-list">
                                    {pastSessions.map((session, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`history-item ${selectedSession === session ? 'selected' : ''}`}
                                            onClick={() => setSelectedSession(session)}
                                        >
                                            <div className="history-item-header">
                                                <span className="history-date">
                                                    {formatDate(session.session_date)}
                                                </span>
                                                <Chip
                                                    label={formatDuration(session.duration_seconds)}
                                                    size="small"
                                                    className="duration-chip"
                                                />
                                            </div>
                                            <p className="history-preview">
                                                {session.transcript[0]?.content.substring(0, 60)}...
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </Container>

            <AnimatePresence>
                {selectedSession && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay"
                        onClick={() => setSelectedSession(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="modal-content bracket-telemetry-panel"
                        >
                            <BracketCorners />
                            <div className="modal-header">
                                <div className="modal-title-group">
                                    <h3 className="modal-title">Conversation History</h3>
                                    <span className="modal-subtitle">
                                        {formatDate(selectedSession.session_date)} • {formatDuration(selectedSession.duration_seconds)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedSession(null)}
                                    className="modal-close-btn"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <div className="modal-body">
                                {selectedSession.transcript.map((msg, idx) => (
                                    <div key={idx} className={`message ${msg.role}`}>
                                        <div className="message-content">
                                            <span className="message-role">
                                                {msg.role === 'user' ? 'You' : 'Dr. Sarah'}
                                            </span>
                                            <p>{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Snackbar
                open={showAlert}
                autoHideDuration={4000}
                onClose={() => setShowAlert(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowAlert(false)}
                    severity={alertSeverity}
                    sx={{ width: '100%' }}
                >
                    {alertMessage}
                </Alert>
            </Snackbar>
        </div>
    );
};
