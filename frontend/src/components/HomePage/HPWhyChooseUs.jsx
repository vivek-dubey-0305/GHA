import { useState } from "react";

const TABS = [
  {
    id: "curriculum",
    label: "Industry Ready\nCurriculum",
    icon: "📚",
    items: [
      { n: 1,  icon: "🔨", title: "Real-World Projects",        desc: "Learn by building production-grade applications used in real companies." },
      { n: 2,  icon: "⚡", title: "Modern Tech Stack",          desc: "Master React, Node.js, Docker, AWS, and modern AI frameworks used today." },
      { n: 3,  icon: "🗺", title: "Structured Learning Paths",  desc: "Step-by-step roadmaps from beginner to professional level." },
      { n: 4,  icon: "📊", title: "Industry Case Studies",      desc: "Analyze real business problems and how professionals solve them." },
      { n: 5,  icon: "🔄", title: "Continuous Updates",         desc: "Courses constantly updated to match the fast-changing tech industry." },
      { n: 6,  icon: "🎯", title: "Career-Focused Learning",    desc: "Every module designed with employability and industry demand in mind." },
    ],
    svg: (
      <svg viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg">
        <rect width="560" height="360" fill="#0d0d0d"/>
        <defs>
          <pattern id="wcu-grid1" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0L0 0 0 28" fill="none" stroke="#f5c518" strokeWidth="0.15" opacity="0.25"/>
          </pattern>
        </defs>
        <rect width="560" height="360" fill="url(#wcu-grid1)"/>
        {/* Book layers */}
        <g transform="translate(280,180)">
          <rect x="-80" y="-60" width="160" height="120" rx="4" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.4"/>
          <rect x="-68" y="-50" width="136" height="100" rx="2" fill="#f5c518" opacity="0.03"/>
          <line x1="-80" y1="-20" x2="80" y2="-20" stroke="#f5c518" strokeWidth="0.5" opacity="0.4"/>
          <line x1="-80" y1="0"   x2="80" y2="0"   stroke="#f5c518" strokeWidth="0.5" opacity="0.3"/>
          <line x1="-80" y1="20"  x2="50" y2="20"  stroke="#f5c518" strokeWidth="0.5" opacity="0.2"/>
          <rect x="-80" y="60" width="160" height="10" rx="2" fill="#f5c518" opacity="0.15"/>
          <rect x="-70" y="75" width="155" height="8" rx="2" fill="#f5c518" opacity="0.1">
            <animateTransform attributeName="transform" type="rotate" from="-5 -70 75" to="5 -70 75" dur="3s" repeatCount="indefinite" additive="sum"/>
          </rect>
          {/* Progress bar */}
          <rect x="-80" y="100" width="160" height="3" rx="1.5" fill="#333"/>
          <rect x="-80" y="100" width="0" height="3" rx="1.5" fill="#f5c518">
            <animate attributeName="width" values="0;112;0" dur="4s" repeatCount="indefinite"/>
          </rect>
          <text x="0" y="-35" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="14" fill="#f5c518" opacity="0.6" letterSpacing="2">CURRICULUM</text>
        </g>
        {/* Orbiting bullets */}
        {[0,1,2,3,4,5].map((i) => {
          const angle = i * 60;
          const rad = angle * Math.PI / 180;
          return (
            <circle key={i} cx={280 + Math.cos(rad) * 140} cy={180 + Math.sin(rad) * 100} r="5" fill="#f5c518" opacity="0.3">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite"/>
            </circle>
          );
        })}
        <text x="280" y="330" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="50" fill="#f5c518" opacity="0.04" letterSpacing="6">LEARN</text>
      </svg>
    ),
  },
  {
    id: "mentorship",
    label: "Expert\nMentorship",
    icon: "🎙",
    items: [
      { n: 7,  icon: "👨‍🏫", title: "Industry Mentors",          desc: "Learn from professionals working at top companies globally." },
      { n: 8,  icon: "💬", title: "Live Doubt Sessions",        desc: "Weekly live sessions to resolve questions and clarify complex topics." },
      { n: 9,  icon: "🧭", title: "Personal Guidance",         desc: "Get personalized learning advice and career direction from mentors." },
      { n: 10, icon: "🔍", title: "Code Reviews",              desc: "Receive expert feedback on your projects from senior engineers." },
      { n: 11, icon: "🛠", title: "Live Workshops",             desc: "Participate in hands-on workshops conducted by industry experts." },
      { n: 12, icon: "🎤", title: "Technical Interview Prep",  desc: "Prepare for real interviews with expert guidance and mock sessions." },
    ],
    svg: (
      <svg viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg">
        <rect width="560" height="360" fill="#0d0d0d"/>
        <g transform="translate(280,175)">
          {/* Person */}
          <circle cx="0" cy="-80" r="30" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.5"/>
          <circle cx="0" cy="-80" r="18" fill="#f5c518" opacity="0.08"/>
          <path d="M-40,-40 Q-40,20 0,40 Q40,20 40,-40" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0.4"/>
          {/* Chat bubbles */}
          <rect x="55" y="-110" width="120" height="48" rx="8" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0">
            <animate attributeName="opacity" values="0;0.6;0;0.6;0" dur="5s" repeatCount="indefinite"/>
          </rect>
          <text x="115" y="-82" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="9" fill="#f5c518" opacity="0">
            Great work! 🎉
            <animate attributeName="opacity" values="0;0.7;0;0.7;0" dur="5s" repeatCount="indefinite"/>
          </text>
          <rect x="-175" y="-60" width="110" height="40" rx="8" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0">
            <animate attributeName="opacity" values="0;0.5;0;0.5;0" dur="5s" begin="2.5s" repeatCount="indefinite"/>
          </rect>
          <text x="-120" y="-36" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="9" fill="#f5c518" opacity="0">
            How can I help?
            <animate attributeName="opacity" values="0;0.6;0;0.6;0" dur="5s" begin="2.5s" repeatCount="indefinite"/>
          </text>
          {/* Pulse ring */}
          <circle cx="0" cy="-80" r="42" fill="none" stroke="#f5c518" strokeWidth="0.5" opacity="0">
            <animate attributeName="r" values="30;50;30" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite"/>
          </circle>
          {/* Star rating */}
          <text x="0" y="70" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="16" fill="#f5c518" opacity="0.5">★★★★★</text>
        </g>
        <text x="280" y="340" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="50" fill="#f5c518" opacity="0.04" letterSpacing="6">MENTOR</text>
      </svg>
    ),
  },
  {
    id: "handson",
    label: "Hands-On\nLearning",
    icon: "🔨",
    items: [
      { n: 13, icon: "🏗",  title: "Project Based Learning",   desc: "Every course focuses on building real applications rather than theory." },
      { n: 14, icon: "📝", title: "Practical Assignments",    desc: "Assignments designed to reinforce concepts through implementation." },
      { n: 15, icon: "🚀", title: "Capstone Projects",        desc: "Build large-scale projects demonstrating your complete skillset." },
      { n: 16, icon: "🐙", title: "GitHub Portfolio",         desc: "Create a professional portfolio recruiters can evaluate directly." },
      { n: 17, icon: "💼", title: "Real Product Dev",         desc: "Simulate real development environments and professional workflows." },
      { n: 18, icon: "🐛", title: "Debugging & Problem Solving",desc: "Learn how professionals debug complex software systems effectively." },
    ],
    svg: (
      <svg viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg">
        <rect width="560" height="360" fill="#0d0d0d"/>
        {/* Terminal window */}
        <rect x="60" y="50" width="440" height="260" rx="6" fill="#0a0a0a" stroke="#f5c518" strokeWidth="0.8" opacity="0.4"/>
        <rect x="60" y="50" width="440" height="30" rx="6" fill="#f5c518" opacity="0.06"/>
        <circle cx="84" cy="65" r="5" fill="#e74c3c" opacity="0.7"/>
        <circle cx="100" cy="65" r="5" fill="#f5c518" opacity="0.7"/>
        <circle cx="116" cy="65" r="5" fill="#27ae60" opacity="0.7"/>
        <text x="83" y="102" fontFamily="'Space Mono',monospace" fontSize="10" fill="#27ae60" opacity="0.8">$ npm run build</text>
        <text x="83" y="122" fontFamily="'Space Mono',monospace" fontSize="10" fill="#f5c518" opacity="0">
          ✓ Building project...
          <animate attributeName="opacity" values="0;0.7" dur="0.5s" begin="0.5s" fill="freeze"/>
        </text>
        <text x="83" y="142" fontFamily="'Space Mono',monospace" fontSize="10" fill="#f5c518" opacity="0">
          ✓ Compiling 48 files
          <animate attributeName="opacity" values="0;0.7" dur="0.5s" begin="1.2s" fill="freeze"/>
        </text>
        <text x="83" y="162" fontFamily="'Space Mono',monospace" fontSize="10" fill="#27ae60" opacity="0">
          ✓ Build complete! 2.3s
          <animate attributeName="opacity" values="0;1" dur="0.5s" begin="2s" fill="freeze"/>
        </text>
        {/* Progress bar */}
        <rect x="83" y="200" width="400" height="4" rx="2" fill="#333"/>
        <rect x="83" y="200" width="0" height="4" rx="2" fill="#f5c518">
          <animate attributeName="width" values="0;400;0" dur="5s" repeatCount="indefinite"/>
        </rect>
        <text x="83" y="230" fontFamily="'Space Mono',monospace" fontSize="9" fill="#888" opacity="0.6">Running test suite...</text>
        <text x="83" y="280" fontFamily="'Space Mono',monospace" fontSize="10" fill="#f5c518" opacity="0.3">■</text>
        <text x="83" y="280" fontFamily="'Space Mono',monospace" fontSize="10" fill="#f5c518" opacity="0">
          █
          <animate attributeName="opacity" values="0;1;0" dur="0.8s" repeatCount="indefinite"/>
        </text>
      </svg>
    ),
  },
  {
    id: "career",
    label: "Career\nAcceleration",
    icon: "🚀",
    items: [
      { n: 19, icon: "📄", title: "Resume Building",           desc: "Create a powerful resume tailored for the tech industry." },
      { n: 20, icon: "🌐", title: "Portfolio Showcase",        desc: "Showcase your projects to potential employers professionally." },
      { n: 21, icon: "🎭", title: "Mock Interviews",           desc: "Practice real technical interviews with expert guidance." },
      { n: 22, icon: "🗺", title: "Career Roadmaps",           desc: "Clear roadmaps to help you move toward specific target roles." },
      { n: 23, icon: "🤝", title: "Industry Networking",       desc: "Connect with peers, mentors, and professionals in the tech ecosystem." },
      { n: 24, icon: "💰", title: "Freelancing Guidance",      desc: "Learn how to start earning through freelance work effectively." },
    ],
    svg: (
      <svg viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg">
        <rect width="560" height="360" fill="#0d0d0d"/>
        <defs>
          <linearGradient id="wcu-rocket" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f5c518" stopOpacity="0.05"/>
            <stop offset="100%" stopColor="#f5c518" stopOpacity="0.2"/>
          </linearGradient>
        </defs>
        <rect width="560" height="360" fill="url(#wcu-rocket)"/>
        {/* Growth chart */}
        <polyline points="60,280 120,250 180,220 240,170 300,130 360,100 420,60 480,30" fill="none" stroke="#f5c518" strokeWidth="2.5" strokeLinejoin="round" opacity="0.7"/>
        <polyline points="60,280 120,250 180,220 240,170 300,130 360,100 420,60 480,30 480,300 60,300" fill="#f5c518" opacity="0.04"/>
        {/* Milestone dots */}
        {[[120,250],[240,170],[360,100],[480,30]].map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill="#f5c518" opacity="0.7">
            <animate attributeName="r" values="6;9;6" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {/* Rocket */}
        <g transform="translate(480,30)">
          <circle r="10" fill="none" stroke="#f5c518" strokeWidth="1.5" opacity="0.8">
            <animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
          </circle>
          <circle r="5" fill="#f5c518"/>
        </g>
        {/* Labels */}
        <text x="70" y="296" fontFamily="'Space Mono',monospace" fontSize="8" fill="#888" opacity="0.5">START</text>
        <text x="450" y="26" fontFamily="'Space Mono',monospace" fontSize="8" fill="#f5c518" opacity="0.7">HIRED</text>
        <text x="280" y="340" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="50" fill="#f5c518" opacity="0.04" letterSpacing="6">CAREER</text>
      </svg>
    ),
  },
  {
    id: "community",
    label: "Community\nLearning",
    icon: "🌐",
    items: [
      { n: 25, icon: "👥", title: "Student Community",         desc: "Join an active community of learners and developers worldwide." },
      { n: 26, icon: "💬", title: "Peer Discussions",          desc: "Discuss concepts, projects, and solutions with fellow learners." },
      { n: 27, icon: "🤝", title: "Collaboration Projects",    desc: "Work together with others on collaborative team projects." },
      { n: 28, icon: "⚔",  title: "Coding Challenges",        desc: "Participate in coding challenges to sharpen your skills daily." },
      { n: 29, icon: "🏆", title: "Leaderboards",             desc: "Track your performance against other learners in real-time." },
      { n: 30, icon: "📢", title: "Knowledge Sharing",         desc: "Community-driven sharing of tips, resources, and experiences." },
    ],
    svg: (
      <svg viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg">
        <rect width="560" height="360" fill="#0d0d0d"/>
        <g transform="translate(280,175)">
          {/* Central hub */}
          <circle r="24" fill="none" stroke="#f5c518" strokeWidth="1.5" opacity="0.6">
            <animate attributeName="r" values="24;30;24" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle r="12" fill="#f5c518" opacity="0.15"/>
          <text x="0" y="4" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="10" fill="#f5c518" opacity="0.8">GHA</text>
          {/* Nodes */}
          {[0,51.4,102.8,154.2,205.6,257,308.4].map((deg, i) => {
            const rad = deg * Math.PI / 180;
            const x = Math.cos(rad) * 130;
            const y = Math.sin(rad) * 100;
            return (
              <g key={i}>
                <line x1="0" y1="0" x2={x} y2={y} stroke="#f5c518" strokeWidth="0.5" opacity="0.25"/>
                <circle cx={x} cy={y} r="16" fill="none" stroke="#f5c518" strokeWidth="0.8" opacity="0.4">
                  <animate attributeName="opacity" values="0.4;0.8;0.4" dur={`${2 + i * 0.4}s`} repeatCount="indefinite"/>
                </circle>
                <circle cx={x} cy={y} r="6" fill="#f5c518" opacity="0.3"/>
              </g>
            );
          })}
          {/* Pulse from center */}
          <circle r="0" fill="none" stroke="#f5c518" strokeWidth="1" opacity="0">
            <animate attributeName="r" values="0;160" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.5;0" dur="3s" repeatCount="indefinite"/>
          </circle>
        </g>
        <text x="280" y="340" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="50" fill="#f5c518" opacity="0.04" letterSpacing="6">COMMUNITY</text>
      </svg>
    ),
  },
  {
    id: "tools",
    label: "Advanced\nLearning Tools",
    icon: "🤖",
    items: [
      { n: 31, icon: "🖥",  title: "Interactive Interface",    desc: "A modern learning dashboard designed for maximum productivity." },
      { n: 32, icon: "📈", title: "Progress Tracking",        desc: "Track course progress, milestones, and personal achievements." },
      { n: 33, icon: "🔬", title: "Smart Analytics",          desc: "Analyze your performance and identify areas for improvement." },
      { n: 34, icon: "📥", title: "Downloadable Resources",   desc: "Access PDFs, code templates, and development assets anytime." },
      { n: 35, icon: "⌨",  title: "Code Sandboxes",           desc: "Practice coding directly inside the platform without setup." },
      { n: 36, icon: "⏰", title: "Learning Reminders",       desc: "Automated reminders to maintain consistent learning habits." },
    ],
    svg: (
      <svg viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg">
        <rect width="560" height="360" fill="#0d0d0d"/>
        {/* Dashboard UI */}
        <rect x="50" y="40" width="460" height="280" rx="6" fill="#0a0a0a" stroke="#f5c518" strokeWidth="0.6" opacity="0.3"/>
        {/* Sidebar */}
        <rect x="50" y="40" width="80" height="280" fill="#f5c518" opacity="0.04"/>
        {[60,80,100,120,140,160].map((y, i) => (
          <rect key={i} x="60" y={y} width="50" height="8" rx="2" fill="#f5c518" opacity={i === 0 ? 0.5 : 0.15}/>
        ))}
        {/* Main area - chart */}
        <rect x="155" y="60" width="335" height="120" rx="3" fill="#f5c518" opacity="0.03" stroke="#f5c518" strokeWidth="0.4" />
        {/* Mini bar chart */}
        {[0,1,2,3,4,5,6,7].map((i) => (
          <rect key={i} x={165 + i * 35} y={160 - (i % 3 === 0 ? 70 : i % 3 === 1 ? 50 : 85)} width="20" height={i % 3 === 0 ? 70 : i % 3 === 1 ? 50 : 85} fill="#f5c518" opacity="0.3">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur={`${1.5 + i * 0.2}s`} repeatCount="indefinite"/>
          </rect>
        ))}
        {/* Progress rings */}
        <circle cx="200" cy="250" r="30" fill="none" stroke="#333" strokeWidth="6"/>
        <circle cx="200" cy="250" r="30" fill="none" stroke="#f5c518" strokeWidth="6" strokeDasharray="157" strokeDashoffset="31" strokeLinecap="round" opacity="0.7"/>
        <text x="200" y="254" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="9" fill="#f5c518" opacity="0.8">80%</text>
        <circle cx="290" cy="250" r="30" fill="none" stroke="#333" strokeWidth="6"/>
        <circle cx="290" cy="250" r="30" fill="none" stroke="#f5c518" strokeWidth="6" strokeDasharray="157" strokeDashoffset="57" strokeLinecap="round" opacity="0.5"/>
        <text x="290" y="254" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="9" fill="#f5c518" opacity="0.6">64%</text>
        <circle cx="380" cy="250" r="30" fill="none" stroke="#333" strokeWidth="6"/>
        <circle cx="380" cy="250" r="30" fill="none" stroke="#f5c518" strokeWidth="6" strokeDasharray="157" strokeDashoffset="16" strokeLinecap="round" opacity="0.9"/>
        <text x="380" y="254" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="9" fill="#f5c518" opacity="0.9">90%</text>
      </svg>
    ),
  },
  {
    id: "trust",
    label: "Trust &\nCertification",
    icon: "🏆",
    items: [
      { n: 37, icon: "📜", title: "Verified Certificates",     desc: "Earn professional certificates after successful course completion." },
      { n: 38, icon: "✅", title: "Skill Assessments",         desc: "Validate your knowledge through structured, rigorous assessments." },
      { n: 39, icon: "🔒", title: "Secure Platform",           desc: "Industry-grade infrastructure ensuring a secure learning environment." },
      { n: 40, icon: "♾",  title: "Lifetime Access",           desc: "Courses remain fully accessible even after completion." },
      { n: 41, icon: "💸", title: "Affordable Pricing",        desc: "Premium education offered at accessible, honest pricing." },
      { n: 42, icon: "📈", title: "Continuous Skill Growth",   desc: "Keep upgrading your skills with constantly new course additions." },
    ],
    svg: (
      <svg viewBox="0 0 560 360" xmlns="http://www.w3.org/2000/svg">
        <rect width="560" height="360" fill="#0d0d0d"/>
        {/* Certificate */}
        <rect x="80" y="60" width="400" height="240" rx="6" fill="#0a0a0a" stroke="#f5c518" strokeWidth="1" opacity="0.4"/>
        <rect x="80" y="60" width="400" height="40" fill="#f5c518" opacity="0.08"/>
        <text x="280" y="86" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="10" fill="#f5c518" opacity="0.7" letterSpacing="3">CERTIFICATE OF COMPLETION</text>
        {/* Border decoration */}
        <rect x="92" y="110" width="376" height="178" rx="3" fill="none" stroke="#f5c518" strokeWidth="0.5" opacity="0.3" strokeDasharray="6,4"/>
        <text x="280" y="150" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="12" fill="#f5c518" opacity="0.4" letterSpacing="2">PRESENTED TO</text>
        <text x="280" y="175" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="24" fill="#f5c518" opacity="0.7" letterSpacing="2">LEARNER NAME</text>
        <line x1="150" y1="185" x2="410" y2="185" stroke="#f5c518" strokeWidth="0.5" opacity="0.3"/>
        <text x="280" y="205" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="8" fill="#888" opacity="0.5">For successfully completing</text>
        <text x="280" y="220" textAnchor="middle" fontFamily="'Space Mono',monospace" fontSize="9" fill="#f5c518" opacity="0.6">GHA Course Program 2025</text>
        {/* Seal */}
        <g transform="translate(280,265)">
          <circle r="22" fill="#f5c518" opacity="0.5" stroke="#f5c518" strokeWidth="1"/>
          <text x="0" y="4" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="10" fill="#f5c518" opacity="0.8">GHA</text>
          <circle r="28" fill="none" stroke="#f5c518" strokeWidth="0.5" opacity="0.3">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite"/>
          </circle>
        </g>
        <text x="280" y="340" textAnchor="middle" fontFamily="'Bebas Neue',sans-serif" fontSize="50" fill="#f5c518" opacity="0.04" letterSpacing="6">CERTIFIED</text>
      </svg>
    ),
  },
];

export default function HPWhyChooseUs() {
  const [activeTab, setActiveTab] = useState(0);
  const tab = TABS[activeTab];

  return (
    <>
      <section id="why-gha" className="hp-why-section">
        <div className="hp-reveal">
          <div className="hp-section-tag">Why GHA</div>
          <div className="hp-section-title">WHY <em>CHOOSE</em><br/>GREED HUNTER</div>
          <p className="hp-section-sub">42 reasons why GHA is the last learning platform you'll ever need.</p>
        </div>

        {/* Tab nav */}
        <div className="hp-why-tabs hp-reveal">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              className={`hp-tab-btn${activeTab === i ? " active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              <span className="hp-tab-icon">{t.icon}</span>
              <span className="hp-tab-label">{t.label.split("\n").map((l, j) => <span key={j}>{l}<br/></span>)}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="hp-why-content hp-reveal" key={activeTab}>
          <div className="hp-why-svg-col">
            {tab.svg}
          </div>
          <div className="hp-why-items-col">
            {tab.items.map((item) => (
              <div className="hp-why-item" key={item.n}>
                <div className="hp-why-item-num">{String(item.n).padStart(2, "0")}</div>
                <div className="hp-why-item-icon">{item.icon}</div>
                <div>
                  <div className="hp-why-item-title">{item.title}</div>
                  <div className="hp-why-item-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .hp-why-section {
          position: relative; z-index: 1;
          padding: 0 60px 100px;
        }
        .hp-why-tabs {
          display: flex; gap: 1px;
          background: rgba(245,197,24,0.1);
          border: 1px solid rgba(245,197,24,0.18);
          margin: 48px 0 0; overflow-x: auto;
        }
        .hp-tab-btn {
          flex: 1; min-width: 120px;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 18px 12px;
          background: #111; border: none; cursor: none;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.3s;
          border-right: 1px solid rgba(245,197,24,0.1);
          text-align: center;
        }
        .hp-tab-btn:last-child { border-right: none; }
        .hp-tab-btn:hover { background: #151515; }
        .hp-tab-btn.active { background: rgba(245,197,24,0.06); }
        .hp-tab-btn.active .hp-tab-label { color: #f5c518; }
        .hp-tab-icon { font-size: 1.3rem; }
        .hp-tab-label {
          font-size: 0.68rem; font-weight: 600; color: #888;
          line-height: 1.3; letter-spacing: 0.3px; transition: color 0.3s;
        }
        .hp-tab-btn.active::after {
          content: ''; display: block; width: 100%; height: 2px;
          background: #f5c518; margin-top: 4px;
        }

        .hp-why-content {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1px; background: rgba(245,197,24,0.1);
          border: 1px solid rgba(245,197,24,0.18);
          border-top: none;
          animation: hpFadeInUp 0.4s ease both;
        }
        .hp-why-svg-col {
          background: #0d0d0d; overflow: hidden;
        }
        .hp-why-svg-col svg { width: 100%; height: 100%; min-height: 340px; }
        .hp-why-items-col {
          background: #111;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1px; background: rgba(245,197,24,0.08);
        }
        .hp-why-item {
          background: #111; padding: 22px;
          display: flex; gap: 12px; align-items: flex-start;
          transition: background 0.3s;
          position: relative; overflow: hidden;
        }
        .hp-why-item::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 1.5px; background: #f5c518;
          transform: scaleX(0); transform-origin: left; transition: transform 0.35s;
        }
        .hp-why-item:hover { background: #161616; }
        .hp-why-item:hover::after { transform: scaleX(1); }
        .hp-why-item-num {
          font-family: 'Space Mono', monospace; font-size: 0.58rem;
          color: #f5c518; opacity: 0.5; letter-spacing: 1px; flex-shrink: 0;
          padding-top: 2px;
        }
        .hp-why-item-icon { font-size: 1.1rem; flex-shrink: 0; }
        .hp-why-item-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 0.9rem; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .hp-why-item-desc { font-size: 0.74rem; color: #888; line-height: 1.5; }

        @media (max-width: 1024px) {
          .hp-why-content { grid-template-columns: 1fr; }
          .hp-why-svg-col { display: none; }
        }
        @media (max-width: 700px) {
          .hp-why-section { padding: 0 24px 80px; }
          .hp-why-items-col { grid-template-columns: 1fr; }
          .hp-why-tabs { flex-wrap: wrap; }
          .hp-tab-btn { min-width: 100px; }
        }
      `}</style>
    </>
  );
}
