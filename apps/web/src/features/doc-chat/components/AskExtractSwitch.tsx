"use client";

import styled from "styled-components";

export type PanelSection = "ask" | "extract" | "assets";

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
        <input
          checked={value === "assets"}
          id="radio-assets"
          name="ask-extract"
          type="radio"
          onChange={() => onChange("assets")}
        />
        <label htmlFor="radio-assets">Assets</label>
        <div className="glider-container">
          <div className="glider" />
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  flex-shrink: 0;
  align-self: stretch;

  .radio-container {
    --main-color: var(--color-primary);
    --main-color-opacity: color-mix(in srgb, var(--main-color) 11%, transparent);
    --total-radio: 3;

    display: flex;
    flex-direction: column;
    align-items: stretch;
    position: relative;
    height: fit-content;
    padding-right: 0.5rem;
    width: fit-content;
  }
  .radio-container input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    appearance: none;
  }
  .radio-container .glider-container {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
  }
  .radio-container .glider-container .glider {
    position: relative;
    width: 100%;
    height: calc(100% / var(--total-radio));
    background: linear-gradient(
      180deg,
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
    height: 60%;
    width: 300%;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    background: var(--main-color);
    filter: blur(10px);
  }
  .radio-container .glider-container .glider::after {
    content: "";
    position: absolute;
    right: 0;
    height: 100%;
    width: 150px;
    background: linear-gradient(
      270deg,
      var(--main-color-opacity) 0%,
      rgba(0, 0, 0, 0) 100%
    );
  }
  .radio-container label {
    cursor: pointer;
    min-width: 7rem;
    padding: 0.75rem 1.25rem;
    position: relative;
    color: var(--color-zinc-500);
    text-align: left;
    font-size: 0.875rem;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .radio-container input:checked + label {
    color: var(--main-color);
  }

  .radio-container input:nth-of-type(1):checked ~ .glider-container .glider {
    transform: translateY(0);
  }

  .radio-container input:nth-of-type(2):checked ~ .glider-container .glider {
    transform: translateY(100%);
  }

  .radio-container input:nth-of-type(3):checked ~ .glider-container .glider {
    transform: translateY(200%);
  }
`;
