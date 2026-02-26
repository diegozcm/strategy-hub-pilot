import React from 'react';
import { Send, Plus, Mic, Square, Loader2, Navigation, X } from 'lucide-react';

interface AtlasInputBarProps {
  chatInput: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  isPlanMode: boolean;
  onTogglePlan: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
  recordingTime: number;
  onToggleRecording: () => void;
  isDisabled: boolean;
  pastedImages: string[];
  onRemoveImage: (idx: number) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const AtlasInputBar: React.FC<AtlasInputBarProps> = ({
  chatInput, onInputChange, onSend, onPaste,
  isPlanMode, onTogglePlan,
  isRecording, isTranscribing, recordingTime, onToggleRecording,
  isDisabled, pastedImages, onRemoveImage, textareaRef,
}) => {
  return (
    <div className="border-t border-[hsl(var(--cofound-blue-light))]/15 bg-[hsl(var(--cofound-blue-dark))]/5 px-4 py-3 shrink-0">
      {/* Pasted images */}
      {pastedImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pastedImages.map((img, idx) => (
            <div key={idx} className="relative inline-block">
              <img src={img} alt="Preview" className="max-h-16 rounded-lg border border-border" />
              <button
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive flex items-center justify-center"
                onClick={() => onRemoveImage(idx)}
              >
                <X className="h-3 w-3 text-destructive-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-[hsl(var(--cofound-blue-light))]/25 bg-[hsl(var(--cofound-blue-dark))]/8 overflow-hidden shadow-sm">
        {/* Textarea / Recording area */}
        <div className="relative">
          {isRecording ? (
            <div className="flex flex-col items-center justify-center py-4 px-3" style={{ minHeight: '44px' }}>
              <div className="flex items-center gap-1 mb-1.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-[hsl(var(--cofound-blue-light))]"
                    style={{ animation: `waveform-bar 0.8s ease-in-out ${i * 0.08}s infinite` }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Gravando... {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ) : isTranscribing ? (
            <div className="flex items-center justify-center gap-2 py-4 px-3" style={{ minHeight: '44px' }}>
              <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--cofound-blue-light))]" />
              <span className="text-sm text-muted-foreground">Transcrevendo...</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={chatInput}
              onChange={(e) => {
                onInputChange(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              onPaste={onPaste}
              placeholder="Digite sua mensagem..."
              disabled={isDisabled}
              rows={1}
              className="w-full px-3 py-2.5 text-sm outline-none bg-transparent resize-none text-[hsl(var(--cofound-blue-dark))] placeholder:text-[hsl(var(--cofound-blue-dark))]/40"
              style={{ maxHeight: '120px', overflowY: 'auto', minHeight: '40px' }}
            />
          )}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between px-2 py-1.5 border-t border-[hsl(var(--cofound-blue-light))]/10">
          <div className="flex items-center gap-1">
            <button
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[hsl(var(--cofound-blue-light))]/10"
              title="Anexar mídia"
            >
              <Plus className="h-4 w-4 text-[hsl(var(--cofound-blue-light))]" />
            </button>
            <button
              onClick={onTogglePlan}
              disabled={isDisabled}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0 transition-all border ${
                isPlanMode
                  ? 'bg-[hsl(var(--cofound-green))]/15 border-[hsl(var(--cofound-green))]/40 text-[hsl(var(--cofound-green))]'
                  : 'border-[hsl(var(--cofound-blue-light))]/20 text-[hsl(var(--cofound-blue-light))]/60 hover:bg-[hsl(var(--cofound-blue-light))]/10'
              }`}
            >
              Plan
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleRecording}
              disabled={isDisabled || isTranscribing}
              className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all border ${
                isRecording
                  ? 'border-destructive/40 bg-destructive/10'
                  : 'border-[hsl(var(--cofound-blue-light))]/20 hover:bg-[hsl(var(--cofound-blue-light))]/10'
              }`}
              title={isRecording ? "Parar gravação" : "Gravar áudio"}
            >
              {isRecording
                ? <Square className="h-3 w-3 fill-current text-destructive" />
                : <Mic className="h-4 w-4 text-[hsl(var(--cofound-blue-light))]" />
              }
            </button>
            <button
              onClick={onSend}
              disabled={isDisabled || !chatInput.trim() || isRecording || isTranscribing}
              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-30 bg-[hsl(var(--cofound-blue-light))] text-white"
            >
              <Navigation className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
