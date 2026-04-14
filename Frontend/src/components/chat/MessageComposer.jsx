import { useEffect, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Smile, Paperclip, Mic, Send, Square } from 'lucide-react';
import { aiPrompts } from '@/data/aiPrompts';

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const MessageComposer = ({ isAI, disabled, draftText, onSend, onTyping, onUpload, onError, onDraftConsumed }) => {
  const [message, setMessage] = useState('');
  const [micState, setMicState] = useState('idle');
  const [micHint, setMicHint] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const selectionRef = useRef({ start: 0, end: 0 });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!draftText) return;
    setMessage(draftText);
    setTimeout(() => {
      inputRef.current?.focus();
      const length = draftText.length;
      inputRef.current?.setSelectionRange(length, length);
      selectionRef.current = { start: length, end: length };
    }, 0);
    onTyping(Boolean(draftText.trim()));
    onDraftConsumed?.();
  }, [draftText, onDraftConsumed, onTyping]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!emojiOpen) return;
      if (pickerRef.current?.contains(event.target)) return;
      if (inputRef.current?.contains(event.target)) return;
      setEmojiOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [emojiOpen]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    mediaRecorderRef.current?.stop?.();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const resetMic = () => {
    setMicState('idle');
    setMicHint('');
    recognitionRef.current = null;
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const focusInputAt = (position) => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(position, position);
      selectionRef.current = { start: position, end: position };
    });
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    setMessage('');
    setMicHint('');
    setEmojiOpen(false);
    onTyping(false);
    await onSend(trimmed);
    inputRef.current?.focus();
  };

  const handleChange = (event) => {
    const value = event.target.value;
    setMessage(value);
    selectionRef.current = {
      start: event.target.selectionStart ?? value.length,
      end: event.target.selectionEnd ?? value.length,
    };
    onTyping(Boolean(value.trim()));
  };

  const insertEmoji = (emoji) => {
    const { start, end } = selectionRef.current;
    const nextValue = `${message.slice(0, start)}${emoji}${message.slice(end)}`;
    const caret = start + emoji.length;
    setMessage(nextValue);
    onTyping(Boolean(nextValue.trim()));
    focusInputAt(caret);
    setEmojiOpen(false);
  };

  const startSpeechRecognition = async () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      onError?.(error?.name === 'NotAllowedError' ? 'Microphone permission was denied.' : 'Could not access your microphone.');
      return true;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setMicState('listening');
      setMicHint('Listening...');
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      const nextValue = transcript.trim();
      setMessage(nextValue);
      onTyping(Boolean(nextValue));
      setMicHint('Speech captured');
      focusInputAt(nextValue.length);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onError?.(event.error === 'not-allowed' ? 'Microphone permission was denied.' : 'Speech recognition failed.');
      }
      resetMic();
    };

    recognition.onend = () => {
      setMicState('idle');
      setMicHint((current) => (current === 'Speech captured' ? current : ''));
    };

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  };

  const startAudioRecording = async () => {
    if (typeof MediaRecorder === 'undefined') {
      onError?.('This browser does not support microphone recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.onstart = () => {
        setMicState('recording');
        setMicHint('Recording audio...');
      };

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        onError?.('Audio recording failed.');
        resetMic();
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) {
          const extension = blob.type.includes('ogg') ? 'ogg' : 'webm';
          const file = new File([blob], `voice-message-${Date.now()}.${extension}`, { type: blob.type || 'audio/webm' });
          await onUpload(file);
        }
        resetMic();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (error) {
      onError?.(error?.name === 'NotAllowedError' ? 'Microphone permission was denied.' : 'Could not access your microphone.');
      resetMic();
    }
  };

  const handleMicClick = async () => {
    if (disabled) return;

    if (micState === 'listening') {
      recognitionRef.current?.stop?.();
      setMicHint('Speech captured');
      return;
    }

    if (micState === 'recording') {
      mediaRecorderRef.current?.stop?.();
      setMicHint('Uploading voice message...');
      return;
    }

    const speechStarted = await startSpeechRecognition();
    if (!speechStarted) {
      await startAudioRecording();
    }
  };

  return (
    <div className="border-t border-border/50 bg-card relative">
      {isAI && (
        <div className="px-4 pt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {aiPrompts.slice(0, 4).map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => {
                setMessage(prompt.text);
                onTyping(true);
                focusInputAt(prompt.text.length);
              }}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-surface-1 border border-border/50 text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-all"
            >
              {prompt.text}
            </button>
          ))}
        </div>
      )}

      {micState !== 'idle' || micHint ? (
        <div className="px-4 pt-3">
          <div className={`rounded-xl px-3 py-2 text-xs font-medium ${micState === 'recording' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {micHint || (micState === 'recording' ? 'Recording audio...' : 'Listening...')}
          </div>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onUpload(file);
          }
          event.target.value = '';
        }}
      />

      <div className="flex items-end gap-2 p-3 relative">
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => {
              setEmojiOpen((current) => !current);
              inputRef.current?.focus();
            }}
            className="w-9 h-9 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Smile className="w-5 h-5 text-muted-foreground" />
          </button>
          {emojiOpen && (
            <div className="absolute bottom-12 left-0 z-20 shadow-lg">
              <EmojiPicker
                open
                lazyLoadEmojis
                skinTonesDisabled
                onEmojiClick={(emojiData) => insertEmoji(emojiData.emoji)}
                width={320}
                height={380}
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors flex-shrink-0"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder={disabled ? 'Messaging unavailable' : isAI ? 'Ask my.ai anything...' : 'Type a message...'}
            value={message}
            onChange={handleChange}
            onClick={(event) => {
              selectionRef.current = {
                start: event.target.selectionStart ?? message.length,
                end: event.target.selectionEnd ?? message.length,
              };
            }}
            onSelect={(event) => {
              selectionRef.current = {
                start: event.target.selectionStart ?? message.length,
                end: event.target.selectionEnd ?? message.length,
              };
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSubmit();
              }
            }}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-1 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-60"
          />
        </div>
        {message.trim() ? (
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="w-9 h-9 rounded-lg bg-primary hover:bg-primary/90 flex items-center justify-center transition-colors flex-shrink-0 shadow-glow disabled:opacity-60"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        ) : (
          <button
            onClick={handleMicClick}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
              micState === 'recording' ? 'bg-destructive text-destructive-foreground' : micState === 'listening' ? 'bg-primary text-primary-foreground' : 'hover:bg-surface-hover'
            }`}
            disabled={disabled}
          >
            {micState === 'recording' ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageComposer;
