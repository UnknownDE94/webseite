import React from "react";
import { registerRoot, Composition, useCurrentFrame, interpolate, Easing } from "remotion";
import svg from "./svg.js";

const FPS = 30, DUR = 150;
const STEPS = [
  ["01", "Originalteil", "Verschlissen oder nicht mehr lieferbar"],
  ["02", "3D-Scan", "Intern als Punktwolke erfassen"],
  ["03", "CAD-Modell", "Intern aufbereiten, bemaßen, prüfen"],
  ["04", "3D-Druck", "Intern, sofern technisch geeignet und freigegeben"],
];

// Der Lichtstrahl wandert in vier Etappen von links nach rechts; jede Etappe aktiviert einen Streifen.
const TeileAblauf = () => {
  const f = useCurrentFrame();
  const t = interpolate(f, [10, 125], [0, 3], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const active = Math.min(3, Math.floor(t + 0.0001));
  const reveal = (i) => interpolate(t, [i - 0.15, i + 0.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const css = [0, 1, 2, 3].map((i) => `.morph__slice[style*="--i:${i}"]{opacity:${i === 0 ? 1 : reveal(i)}}`).join("");
  const beamX = interpolate(t, [0, 3], [284, 784], { extrapolateRight: "clamp" }) - 284;
  return (
    <div style={{ width: 1280, height: 720, background: "#0a0f0c", color: "#f2f5f3", fontFamily: "Inter, system-ui, sans-serif", position: "relative" }}>
      <style>{`${css}.morph__beam{transform:translateX(${beamX}px)}`}</style>
      <div style={{ position: "absolute", inset: "40px 40px 190px" }} dangerouslySetInnerHTML={{ __html: svg }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 170, display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid #223028" }}>
        {STEPS.map(([n, h, p], i) => (
          <div key={n} style={{ padding: "26px 28px", borderRight: i < 3 ? "1px solid #223028" : 0, opacity: i <= active ? 1 : 0.35, borderTop: i === active ? "3px solid #d4ec5f" : "3px solid transparent", marginTop: -1 }}>
            <div style={{ fontFamily: "monospace", color: "#d4ec5f", fontSize: 18 }}>{n}</div>
            <div style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 6px" }}>{h}</div>
            <div style={{ fontSize: 19, color: "#9aa7a0" }}>{p}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

registerRoot(() => <Composition id="TeileAblauf" component={TeileAblauf} durationInFrames={DUR} fps={FPS} width={1280} height={720} />);
