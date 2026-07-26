"use client";

import MicSharpIcon from "@mui/icons-material/MicSharp";
import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";

import { MacShortcutHint } from "@/components/ui/mac-shortcut-hint";
import { useSpeechRecognition } from "@/features/doc-chat/hooks/useSpeechRecognition";
import { useDocStore } from "@/features/doc-chat/stores/docStore";

// Textarea grows with content up to this height, then scrolls internally —
// without it, a pasted long question stays pinned at one line and the rest
// scrolls out of view inside a sliver of a box.
const MAX_TEXTAREA_HEIGHT_PX = 200;

const SAMPLE_QUESTIONS = [
  "Who is the carrier?",
  "What is the pickup location?",
  "When is the delivery date?",
  "What is the shipment rate?",
  "What commodity is being shipped?",
];

export function Composer({
  onSubmit,
  disabled,
}: {
  onSubmit: (question: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const placeholderIndex = useDocStore((state) => state.promptPlaceholderIndex);
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

  useEffect(() => {
    const focusComposer = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener("keydown", focusComposer);
    return () => window.removeEventListener("keydown", focusComposer);
  }, []);

  return (
    <div className="relative z-10 mb-2 flex min-h-14 w-full items-end gap-2 rounded-3xl border border-white/5 bg-white/[0.03] px-5 py-3 backdrop-blur-xl">
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
        placeholder={isListening ? "Listening..." : SAMPLE_QUESTIONS[placeholderIndex]}
        className="max-h-[200px] flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
      />
      <MacShortcutHint
        keys={["⌘", "/"]}
        label="Press Command plus slash to focus the question box"
        className="mr-2 self-center"
        compact
      />
      {voiceSupported && (
        <button
          type="button"
          onClick={toggleVoice}
          disabled={disabled}
          title={isListening ? "Stop recording" : "Ask by voice"}
          className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-40 ${
            isListening
              ? "bg-white/10 text-zinc-300 backdrop-blur-md"
              : "bg-white/10 text-zinc-300 backdrop-blur-md hover:text-white"
          }`}
        >
          {isListening ? (
            <ThinkingOrb
              state="listening"
              size={64}
              theme="dark"
              style={{ width: 28, height: 28 }}
              aria-hidden
            />
          ) : (
            <MicSharpIcon sx={{ fontSize: 19 }} aria-hidden />
          )}
        </button>
      )}
      <button
        type="button"
        onClick={submit}
        aria-label={disabled ? "Generating response" : "Send question"}
        aria-busy={disabled}
        disabled={disabled || !value.trim()}
        className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform active:scale-95 ${
          disabled
            ? "cursor-wait opacity-100 disabled:opacity-100"
            : value.trim()
              ? ""
              : "opacity-40"
        }`}
      >
        <i className="bi bi-caret-up-fill text-base leading-none" aria-hidden />
      </button>
    </div>
  );
}
