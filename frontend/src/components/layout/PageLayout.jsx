import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import HPNavbar from "../HomePage/HPNavbar";
import HPFooter from "../HomePage/HPFooter";

export default function PageLayout({ children, title, description }) {
  return (
    <>
      <HPNavbar />
      
      {/* Hero Section with title */}
      <section 
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          paddingTop: 100,
          paddingBottom: 60,
          background: "linear-gradient(135deg, rgba(245,197,24,0.05) 0%, transparent 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(245,197,24,0.08) 0%, transparent 70%)",
          zIndex: 0,
        }} />

        {/* Grid lines - simple pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(245,197,24,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            zIndex: 1,
          }}
        />

        <div style={{
          maxWidth: 1260,
          margin: "0 auto",
          padding: "0 5%",
          position: "relative",
          zIndex: 2,
          width: "100%",
          textAlign: "center",
        }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(2.2rem, 5vw, 4rem)",
              letterSpacing: "0.1em",
              marginBottom: 20,
              lineHeight: 1.1,
            }}>
              {title}
            </h1>
            {description && (
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1.1rem",
                color: "rgba(245,245,240,0.6)",
                maxWidth: 600,
                margin: "0 auto",
                lineHeight: 1.7,
              }}>
                {description}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <section style={{
        padding: "80px 0",
        background: "#080808",
      }}>
        <div style={{
          maxWidth: 1260,
          margin: "0 auto",
          padding: "0 5%",
        }}>
          {children}
        </div>
      </section>

      <HPFooter />
    </>
  );
}
