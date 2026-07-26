"use client";

import { ArrowUp, Mic, Square } from "lucide-react";
import { useRef, useState } from "react";

import { useSpeechRecognition } from "@/features/doc-chat/hooks/useSpeechRecognition";

// Textarea grows with content up to this height, then scrolls internally —
// without it, a pasted long question stays pinned at one line and the rest
// scrolls out of view inside a sliver of a box.
const MAX_TEXTAREA_HEIGHT_PX = 200;

export function Composer({
  onSubmit,
  disabled,
}: {
  onSubmit: (question: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Text already in the box when recording starts, so a live transcript
  // appends to it instead of overwriting whatever the user already typed.
  const voiceBaselineRef = useRef("");

  const resize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  };

  const setValueAndResize = (next: string) => {
    setValue(next);
    if (textareaRef.current) resize(textareaRef.current);
  };

  const {
    isSupported: voiceSupported,
    isListening,
    start,
    stop,
  } = useSpeechRecognition((transcript) => {
    const joined = voiceBaselineRef.current
      ? `${voiceBaselineRef.current} ${transcript}`
      : transcript;
    setValueAndResize(joined);
  });

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    if (isListening) stop();
    onSubmit(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const toggleVoice = () => {
    if (isListening) {
      stop();
      return;
    }
    voiceBaselineRef.current = value.trim();
    start();
  };

  return (
    <div className="mb-2 flex w-full items-end gap-2 rounded-3xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur-xl">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValueAndResize(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder={isListening ? "Listening..." : "Ask a question about your documents..."}
        className="max-h-[200px] flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
      />
      {voiceSupported && (
        <button
          type="button"
          onClick={toggleVoice}
          disabled={disabled}
          title={isListening ? "Stop recording" : "Ask by voice"}
          className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-40 ${
            isListening
              ? "animate-pulse bg-red-500 text-white"
              : "bg-white/10 text-zinc-300 backdrop-blur-md hover:text-white"
          }`}
        >
          {isListening ? <Square className="size-3.5 fill-current" /> : <Mic className="size-4" />}
        </button>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform active:scale-95 disabled:opacity-40"
      >
        <ArrowUp className="size-4" />
      </button>
    </div>
  );
}
