import './FluidBackground.css';

export default function FluidBackground() {
  return (
    <div className="fluid-bg" aria-hidden>
      <div className="fluid-mesh" />
      <div className="fluid-blob fluid-blob--1" />
      <div className="fluid-blob fluid-blob--2" />
      <div className="fluid-blob fluid-blob--3" />
      <div className="fluid-shine" />
    </div>
  );
}
