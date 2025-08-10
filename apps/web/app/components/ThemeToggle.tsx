"use client";

export default function ThemeToggle() {
  const onClick = () => {
    document.body.classList.toggle('light');
  };
  return (
    <button className="btn-secondary" onClick={onClick} type="button">
      Toggle theme
    </button>
  );
}


