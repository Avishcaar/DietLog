import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import '../styles/voice-input.css';

const VoiceInput = ({ onTranscript, disabled = false }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const [error, setError] = useState('');

    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;  // Changed to false - stop after getting speech
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setError('');
        };

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcriptPart + ' ';
                } else {
                    interim += transcriptPart;
                }
            }

            if (final) {
                const fullTranscript = (transcript + final).trim();
                setTranscript(fullTranscript);
                setInterimTranscript('');

                // Stop recognition and submit
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }

                // Submit after short delay to ensure state updates
                setTimeout(() => {
                    if (onTranscript && fullTranscript) {
                        onTranscript(fullTranscript);
                    }
                }, 500);
            } else {
                setInterimTranscript(interim);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);

            if (event.error === 'no-speech') {
                setError('No speech detected. Please try again.');
            } else if (event.error === 'not-allowed') {
                setError('Microphone access denied. Please allow microphone access.');
            } else if (event.error === 'network') {
                setError('Network error. Please check your connection.');
            } else {
                setError('An error occurred. Please try again.');
            }

            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        const currentTimeout = timeoutRef.current;
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (currentTimeout) {
                clearTimeout(currentTimeout);
            }
        };
    }, [transcript, onTranscript]);

    const handleStart = () => {
        if (!recognitionRef.current) return;

        setTranscript('');
        setInterimTranscript('');
        setError('');

        try {
            recognitionRef.current.start();
        } catch (err) {
            console.error('Error starting recognition:', err);
            setError('Failed to start recording. Please try again.');
        }
    };

    const handleStop = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setTranscript('');
        setInterimTranscript('');
    };

    const handleToggle = () => {
        if (isListening) {
            handleStop();
        } else {
            handleStart();
        }
    };

    if (!isSupported) {
        return (
            <div className="voice-not-supported">
                <AlertCircle size={18} />
                <span>Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.</span>
            </div>
        );
    }

    const displayText = transcript + (interimTranscript ? ' ' + interimTranscript : '');

    return (
        <div className="voice-input-container">
            <div className="voice-input-row">
                <button
                    className={`mic-button ${isListening ? 'recording' : ''}`}
                    onClick={handleToggle}
                    disabled={disabled}
                    type="button"
                    aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                >
                    {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                {isListening && (
                    <div className="voice-transcript">
                        {displayText ? (
                            <span className={`voice-transcript-text ${interimTranscript ? 'interim' : ''}`}>
                                {displayText}
                            </span>
                        ) : (
                            <div className="listening-indicator">
                                <span>Listening</span>
                                <div className="listening-dots">
                                    <div className="listening-dot"></div>
                                    <div className="listening-dot"></div>
                                    <div className="listening-dot"></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!isListening && !error && (
                <div className="voice-hint">
                    <span>Click for Voice Input</span>
                </div>
            )}

            {error && (
                <div className="voice-error">
                    {error}
                </div>
            )}
        </div>
    );
};

export default VoiceInput;
