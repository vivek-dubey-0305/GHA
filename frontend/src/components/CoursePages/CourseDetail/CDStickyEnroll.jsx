import { useEffect, useState } from "react";

export default function CDStickyEnroll({ course, onEnroll }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!course) return null;

  return (
    <div className={`cd-sticky-enroll${visible ? " visible" : ""}`}>
      <div className="cd-sticky-title">{course.title}</div>
      <div className="cd-sticky-price">
        ${course.discountPrice || course.price}
      </div>
      <div className="cd-sticky-actions">
        <button className="cd-sticky-enroll-btn" onClick={onEnroll}>
          Enroll for ${course.discountPrice || course.price} →
        </button>
        <span className="cd-sticky-guarantee">30-day money-back guarantee</span>
      </div>
    </div>
  );
}
