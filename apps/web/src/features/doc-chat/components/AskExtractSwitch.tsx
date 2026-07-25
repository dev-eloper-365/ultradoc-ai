"use client";

import styled from "styled-components";

export type PanelSection = "ask" | "extract";

export function AskExtractSwitch({
  value,
  onChange,
}: {
  value: PanelSection;
  onChange: (value: PanelSection) => void;
}) {
  return (
    <StyledWrapper>
      <div className="radio-container">
        <input
          checked={value === "ask"}
          id="radio-ask"
          name="ask-extract"
          type="radio"
          onChange={() => onChange("ask")}
        />
        <label htmlFor="radio-ask">Ask</label>
        <input
          checked={value === "extract"}
          id="radio-extract"
          name="ask-extract"
          type="radio"
          onChange={() => onChange("extract")}
        />
        <label htmlFor="radio-extract">Extract</label>
        <div className="glider-container">
          <div className="glider" />
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .radio-container {
    --main-color: var(--color-primary);
    --total-radio: 2;

    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    padding-bottom: 0.5rem;
    width: fit-content;
  }
  .radio-container input {
    cursor: pointer;
    appearance: none;
  }
  .radio-container .glider-container {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
  }
  .radio-container .glider-container .glider {
    position: relative;
    width: calc(100% / var(--total-radio));
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0) 0%,
      var(--main-color) 50%,
      rgba(0, 0, 0, 0) 100%
    );
    will-change: transform;
    transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .radio-container .glider-container .glider::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 40px;
    left: 50%;
    bottom: -1px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(
      ellipse at 50% 100%,
      color-mix(in srgb, var(--main-color) 70%, transparent) 0%,
      color-mix(in srgb, var(--main-color) 30%, transparent) 38%,
      transparent 75%
    );
    opacity: 0.65;
    filter: blur(8px);
  }
  .radio-container label {
    cursor: pointer;
    min-width: 8rem;
    padding: 0.5rem 1.25rem;
    position: relative;
    color: var(--color-zinc-500);
    text-align: center;
    font-size: 0.875rem;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .radio-container input:checked + label {
    color: var(--main-color);
  }

  .radio-container input:nth-of-type(1):checked ~ .glider-container .glider {
    transform: translateX(0);
  }

  .radio-container input:nth-of-type(2):checked ~ .glider-container .glider {
    transform: translateX(100%);
  }
`;
