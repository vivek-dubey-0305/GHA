// /**
//  * Mock Instructor Data
//  * Production-grade sample data for 5 detailed instructors
//  * Covers all instructor fields and relationships
//  */

// export const mockInstructors = [
//   {
//     _id: "inst_001",
//     firstName: "Sarah",
//     lastName: "Chen",
//     email: "sarah.chen@gha.edu",
//     phone: "+1-415-555-0101",
//     profilePicture: {
//       public_id: "gha/instructors/sarah-chen",
//       secure_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
//     },
//     bio: "Full-stack developer with 8+ years of experience in web technologies. Passionate about teaching clean code and best practices. Mentor to 500+ developers worldwide.",
//     dateOfBirth: "1992-03-15",
//     gender: "Female",
//     address: {
//       street: "123 Tech Street",
//       city: "San Francisco",
//       state: "CA",
//       postalCode: "94102",
//       country: "USA"
//     },
//     specialization: ["web_development", "javascript", "react"],
//     qualifications: [
//       {
//         degree: "Bachelor of Science",
//         institution: "UC Berkeley",
//         yearOfCompletion: 2014,
//         certificationId: "CERT-2014-UC-001"
//       },
//       {
//         degree: "AWS Solutions Architect Professional",
//         institution: "Amazon Web Services",
//         yearOfCompletion: 2020,
//         certificationId: "AWS-CERT-2020-001"
//       }
//     ],
//     yearsOfExperience: 8,
//     totalStudentsTeaching: 5420,
//     totalCourses: 12,
//     totalLiveClasses: 156,
//     isEmailVerified: true,
//     isPhoneVerified: true,
//     isDocumentsVerified: true,
//     isKYCVerified: true,
//     isActive: true,
//     isSuspended: false,
//     courses: [
//       "course_001",
//       "course_002",
//       "course_003"
//     ],
//     liveClasses: [
//       "liveclass_001",
//       "liveclass_002"
//     ],
//     videoPackages: [
//       "vidpkg_001",
//       "vidpkg_002",
//       "vidpkg_003"
//     ],
//     rating: {
//       averageRating: 4.8,
//       totalReviews: 892,
//       ratingBreakdown: {
//         5: 756,
//         4: 98,
//         3: 24,
//         2: 8,
//         1: 6
//       }
//     },
//     socialProfiles: {
//       twitter: "https://twitter.com/sarahchendev",
//       github: "https://github.com/sarahchen",
//       linkedin: "https://linkedin.com/in/sarahchen"
//     },
//     bankDetails: {
//       bankName: "Chase Bank",
//       accountHolderName: "Sarah Chen",
//       accountNumber: "****1234",
//       routingNumber: "****5678",
//       isVerified: true,
//       verifiedAt: "2023-01-15T08:00:00Z"
//     },
//     earnings: {
//       totalEarnings: 45320.50,
//       pendingPayout: 5200.00,
//       lastPayoutDate: "2024-02-28T10:30:00Z"
//     },
//     createdAt: "2022-06-10T12:00:00Z",
//     updatedAt: "2024-03-10T15:30:00Z"
//   },

//   {
//     _id: "inst_002",
//     firstName: "Michael",
//     lastName: "Rodriguez",
//     email: "michael.rodriguez@gha.edu",
//     phone: "+1-512-555-0202",
//     profilePicture: {
//       public_id: "gha/instructors/michael-rodriguez",
//       secure_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
//     },
//     bio: "Data Science enthusiast with PhD in Machine Learning. 10 years industry experience at FAANG companies. Specialized in building scalable ML systems and mentoring junior data scientists.",
//     dateOfBirth: "1989-07-22",
//     gender: "Male",
//     address: {
//       street: "456 Data Avenue",
//       city: "Boston",
//       state: "MA",
//       postalCode: "02108",
//       country: "USA"
//     },
//     specialization: ["data_science", "machine_learning", "artificial_intelligence"],
//     qualifications: [
//       {
//         degree: "PhD in Computer Science",
//         institution: "MIT",
//         yearOfCompletion: 2015,
//         certificationId: "MIT-PHD-2015-CS"
//       },
//       {
//         degree: "Google Cloud Professional Data Engineer",
//         institution: "Google Cloud",
//         yearOfCompletion: 2021,
//         certificationId: "GCLOUD-DE-2021"
//       },
//       {
//         degree: "TensorFlow Developer Certificate",
//         institution: "Google",
//         yearOfCompletion: 2021,
//         certificationId: "TF-DEV-2021"
//       }
//     ],
//     yearsOfExperience: 10,
//     totalStudentsTeaching: 8932,
//     totalCourses: 8,
//     totalLiveClasses: 203,
//     isEmailVerified: true,
//     isPhoneVerified: true,
//     isDocumentsVerified: true,
//     isKYCVerified: true,
//     isActive: true,
//     isSuspended: false,
//     courses: [
//       "course_004",
//       "course_005"
//     ],
//     liveClasses: [
//       "liveclass_003",
//       "liveclass_004",
//       "liveclass_005"
//     ],
//     videoPackages: [
//       "vidpkg_004",
//       "vidpkg_005"
//     ],
//     rating: {
//       averageRating: 4.9,
//       totalReviews: 1245,
//       ratingBreakdown: {
//         5: 1178,
//         4: 52,
//         3: 12,
//         2: 2,
//         1: 1
//       }
//     },
//     socialProfiles: {
//       twitter: "https://twitter.com/mrodriguez_ml",
//       github: "https://github.com/mrodriguez",
//       linkedin: "https://linkedin.com/in/mrodriguez"
//     },
//     bankDetails: {
//       bankName: "Bank of America",
//       accountHolderName: "Michael Rodriguez",
//       accountNumber: "****5678",
//       routingNumber: "****1234",
//       isVerified: true,
//       verifiedAt: "2023-02-20T10:00:00Z"
//     },
//     earnings: {
//       totalEarnings: 72450.75,
//       pendingPayout: 8900.00,
//       lastPayoutDate: "2024-02-28T10:30:00Z"
//     },
//     createdAt: "2021-11-05T14:20:00Z",
//     updatedAt: "2024-03-11T09:15:00Z"
//   },

//   {
//     _id: "inst_003",
//     firstName: "Emily",
//     lastName: "Thompson",
//     email: "emily.thompson@gha.edu",
//     phone: "+44-20-7555-0303",
//     profilePicture: {
//       public_id: "gha/instructors/emily-thompson",
//       secure_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"
//     },
//     bio: "UX/UI Designer with 12 years of experience designing for Fortune 500 companies. Awarded design educator. Passionate about creating inclusive and accessible digital experiences.",
//     dateOfBirth: "1987-11-09",
//     gender: "Female",
//     address: {
//       street: "789 Design Lane",
//       city: "London",
//       state: "England",
//       postalCode: "SW1A 2AA",
//       country: "UK"
//     },
//     specialization: ["design", "soft_skills", "business"],
//     qualifications: [
//       {
//         degree: "Bachelor of Arts in Graphic Design",
//         institution: "Royal College of Art",
//         yearOfCompletion: 2012,
//         certificationId: "RCA-2012-GD"
//       },
//       {
//         degree: "Certified UX Professional",
//         institution: "Nielsen Norman Group",
//         yearOfCompletion: 2018,
//         certificationId: "NN-UXP-2018"
//       }
//     ],
//     yearsOfExperience: 12,
//     totalStudentsTeaching: 3650,
//     totalCourses: 6,
//     totalLiveClasses: 89,
//     isEmailVerified: true,
//     isPhoneVerified: true,
//     isDocumentsVerified: true,
//     isKYCVerified: true,
//     isActive: true,
//     isSuspended: false,
//     courses: [
//       "course_006",
//       "course_007"
//     ],
//     liveClasses: [
//       "liveclass_006"
//     ],
//     videoPackages: [
//       "vidpkg_006"
//     ],
//     rating: {
//       averageRating: 4.7,
//       totalReviews: 567,
//       ratingBreakdown: {
//         5: 489,
//         4: 62,
//         3: 14,
//         2: 2,
//         1: 0
//       }
//     },
//     socialProfiles: {
//       twitter: "https://twitter.com/emilythompson",
//       github: "https://github.com/emilythompson",
//       linkedin: "https://linkedin.com/in/emilythompson"
//     },
//     bankDetails: {
//       bankName: "HSBC",
//       accountHolderName: "Emily Thompson",
//       accountNumber: "****9012",
//       routingNumber: "****3456",
//       isVerified: true,
//       verifiedAt: "2023-03-10T14:00:00Z"
//     },
//     earnings: {
//       totalEarnings: 38960.25,
//       pendingPayout: 4100.00,
//       lastPayoutDate: "2024-02-28T10:30:00Z"
//     },
//     createdAt: "2022-09-15T11:45:00Z",
//     updatedAt: "2024-03-10T16:45:00Z"
//   },

//   {
//     _id: "inst_004",
//     firstName: "Rajesh",
//     lastName: "Patel",
//     email: "rajesh.patel@gha.edu",
//     phone: "+91-988-555-0404",
//     profilePicture: {
//       public_id: "gha/instructors/rajesh-patel",
//       secure_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
//     },
//     bio: "Cloud architect with 9 years of expertise in AWS, Azure, and GCP. Helped 1000+ companies migrate to cloud. Specialist in DevOps and infrastructure automation.",
//     dateOfBirth: "1991-05-18",
//     gender: "Male",
//     address: {
//       street: "321 Cloud Street",
//       city: "Bangalore",
//       state: "Karnataka",
//       postalCode: "560001",
//       country: "India"
//     },
//     specialization: ["cloud_computing", "devops", "cybersecurity"],
//     qualifications: [
//       {
//         degree: "Bachelor of Technology in IT",
//         institution: "IIT Delhi",
//         yearOfCompletion: 2013,
//         certificationId: "IIT-2013-IT"
//       },
//       {
//         degree: "AWS Certified Solutions Architect",
//         institution: "Amazon Web Services",
//         yearOfCompletion: 2019,
//         certificationId: "AWS-SA-2019"
//       },
//       {
//         degree: "Certified Kubernetes Administrator",
//         institution: "Linux Foundation",
//         yearOfCompletion: 2021,
//         certificationId: "CKA-2021"
//       }
//     ],
//     yearsOfExperience: 9,
//     totalStudentsTeaching: 6234,
//     totalCourses: 10,
//     totalLiveClasses: 178,
//     isEmailVerified: true,
//     isPhoneVerified: true,
//     isDocumentsVerified: true,
//     isKYCVerified: true,
//     isActive: true,
//     isSuspended: false,
//     courses: [
//       "course_008",
//       "course_009"
//     ],
//     liveClasses: [
//       "liveclass_007",
//       "liveclass_008"
//     ],
//     videoPackages: [
//       "vidpkg_007",
//       "vidpkg_008"
//     ],
//     rating: {
//       averageRating: 4.8,
//       totalReviews: 943,
//       ratingBreakdown: {
//         5: 821,
//         4: 98,
//         3: 20,
//         2: 3,
//         1: 1
//       }
//     },
//     socialProfiles: {
//       twitter: "https://twitter.com/rajeshpatel_aws",
//       github: "https://github.com/rajeshpatel",
//       linkedin: "https://linkedin.com/in/rajeshpatel"
//     },
//     bankDetails: {
//       bankName: "HDFC Bank",
//       accountHolderName: "Rajesh Patel",
//       accountNumber: "****3456",
//       routingNumber: "****7890",
//       isVerified: true,
//       verifiedAt: "2023-04-05T09:30:00Z"
//     },
//     earnings: {
//       totalEarnings: 55780.40,
//       pendingPayout: 6750.00,
//       lastPayoutDate: "2024-02-28T10:30:00Z"
//     },
//     createdAt: "2022-03-20T10:15:00Z",
//     updatedAt: "2024-03-11T12:00:00Z"
//   },

//   {
//     _id: "inst_005",
//     firstName: "Lisa",
//     lastName: "Wagner",
//     email: "lisa.wagner@gha.edu",
//     phone: "+49-30-555-0505",
//     profilePicture: {
//       public_id: "gha/instructors/lisa-wagner",
//       secure_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
//     },
//     bio: "Business strategy consultant with MBA from Harvard. 15 years in corporate management and entrepreneurship. Passionate about teaching leadership and business growth strategies.",
//     dateOfBirth: "1985-09-03",
//     gender: "Female",
//     address: {
//       street: "555 Business Boulevard",
//       city: "Berlin",
//       state: "Berlin",
//       postalCode: "10115",
//       country: "Germany"
//     },
//     specialization: ["business", "soft_skills", "marketing"],
//     qualifications: [
//       {
//         degree: "MBA",
//         institution: "Harvard Business School",
//         yearOfCompletion: 2011,
//         certificationId: "HBS-MBA-2011"
//       },
//       {
//         degree: "Certified Project Management Professional",
//         institution: "Project Management Institute",
//         yearOfCompletion: 2013,
//         certificationId: "PMI-PMP-2013"
//       }
//     ],
//     yearsOfExperience: 15,
//     totalStudentsTeaching: 4120,
//     totalCourses: 7,
//     totalLiveClasses: 134,
//     isEmailVerified: true,
//     isPhoneVerified: true,
//     isDocumentsVerified: true,
//     isKYCVerified: true,
//     isActive: true,
//     isSuspended: false,
//     courses: [
//       "course_010"
//     ],
//     liveClasses: [
//       "liveclass_009",
//       "liveclass_010"
//     ],
//     videoPackages: [
//       "vidpkg_009"
//     ],
//     rating: {
//       averageRating: 4.6,
//       totalReviews: 678,
//       ratingBreakdown: {
//         5: 567,
//         4: 89,
//         3: 18,
//         2: 3,
//         1: 1
//       }
//     },
//     socialProfiles: {
//       twitter: "https://twitter.com/lisawagner",
//       github: "https://github.com/lisawagner",
//       linkedin: "https://linkedin.com/in/lisawagner"
//     },
//     bankDetails: {
//       bankName: "Deutsche Bank",
//       accountHolderName: "Lisa Wagner",
//       accountNumber: "****7890",
//       routingNumber: "****1234",
//       isVerified: true,
//       verifiedAt: "2023-05-12T11:00:00Z"
//     },
//     earnings: {
//       totalEarnings: 42350.80,
//       pendingPayout: 5400.00,
//       lastPayoutDate: "2024-02-28T10:30:00Z"
//     },
//     createdAt: "2022-01-08T09:00:00Z",
//     updatedAt: "2024-03-11T14:30:00Z"
//   }
// ];

// export default mockInstructors;


/**
 * Mock Instructor Data — InstructorListing + InstructorDetail
 *
 * Each record contains:
 *   Listing fields : id, name, title, specs, bio, rating, reviews, students,
 *                    courses, exp, liveClasses, img, bannerColor, badges, bg, company
 *   Detail fields  : fullBio, specializations[], qualifications[], timeline[],
 *                    myCourses[], achievements[], skills[], social[], reviewItems[]
 */

export const mockInstructors = [
  {
    id: 1,
    name: "Alex Chen",
    title: "Design Lead @ Figma · Former Google, Airbnb",
    specs: ["Design", "Design Systems", "UI/UX"],
    bio: "Design Lead at Figma with 10+ years building design systems at Airbnb, Google, and Figma. Speaker at Config and Smashing Conf.",
    rating: 4.96,
    reviews: 2847,
    students: 18402,
    courses: 12,
    exp: 11,
    liveClasses: 45,
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&q=80",
    bannerColor: "#0d0a1a",
    badges: ["top", "verified", "mentor"],
    bg: "faang",
    company: "FAANG",

    fullBio: "I'm Alex Chen — Design Lead at Figma, where I lead the design systems team that ships tools used by 8M designers worldwide. Before Figma, I spent 4 years at Airbnb contributing to their DLS, and 3 years at Google working on Material Design 3.\n\nI started teaching because I was frustrated that most design education skips the hard parts — governance, scalability, the politics of getting engineers to adopt your system. My courses teach the craft AND the process.\n\nOver 18,000 designers have taken my courses. Many have shipped design systems at companies like Stripe, Notion, and Linear — using the exact frameworks I teach.",
    specializations: [
      { icon:"🎨", title:"DESIGN SYSTEMS",    desc:"Build scalable, token-based systems. Color, typography, spacing, and governance at scale." },
      { icon:"🔷", title:"FIGMA ADVANCED",    desc:"Variants, component properties, auto-layout, and advanced prototyping patterns." },
      { icon:"🔗", title:"DESIGN TOKENS",     desc:"From primitives to semantics. Token tooling with Style Dictionary and Tokens Studio." },
      { icon:"♿", title:"ACCESSIBILITY",      desc:"WCAG 2.2 for design systems. Accessible color, focus management, ARIA patterns." },
      { icon:"📖", title:"DESIGN OPS",         desc:"Documentation, handoff workflows, versioning, and Storybook integration." },
      { icon:"🎯", title:"COMPONENT ARCH",     desc:"Atomic design, composition patterns, and building libraries that survive org changes." },
    ],
    qualifications: [
      { icon:"🎓", year:"2010 – 2014", title:"B.F.A. Interaction Design", inst:"Carnegie Mellon School of Design — Cum Laude" },
      { icon:"🎓", year:"2014 – 2016", title:"M.Des. Communication Design", inst:"RCA London — Distinction" },
      { icon:"🏆", year:"2020",        title:"CPACC Accessibility Certification", inst:"International Association of Accessibility Professionals" },
      { icon:"🎤", year:"2022 – 2024", title:"Config & Smashing Conf Speaker", inst:"Design Systems & DesignOps tracks" },
    ],
    timeline: [
      { year:"2021 – Present", company:"FIGMA",   role:"Design Lead — Design Systems", desc:"Leading the team building Figma's own design system and educator tools. Directly influenced the Component Properties feature release.", tags:["Figma","Design Tokens","Leadership","Accessibility"] },
      { year:"2017 – 2021", company:"AIRBNB",  role:"Senior Designer — DLS",           desc:"Contributed core components to Airbnb's Design Language System. Led the dark-mode migration and accessibility audit across 200+ components.", tags:["React","Design Systems","Figma","a11y"] },
      { year:"2014 – 2017", company:"GOOGLE",  role:"UX Designer — Material Design",  desc:"Part of the core Material Design 3 team. Designed interaction patterns for motion, elevation, and adaptive layouts.", tags:["Material Design","Motion","Android"] },
    ],
    myCourses: [
      { id:"course_006", title:"UI/UX Design Fundamentals & Advanced Practices", cat:"Design", sub:"Design Systems", level:"Advanced", price:199, oldPrice:349, rating:4.95, reviews:2847, hours:42, projects:6, img:"https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"},{cls:"badge-intern",label:"Internship"}], internship:true, students:12400, desc:"Build scalable design systems from first principles. Used by teams at Airbnb, Figma, and Stripe." },
      { id:"c_a2",       title:"Figma Advanced: Tokens, Variables & Components",  cat:"Design", sub:"Figma", level:"Intermediate", price:129, oldPrice:229, rating:4.9, reviews:1204, hours:28, projects:4, img:"https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"}], internship:false, students:8200, desc:"Master Figma's advanced features including variables, component properties, and design token pipelines." },
      { id:"c_a3",       title:"Accessibility-First Design Systems",               cat:"Design", sub:"Accessibility", level:"Intermediate", price:99,  oldPrice:179, rating:4.88, reviews:678, hours:18, projects:3, img:"https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-new",label:"New"}], internship:false, students:4100, desc:"Build accessible design systems from the ground up. WCAG 2.2, inclusive components, and testing workflows." },
    ],
    achievements: [
      { icon:"🥇", title:"Top Instructor 2024",       sub:"GHA Annual Award" },
      { icon:"🎤", title:"Config 2023 Keynote Speaker",sub:"Design Systems at Scale" },
      { icon:"📖", title:"Author: Design at Scale",   sub:"O'Reilly Media, 2023" },
      { icon:"⭐", title:"20K Students Milestone",     sub:"Reached in 14 months" },
    ],
    skills: [
      { name:"Figma / Design Systems", pct:99 },
      { name:"Design Tokens",          pct:97 },
      { name:"Accessibility (WCAG)",   pct:94 },
      { name:"Design Ops / Processes", pct:92 },
      { name:"React / Storybook",      pct:78 },
    ],
    social: [
      { icon:"🔗", label:"linkedin.com/in/alexchen-ds",  url:"#" },
      { icon:"🐙", label:"github.com/alexchen",          url:"#" },
      { icon:"🐦", label:"@alexchen_design",             url:"#" },
      { icon:"🌐", label:"alexchen.design",              url:"#" },
    ],
    reviewItems: [
      { name:"PRIYA SHARMA",   course:"UI/UX Design",  date:"March 2025",    stars:5, text:"Alex doesn't just teach design — she teaches you how design systems think. The token chapter alone is worth 10x the price. We shipped our system in 6 weeks using her framework." },
      { name:"DANIEL FOSTER",  course:"Figma Advanced",date:"February 2025", stars:5, text:"I've watched every design YouTube tutorial. Alex is in a completely different tier. The depth of her component architecture explanations is genuinely industry-changing." },
      { name:"KENJI TANAKA",   course:"UI/UX Design",  date:"January 2025",  stars:5, text:"Landed my first design systems role at a Series B startup after completing Alex's course. The portfolio projects from this course were what got me through the interview." },
      { name:"SARA OKONKWO",   course:"Figma Advanced",date:"December 2024", stars:4, text:"Exceptional content. The Figma variables module was mind-blowing. Minor note: some screencasts could use higher resolution for dense token tables. Still 5-star quality overall." },
    ],
  },

  {
    id: 2,
    name: "Sarah Kim",
    title: "ML Researcher @ DeepMind · PhD MIT",
    specs: ["Machine Learning", "AI", "Deep Learning"],
    bio: "Former researcher at DeepMind and OpenAI. PhD in CS from MIT. Specializes in LLMs, computer vision, and RL.",
    rating: 4.93,
    reviews: 8420,
    students: 42100,
    courses: 8,
    exp: 10,
    liveClasses: 32,
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&q=80",
    bannerColor: "#001214",
    badges: ["verified", "mentor"],
    bg: "research",
    company: "Research",

    fullBio: "I'm Sarah Kim — ML researcher at DeepMind and author of 24 papers at NeurIPS, ICML, and ICLR. My PhD at MIT focused on scalable training for large language models.\n\nI teach ML the way I wish someone had taught me: starting from mathematical intuition, not black-box APIs. I want every engineer to understand not just how to use a model, but why it works and when it will fail.\n\nMy courses have helped over 42,000 engineers across disciplines — from software developers writing their first neural network to PhD students preparing for industry roles.",
    specializations: [
      { icon:"🧠", title:"LARGE LANGUAGE MODELS", desc:"Transformers, attention, fine-tuning, RLHF, and deploying LLMs in production." },
      { icon:"👁",  title:"COMPUTER VISION",       desc:"CNNs, ViTs, object detection, segmentation, and real-time inference." },
      { icon:"🤖", title:"REINFORCEMENT LEARNING", desc:"Policy gradients, PPO, RLHF, and multi-agent systems." },
      { icon:"📊", title:"STATISTICAL ML",          desc:"Probabilistic models, Bayesian inference, and uncertainty quantification." },
      { icon:"⚡", title:"ML SYSTEMS",              desc:"Training infrastructure, distributed training, CUDA optimization, and serving." },
      { icon:"🔬", title:"ML RESEARCH",             desc:"How to read papers, reproduce results, and contribute to open-source ML." },
    ],
    qualifications: [
      { icon:"🎓", year:"2014 – 2018", title:"B.S. Mathematics & Computer Science", inst:"Caltech — Valedictorian" },
      { icon:"🎓", year:"2018 – 2023", title:"Ph.D. Computer Science", inst:"MIT CSAIL — Thesis: Scalable RLHF for Language Models" },
      { icon:"📖", year:"2022",        title:"NeurIPS Outstanding Paper Award",     inst:"'Efficient Fine-Tuning of Billion-Parameter Models'" },
      { icon:"🏆", year:"2024",        title:"MIT TR35 Innovator Under 35",         inst:"Technology Review, AI/ML Category" },
    ],
    timeline: [
      { year:"2023 – Present", company:"DEEPMIND",  role:"Research Scientist — Language Models",  desc:"Working on alignment, interpretability, and efficient fine-tuning of Gemini-class models.", tags:["JAX","Python","RLHF","LLMs","Gemini"] },
      { year:"2021 – 2023",    company:"OPENAI",    role:"Research Intern — RLHF team",           desc:"Contributed to InstructGPT and early ChatGPT alignment work. Co-authored 3 papers on reward modeling.", tags:["PyTorch","RLHF","Alignment"] },
      { year:"2018 – 2023",    company:"MIT CSAIL", role:"PhD Researcher",                        desc:"Research on scalable RLHF, efficient transformers, and cross-modal learning.", tags:["Research","PyTorch","NeurIPS","ICML"] },
    ],
    myCourses: [
      { id:"course_004", title:"Machine Learning Mastery: From Theory to Production", cat:"Machine Learning", sub:"ML Engineering", level:"Intermediate", price:89, oldPrice:149, rating:4.9, reviews:567, hours:108, projects:5, img:"https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-hot",label:"Hot"}], internship:false, students:3450, desc:"PyTorch, transformers, fine-tuning LLMs, and production ML pipelines from the ground up." },
      { id:"c_s2", title:"LLMs & Fine-Tuning in Production", cat:"ML", sub:"LLMs", level:"Advanced", price:129, oldPrice:229, rating:4.95, reviews:1240, hours:52, projects:4, img:"https://images.unsplash.com/photo-1555949519-a1911ea6f620?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"}], internship:false, students:8900, desc:"Fine-tune Llama, Mistral, and Gemma models with LoRA, QLoRA, and DPO. Deploy to production APIs." },
    ],
    achievements: [
      { icon:"🥇", title:"NeurIPS Outstanding Paper 2022", sub:"Best paper in ML Systems track" },
      { icon:"🎓", title:"MIT TR35 Innovator Under 35",    sub:"AI/ML Category, 2024" },
      { icon:"📖", title:"24 Published Papers",            sub:"NeurIPS, ICML, ICLR, EMNLP" },
      { icon:"⭐", title:"40K Students Milestone",         sub:"Reached in 18 months" },
    ],
    skills: [
      { name:"PyTorch / JAX",         pct:99 },
      { name:"LLM Fine-Tuning (LoRA)", pct:97 },
      { name:"ML Research / Papers",   pct:96 },
      { name:"Computer Vision",         pct:91 },
      { name:"RL / RLHF",              pct:95 },
    ],
    social: [
      { icon:"🔗", label:"linkedin.com/in/sarahkim-ml", url:"#" },
      { icon:"🐙", label:"github.com/sarahkim",         url:"#" },
      { icon:"🐦", label:"@sarahkim_ml",                url:"#" },
      { icon:"📄", label:"Scholar: Sarah Kim",          url:"#" },
    ],
    reviewItems: [
      { name:"ARJUN MEHTA",   course:"ML Mastery",      date:"March 2025",    stars:5, text:"Sarah doesn't just teach you to run model.fit(). She teaches you WHY transformers work, what attention is actually doing, and how to debug training runs. Exceptional depth." },
      { name:"SOFIA CHEN",    course:"LLMs Fine-Tuning", date:"February 2025", stars:5, text:"I fine-tuned a custom Llama-3 model for my company's legal documents after this course. The LoRA and QLoRA sections alone saved us tens of thousands in compute costs." },
      { name:"MARC DUBOIS",   course:"ML Mastery",      date:"January 2025",  stars:5, text:"PhD student here. I've read the original Attention Is All You Need paper 5 times. Sarah's explanation of multi-head attention finally made it fully click. Just extraordinary." },
    ],
  },

  {
    id: 3,
    name: "James Wright",
    title: "Staff Engineer @ Stripe · Ex-Netflix · Ex-Cloudflare",
    specs: ["Web Dev", "Node.js", "DevOps"],
    bio: "Staff Engineer at Stripe. Previously at Netflix and Cloudflare. Builds distributed systems used by millions daily.",
    rating: 4.88,
    reviews: 19200,
    students: 84000,
    courses: 15,
    exp: 14,
    liveClasses: 60,
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80",
    bannerColor: "#001a0a",
    badges: ["top", "verified", "mentor"],
    bg: "faang",
    company: "FAANG",

    fullBio: "I'm James Wright — Staff Engineer at Stripe, where I architect the distributed systems that process over $800B in payments annually. Before Stripe, I spent 5 years at Netflix designing microservice infrastructure behind their global streaming platform, and 4 years at Cloudflare building edge computing systems.\n\nI started teaching on GHA because I was frustrated by the quality of technical education online. Most courses teach you to copy-paste code without understanding the underlying systems. I teach differently: from first principles, with real production code.\n\nMy courses have helped over 84,000 engineers level up — from junior developers to senior engineers designing billion-request systems.",
    specializations: [
      { icon:"⚡", title:"DISTRIBUTED SYSTEMS", desc:"Design fault-tolerant, highly available systems. CAP theorem, consensus algorithms, event sourcing." },
      { icon:"🔗", title:"MICROSERVICES",       desc:"Service mesh, inter-service communication, API gateways, and observability." },
      { icon:"☁️", title:"CLOUD & DEVOPS",      desc:"AWS, GCP, Kubernetes, CI/CD pipelines, infrastructure as code with Terraform." },
      { icon:"🟢", title:"NODE.JS AT SCALE",    desc:"High-throughput Node.js apps with event loops, streams, clustering, and performance profiling." },
      { icon:"🎯", title:"SYSTEM DESIGN",       desc:"End-to-end system design for FAANG interviews and real-world production architectures." },
      { icon:"🔐", title:"BACKEND SECURITY",    desc:"Auth systems, zero-trust, API security, secret management, and threat modeling." },
    ],
    qualifications: [
      { icon:"🎓", year:"2006 – 2010", title:"B.S. Computer Science",       inst:"Carnegie Mellon University — Cum Laude, GPA 3.94" },
      { icon:"🎓", year:"2010 – 2012", title:"M.S. Distributed Systems",    inst:"MIT CSAIL — Thesis: 'Consensus under Network Partitions'" },
      { icon:"☁️", year:"2018",        title:"AWS Solutions Architect Pro",  inst:"Amazon Web Services — Professional Level" },
      { icon:"🏆", year:"2022",        title:"CKA: Certified Kubernetes Admin",inst:"Cloud Native Computing Foundation" },
    ],
    timeline: [
      { year:"2020 – Present", company:"STRIPE",     role:"Staff Engineer — Payments Infrastructure", desc:"Architect of Stripe's distributed payment processing pipeline handling $800B+ annually. Led monolith-to-microservices migration across 40+ services.", tags:["Go","Kubernetes","Kafka","AWS","Distributed Systems"] },
      { year:"2016 – 2020",    company:"NETFLIX",    role:"Senior Engineer — Streaming Infrastructure",desc:"Designed microservices serving 220M+ subscribers globally. Built adaptive bitrate streaming systems and global CDN routing algorithms.", tags:["Java","Node.js","AWS","Cassandra"] },
      { year:"2012 – 2016",    company:"CLOUDFLARE", role:"Systems Engineer — Edge Computing",        desc:"Built core infrastructure for Cloudflare Workers. Managed 200+ PoPs worldwide.", tags:["Rust","V8","Edge","Nginx"] },
    ],
    myCourses: [
      { id:"course_001", title:"Advanced React & Modern JavaScript",        cat:"Web Dev",  sub:"Full Stack",  level:"Intermediate", price:129, oldPrice:249, rating:4.9,  reviews:3241, hours:48, projects:8, img:"https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"}],                                         internship:false, students:14820, desc:"Build 8 production-ready full-stack apps with MongoDB, Express, React, Node.js." },
      { id:"course_002", title:"Complete Web Development Bootcamp 2024",   cat:"Web Dev",  sub:"Full Stack",  level:"Beginner",     price:79,  oldPrice:129, rating:4.8,  reviews:4102, hours:36, projects:7, img:"https://images.unsplash.com/photo-1633356122544-a6cee?w=400&h=200&fit=crop&q=80",           badges:[{cls:"badge-best",label:"Bestseller"}],                                         internship:false, students:22100, desc:"Master the modern React ecosystem with Next.js App Router, server components, and edge functions." },
      { id:"c_j3",       title:"Node.js Microservices at Scale",            cat:"Backend",  sub:"Systems",     level:"Advanced",     price:149, oldPrice:259, rating:4.6,  reviews:978,  hours:44, projects:3, img:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=200&fit=crop&q=80",  badges:[],                                                                              internship:false, students:5100,  desc:"Event-driven microservice architecture with Docker, Kubernetes, gRPC at scale." },
      { id:"course_008", title:"AWS Solutions Architect Professional Prep", cat:"DevOps",   sub:"Cloud",       level:"Advanced",     price:39,  oldPrice:69,  rating:4.85, reviews:2103, hours:40, projects:4, img:"https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"},{cls:"badge-intern",label:"Internship"}], internship:true,  students:11200, desc:"Cloud Practitioner to Solutions Architect. Hands-on labs with real infrastructure." },
    ],
    achievements: [
      { icon:"🥇", title:"Top Instructor 2024",        sub:"GHA Annual Award" },
      { icon:"🎤", title:"JSConf Speaker 2023",         sub:"Distributed Node.js at Scale" },
      { icon:"📖", title:"Author: 'Systems at Scale'", sub:"O'Reilly Media, 2022" },
      { icon:"⭐", title:"100K Students Milestone",     sub:"Reached in 18 months" },
    ],
    skills: [
      { name:"Node.js / TypeScript",    pct:98 },
      { name:"AWS / Cloud Architecture",pct:95 },
      { name:"System Design",           pct:97 },
      { name:"Kubernetes / Docker",     pct:92 },
      { name:"Go / Rust",               pct:85 },
    ],
    social: [
      { icon:"🔗", label:"linkedin.com/in/jameswright", url:"#" },
      { icon:"🐙", label:"github.com/jameswright",      url:"#" },
      { icon:"🐦", label:"@jwright_dev",                url:"#" },
      { icon:"🌐", label:"jameswright.dev",             url:"#" },
    ],
    reviewItems: [
      { name:"ARJUN MEHTA",    course:"MERN Stack",     date:"March 2025",    stars:5, text:"James doesn't just teach code — he teaches you how to think. The MERN course completely changed how I approach architecture. Got a job offer at a Series B startup 2 weeks after completing it." },
      { name:"SOFIA ANDERSSON",course:"Microservices",  date:"February 2025", stars:5, text:"I've done courses from Udemy, Coursera, and Pluralsight. James is in a completely different tier. The depth of his content is insane, and the real production examples are priceless." },
      { name:"DEREK OBI",      course:"AWS & DevOps",   date:"January 2025",  stars:5, text:"Passed my AWS Solutions Architect exam on the first attempt after James's course. His mental models for understanding cloud architecture are simply the best I've ever encountered." },
      { name:"YUKI TANAKA",    course:"System Design",  date:"December 2024", stars:4, text:"Fantastic course overall. Would give 5 stars for the content depth. The only area for improvement is the pace in module 3." },
    ],
  },

  {
    id: 4,
    name: "Maya Patel",
    title: "Brand Director @ Nike · Ex-IDEO Creative Director",
    specs: ["Design", "Business", "Motion"],
    bio: "Brand Director at Nike with a decade of experience building iconic campaigns. Former Creative Director at IDEO.",
    rating: 4.82,
    reviews: 6100,
    students: 28400,
    courses: 6,
    exp: 11,
    liveClasses: 24,
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&q=80",
    bannerColor: "#1a0800",
    badges: ["verified"],
    bg: "startup",
    company: "Startup",

    fullBio: "I'm Maya Patel — Brand Director at Nike, where I lead global brand identity and campaigns seen by billions. Before Nike, I spent 6 years as Creative Director at IDEO, designing experiences for Fortune 500 companies.\n\nI teach brand and business design because most designers never learn the business side — how to present work, how to get buy-in, how to turn a brief into a strategy. That gap is where careers stall.",
    specializations: [
      { icon:"🏷",  title:"BRAND IDENTITY",    desc:"Build brands that stand out. Logo systems, visual language, guidelines, and brand governance." },
      { icon:"📐", title:"VISUAL STRATEGY",    desc:"From brand values to visual decisions. How to make design serve business objectives." },
      { icon:"🎬", title:"CAMPAIGN DESIGN",    desc:"Multi-channel campaign design for digital, OOH, print, and experiential." },
      { icon:"💼", title:"DESIGN LEADERSHIP",  desc:"Managing design teams, presenting work, and building a design culture in organizations." },
      { icon:"🖥",  title:"DIGITAL BRANDING",  desc:"Brand systems for digital products. Design tokens for brand, not just UI." },
      { icon:"✍️", title:"COPYWRITING & VOICE",desc:"Brand voice, tone, and writing as a design discipline." },
    ],
    qualifications: [
      { icon:"🎓", year:"2008 – 2012", title:"B.F.A. Graphic Design",      inst:"Rhode Island School of Design (RISD) — Honors" },
      { icon:"🎓", year:"2012 – 2014", title:"M.B.A. Design Strategy",     inst:"INSEAD — Dean's List" },
      { icon:"🏆", year:"2020",        title:"Cannes Lions Silver",         inst:"Brand Campaign: Nike 'Never Done' Series" },
      { icon:"🎤", year:"2023",        title:"SXSW Design Speaker",         inst:"'The Business of Beautiful Brands'" },
    ],
    timeline: [
      { year:"2020 – Present", company:"NIKE",  role:"Brand Director — Global Brand Identity", desc:"Lead global brand identity and visual language for Nike. Directed campaigns for Olympics 2020, World Cup 2022.", tags:["Brand Strategy","Campaign","Global","Leadership"] },
      { year:"2014 – 2020",    company:"IDEO",  role:"Creative Director",                      desc:"Led design strategy for clients including Apple, Ford, and UNICEF. Managed teams of 12 designers and strategists.", tags:["Design Strategy","UX","Research","Prototyping"] },
      { year:"2012 – 2014",    company:"W+K",   role:"Junior Art Director",                    desc:"Wieden+Kennedy. Worked on Nike, Old Spice, and ESPN global campaigns.", tags:["Advertising","Art Direction","Copywriting"] },
    ],
    myCourses: [
      { id:"c_m1", title:"Brand Identity & Visual Systems",       cat:"Design", sub:"Brand", level:"Intermediate", price:99, oldPrice:179, rating:4.82, reviews:2100, hours:32, projects:5, img:"https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"}], internship:false, students:14200, desc:"Design brand identity systems from scratch. Logo, color, typography, and guidelines used by real brands." },
      { id:"c_m2", title:"Design for Business Leaders",           cat:"Business", sub:"Design Strategy", level:"All Levels", price:79, oldPrice:139, rating:4.78, reviews:1890, hours:22, projects:3, img:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop&q=80", badges:[], internship:false, students:9800, desc:"Learn to present design work, build stakeholder buy-in, and align design with business strategy." },
    ],
    achievements: [
      { icon:"🏆", title:"Cannes Lions Silver 2020",   sub:"Nike 'Never Done' Campaign" },
      { icon:"🎤", title:"SXSW Design Speaker 2023",   sub:"The Business of Beautiful Brands" },
      { icon:"📖", title:"AIGA Medal Nominee 2022",    sub:"Excellence in Design Education" },
      { icon:"⭐", title:"25K Students Milestone",     sub:"Reached in 20 months" },
    ],
    skills: [
      { name:"Brand Identity Systems",  pct:99 },
      { name:"Visual Strategy",          pct:95 },
      { name:"Campaign Design",          pct:97 },
      { name:"Design Leadership",        pct:92 },
      { name:"Presentation / Pitching",  pct:94 },
    ],
    social: [
      { icon:"🔗", label:"linkedin.com/in/mayapateldesign", url:"#" },
      { icon:"🌐", label:"mayapatel.co",                    url:"#" },
      { icon:"🐦", label:"@maya_patel_design",              url:"#" },
    ],
    reviewItems: [
      { name:"LINH NGUYEN", course:"Brand Identity", date:"March 2025",    stars:5, text:"Maya's course is the first design education I've seen that treats brand as strategy, not decoration. The framework for presenting work to executives alone has changed my career trajectory." },
      { name:"TOM REYES",   course:"Design for Business", date:"January 2025", stars:5, text:"I'm a founder who needed to understand design. Maya made me understand not just what good design looks like, but why it creates business value. Worth more than any MBA class I've taken." },
    ],
  },

  {
    id: 5,
    name: "Raj Mehta",
    title: "Founder & CTO, GHA Data · Ex-Google Brain",
    specs: ["Data Science", "Python", "SQL"],
    bio: "Founded GHA Data acquired by Databricks. 3x entrepreneur, TEDx speaker, ex-Google Brain engineer.",
    rating: 4.85,
    reviews: 14300,
    students: 61000,
    courses: 9,
    exp: 13,
    liveClasses: 40,
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&q=80",
    bannerColor: "#14001a",
    badges: ["verified", "mentor"],
    bg: "startup",
    company: "Startup",

    fullBio: "I'm Raj Mehta — founder of GHA Data (acquired by Databricks in 2022), ex-Google Brain research engineer, and 3x entrepreneur. TEDx speaker. I've spent 13 years at the intersection of data engineering and ML.\n\nI teach data science the way engineers actually use it in production — not toy notebooks, but scalable pipelines, real SQL queries on real datasets, and models that get deployed and maintained.",
    specializations: [
      { icon:"🐍", title:"PYTHON FOR DATA",      desc:"Pandas, NumPy, Polars — data manipulation at scale, from CSVs to petabyte datasets." },
      { icon:"🗄",  title:"SQL & DATABASES",      desc:"Advanced SQL, query optimization, indexing, and working with PostgreSQL and BigQuery." },
      { icon:"📊", title:"DATA VISUALIZATION",   desc:"Matplotlib, Plotly, and building dashboards that executives actually understand." },
      { icon:"🔁", title:"DATA PIPELINES",       desc:"Airflow, dbt, Spark — building reliable, testable data pipelines for production." },
      { icon:"📈", title:"STATISTICAL ANALYSIS", desc:"A/B testing, regression analysis, causal inference, and experiment design." },
      { icon:"☁️", title:"CLOUD DATA PLATFORMS", desc:"BigQuery, Databricks, Snowflake — the modern data stack from ingestion to visualization." },
    ],
    qualifications: [
      { icon:"🎓", year:"2007 – 2011", title:"B.Tech. Computer Science", inst:"IIT Bombay — Gold Medal" },
      { icon:"🎓", year:"2011 – 2013", title:"M.S. Statistics",          inst:"Stanford University" },
      { icon:"🎤", year:"2019",        title:"TEDx Mumbai Speaker",       inst:"'Data is the New Design'" },
      { icon:"🏆", year:"2022",        title:"Databricks Acquisition",    inst:"GHA Data acquired for $180M" },
    ],
    timeline: [
      { year:"2022 – Present", company:"DATABRICKS", role:"Principal Engineer — Data Platform", desc:"Post-acquisition lead for DataForge integration into Databricks Unity Catalog.", tags:["Spark","Delta Lake","Python","Scala"] },
      { year:"2018 – 2022",    company:"GHA DATA",  role:"Founder & CTO",                     desc:"Built GHA Data from 0 to 200 enterprise customers before $180M acquisition by Databricks.", tags:["Startup","Python","SQL","Airflow","dbt"] },
      { year:"2013 – 2018",    company:"GOOGLE",     role:"Research Engineer — Google Brain",  desc:"Built production ML pipelines and data infrastructure for Google Search and Ads.", tags:["TensorFlow","BigQuery","Python","Distributed Computing"] },
    ],
    myCourses: [
      { id:"course_010", title:"Python for Data Science & Analytics", cat:"Data Science", sub:"Analytics", level:"Beginner", price:0, oldPrice:0, rating:4.7, reviews:8820, hours:28, projects:4, img:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-free",label:"Free"}], internship:false, students:41000, desc:"Complete introduction to Python for data analysis, visualization, and ML." },
      { id:"c_r2", title:"SQL Mastery for Data Engineers", cat:"Data Science", sub:"Databases", level:"Intermediate", price:89, oldPrice:159, rating:4.88, reviews:3200, hours:36, projects:5, img:"https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"}], internship:false, students:14000, desc:"Advanced SQL, query optimization, window functions, and working with BigQuery and PostgreSQL at scale." },
    ],
    achievements: [
      { icon:"🚀", title:"GHA Data Acquired $180M",  sub:"Databricks, 2022" },
      { icon:"🎤", title:"TEDx Speaker 2019",         sub:"'Data is the New Design'" },
      { icon:"📖", title:"O'Reilly Author",            sub:"'Data Engineering with Python', 2021" },
      { icon:"⭐", title:"60K Students Milestone",     sub:"Reached in 24 months" },
    ],
    skills: [
      { name:"Python / Pandas / Polars", pct:99 },
      { name:"SQL / Database Design",    pct:97 },
      { name:"Apache Spark / dbt",       pct:93 },
      { name:"Statistical Analysis",     pct:94 },
      { name:"Data Visualization",       pct:90 },
    ],
    social: [
      { icon:"🔗", label:"linkedin.com/in/rajmehta-data", url:"#" },
      { icon:"🐙", label:"github.com/rajmehta",           url:"#" },
      { icon:"🐦", label:"@rajmehta_data",                url:"#" },
      { icon:"🌐", label:"rajmehta.io",                   url:"#" },
    ],
    reviewItems: [
      { name:"PRIYA BANSAL", course:"Python for Data",  date:"March 2025",    stars:5, text:"Raj's Python course is the most practical data science education I've encountered. By lesson 5 I was working with real datasets. By lesson 15 I had my first Kaggle competition bronze medal." },
      { name:"EMMA LAWSON",  course:"SQL Mastery",      date:"February 2025", stars:5, text:"I've been writing SQL for 3 years and thought I knew it. The window functions and query optimization sections opened up an entirely new dimension. Rewritten all my analytics queries since." },
    ],
  },

  {
    id: 6,
    name: "Lena Shore",
    title: "Motion Director — Netflix, Apple, HBO",
    specs: ["Motion", "After Effects", "3D"],
    bio: "Award-winning motion director with work airing on Netflix, Apple, and HBO. Teaches the art of cinematic storytelling.",
    rating: 4.78,
    reviews: 4800,
    students: 21000,
    courses: 7,
    exp: 9,
    liveClasses: 28,
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80",
    bannerColor: "#0a0014",
    badges: ["new"],
    bg: "startup",
    company: "Startup",

    fullBio: "I'm Lena Shore — freelance motion director whose work has aired on Netflix, Apple TV+, HBO, and BBC. I've won three Motionographer awards and a Promax Gold for broadcast design.\n\nI teach motion design because most tutorials teach you which buttons to click. I teach you to think cinematically — to feel the timing, see the composition, and understand why great motion makes people feel something.",
    specializations: [
      { icon:"🎬", title:"CINEMATIC MOTION",     desc:"Timing, easing, spatial composition — the invisible craft that separates good from great." },
      { icon:"✨", title:"AFTER EFFECTS",         desc:"Expressions, shape layers, 3D layers, and building reusable motion templates." },
      { icon:"🧊", title:"3D & CINEMA 4D",       desc:"Integrate 3D into motion workflows. Lighting, materials, and physical simulation." },
      { icon:"📺", title:"BROADCAST DESIGN",     desc:"Title sequences, openers, lower thirds — the language of broadcast motion graphics." },
      { icon:"📱", title:"UI MOTION",            desc:"Micro-animations for apps and web. Lottie, GSAP, and the principles of UI motion." },
      { icon:"🎵", title:"SOUND DESIGN",         desc:"How audio and motion work together. Scoring to picture and building audio-reactive graphics." },
    ],
    qualifications: [
      { icon:"🎓", year:"2011 – 2015", title:"B.F.A. Animation & Motion Design", inst:"Savannah College of Art and Design (SCAD)" },
      { icon:"🏆", year:"2020",        title:"Motionographer Award — Title Sequence", inst:"'Liminal' — Netflix Original" },
      { icon:"🏆", year:"2022",        title:"Promax Gold — Best Broadcast Design",  inst:"HBO Max rebrand campaign" },
      { icon:"🎤", year:"2023",        title:"Motion+ Conference Speaker",           inst:"'Designing for Emotion in Motion'" },
    ],
    timeline: [
      { year:"2019 – Present", company:"FREELANCE",  role:"Motion Director",                      desc:"Directing motion design for global brands and streaming platforms. Recent clients: Netflix, Apple TV+, HBO.", tags:["After Effects","Cinema 4D","Motion","Direction"] },
      { year:"2016 – 2019",    company:"BUCK",       role:"Senior Motion Designer",               desc:"Award-winning motion design studio. Led broadcast design for FOX Sports, Netflix, and ESPN.", tags:["After Effects","C4D","Broadcast","Team Lead"] },
      { year:"2015 – 2016",    company:"ELASTIC",    role:"Junior Motion Designer",               desc:"Title sequence studio (Game of Thrones, True Detective). Junior designer on multiple Emmy-nominated sequences.", tags:["After Effects","Nuke","VFX","Title Design"] },
    ],
    myCourses: [
      { id:"c_l1", title:"After Effects Pro Workflow", cat:"Motion", sub:"Motion Graphics", level:"Intermediate", price:109, oldPrice:199, rating:4.7, reviews:1243, hours:30, projects:10, img:"https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-new",label:"New"}], internship:false, students:6700, desc:"Cinematic motion graphics, 3D integration, and broadcast-level animation workflows." },
      { id:"c_l2", title:"Cinematic Motion Design Principles", cat:"Motion", sub:"Film", level:"Beginner", price:89, oldPrice:159, rating:4.82, reviews:980, hours:24, projects:6, img:"https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=200&fit=crop&q=80", badges:[], internship:false, students:5400, desc:"Learn the invisible craft of motion: timing, easing, spatial composition, and emotional pacing." },
    ],
    achievements: [
      { icon:"🏆", title:"Motionographer Award 2020",  sub:"Best Title Sequence — Netflix 'Liminal'" },
      { icon:"🥇", title:"Promax Gold 2022",           sub:"Best Broadcast Design — HBO Max" },
      { icon:"🎤", title:"Motion+ Speaker 2023",       sub:"Designing for Emotion in Motion" },
      { icon:"⭐", title:"20K Students Milestone",     sub:"Reached in 16 months" },
    ],
    skills: [
      { name:"After Effects",   pct:99 },
      { name:"Cinema 4D",       pct:92 },
      { name:"Motion Direction",pct:97 },
      { name:"Broadcast Design",pct:95 },
      { name:"UI Animation",    pct:85 },
    ],
    social: [
      { icon:"🔗", label:"linkedin.com/in/lenashore", url:"#" },
      { icon:"🌐", label:"lenashore.motion",          url:"#" },
      { icon:"🐦", label:"@lena_shore_motion",        url:"#" },
      { icon:"📸", label:"instagram: @lenashore",     url:"#" },
    ],
    reviewItems: [
      { name:"CARLOS MENDEZ", course:"After Effects Pro", date:"March 2025",    stars:5, text:"Lena teaches motion design like a cinematographer, not a software trainer. After this course, I look at every animation differently. My client work has completely transformed." },
      { name:"ANA SILVA",     course:"Cinematic Motion",  date:"January 2025",  stars:5, text:"I've been doing motion design for 2 years and thought I understood timing. Lena's explanation of how to 'feel' easing curves physically changed how I approach every animation." },
    ],
  },

  {
    id: 7,
    name: "Marcus Lee",
    title: "Principal Engineer @ Amazon · AWS Architect",
    specs: ["Web Dev", "AWS", "Microservices"],
    bio: "Principal engineer at Amazon with 15+ years. Architect of systems that handle billions of transactions. AWS certified.",
    rating: 4.91,
    reviews: 11200,
    students: 52000,
    courses: 11,
    exp: 15,
    liveClasses: 36,
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80",
    bannerColor: "#001a14",
    badges: ["top", "verified"],
    bg: "faang",
    company: "FAANG",

    fullBio: "I'm Marcus Lee — Principal Engineer at Amazon, where I architect the systems behind Amazon's third-party marketplace processing billions of API calls daily. 15+ years of distributed systems experience across Amazon, Microsoft, and two acquired startups.\n\nI hold 7 AWS certifications and speak at AWS re:Invent regularly. I teach cloud architecture because most cloud courses teach you console clicks — I teach you to architect for scale, security, and cost.",
    specializations: [
      { icon:"☁️", title:"AWS ARCHITECTURE",    desc:"Well-Architected Framework, multi-region, disaster recovery, and cost optimization." },
      { icon:"🏗",  title:"SYSTEM DESIGN",       desc:"Distributed systems design for FAANG-level interviews and real production systems." },
      { icon:"🔐", title:"CLOUD SECURITY",       desc:"IAM, VPCs, encryption, zero-trust, and AWS security best practices." },
      { icon:"📦", title:"CONTAINERS & K8S",    desc:"ECS, EKS, Fargate, and running Kubernetes clusters at Amazon scale." },
      { icon:"⚡", title:"SERVERLESS",           desc:"Lambda, API Gateway, EventBridge — building event-driven serverless architectures." },
      { icon:"💰", title:"COST OPTIMIZATION",   desc:"FinOps for AWS — tagging strategies, reserved instances, Savings Plans, and cost anomaly detection." },
    ],
    qualifications: [
      { icon:"🎓", year:"2004 – 2008", title:"B.S. Computer Engineering",   inst:"University of Michigan" },
      { icon:"☁️", year:"2016",        title:"AWS Solutions Architect Pro",  inst:"Amazon Web Services" },
      { icon:"☁️", year:"2019",        title:"AWS DevOps Engineer Pro",      inst:"Amazon Web Services" },
      { icon:"🏆", year:"2023",        title:"AWS re:Invent Speaker",        inst:"'Patterns for Multi-Region Active-Active'" },
    ],
    timeline: [
      { year:"2015 – Present", company:"AMAZON",    role:"Principal Engineer — Marketplace Platform", desc:"Architect of Amazon's third-party seller APIs processing 4B+ daily API calls. Led migration to event-driven microservices.", tags:["AWS","Java","DynamoDB","Kafka","Lambda"] },
      { year:"2010 – 2015",    company:"MICROSOFT", role:"Senior Engineer — Azure Platform",         desc:"Built core Azure VM and networking services. Contributed to initial Azure API Management launch.", tags:["C#","Azure","Distributed Systems","Networking"] },
      { year:"2008 – 2010",    company:"STARTUP",   role:"Co-founder & CTO",                         desc:"Co-founded AdTech startup acquired by Microsoft in 2010.", tags:["AWS","Node.js","Real-time","Ad Tech"] },
    ],
    myCourses: [
      { id:"course_008", title:"AWS Solutions Architect Professional Prep",  cat:"DevOps", sub:"Cloud", level:"Advanced", price:39, oldPrice:69, rating:4.85, reviews:2103, hours:52, projects:4, img:"https://images.unsplash.com/photo-1516321318423-f06f70504646?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"}], internship:true, students:11200, desc:"Comprehensive AWS SAP certification prep with labs and real-world scenarios." },
      { id:"c_ml2", title:"System Design for FAANG Interviews", cat:"Backend", sub:"System Design", level:"Advanced", price:119, oldPrice:199, rating:4.92, reviews:4100, hours:40, projects:6, img:"https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"},{cls:"badge-hot",label:"Hot"}], internship:false, students:18000, desc:"Master system design interviews with real Amazon, Google, and Meta-style problems." },
    ],
    achievements: [
      { icon:"🏆", title:"AWS re:Invent Speaker 2023",  sub:"Multi-Region Active-Active Patterns" },
      { icon:"☁️", title:"7 AWS Certifications",        sub:"Including Solutions Architect Pro & DevOps Pro" },
      { icon:"📖", title:"Author: AWS at Scale",        sub:"Manning Publications, 2023" },
      { icon:"⭐", title:"50K Students Milestone",       sub:"Reached in 20 months" },
    ],
    skills: [
      { name:"AWS Architecture",       pct:99 },
      { name:"System Design",          pct:97 },
      { name:"Kubernetes / Containers",pct:93 },
      { name:"Cloud Security",         pct:91 },
      { name:"Serverless Architecture",pct:94 },
    ],
    social: [
      { icon:"🔗", label:"linkedin.com/in/marcuslee-aws", url:"#" },
      { icon:"🐙", label:"github.com/marcuslee",          url:"#" },
      { icon:"🐦", label:"@marcus_lee_aws",               url:"#" },
      { icon:"🌐", label:"marcuslee.cloud",               url:"#" },
    ],
    reviewItems: [
      { name:"KEVIN PARK",  course:"AWS Architect Prep", date:"March 2025",    stars:5, text:"Passed AWS Solutions Architect Professional on the first attempt. Marcus's mental models for VPC design and multi-region architecture are simply the best preparation available." },
      { name:"ZOE LAMBERT", course:"System Design",      date:"February 2025", stars:5, text:"Got offers from Amazon and Google after practicing with Marcus's system design framework. He teaches you not just to answer the questions, but to think like a principal engineer." },
    ],
  },

  {
    id: 9,
    name: "Tom Kessler",
    title: "Security Architect · Author · Researcher",
    specs: ["Cybersecurity", "Networking", "Blockchain"],
    bio: "Security researcher and author of 3 books on ethical hacking. Built security infrastructure for fintech unicorns.",
    rating: 4.9,
    reviews: 9800,
    students: 44000,
    courses: 10,
    exp: 16,
    liveClasses: 52,
    img: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&q=80",
    bannerColor: "#0a1400",
    badges: ["top", "verified"],
    bg: "research",
    company: "Research",

    fullBio: "I'm Tom Kessler — independent security researcher, author of 3 O'Reilly books on ethical hacking and network security, and former CISO at two fintech unicorns. I hold OSCP, CISSP, and CEH certifications.\n\nI teach cybersecurity because there's a massive shortage of skilled defenders. My courses don't just teach you to run tools — they teach you how attackers think, so you can build systems that are genuinely hard to compromise.",
    specializations: [
      { icon:"🔓", title:"ETHICAL HACKING",      desc:"Reconnaissance, exploitation, post-exploitation, and reporting — the full pentest lifecycle." },
      { icon:"🌐", title:"NETWORK SECURITY",     desc:"TCP/IP attacks, packet analysis, firewall bypass, and network forensics." },
      { icon:"🕸",  title:"WEB APP SECURITY",    desc:"OWASP Top 10, SQL injection, XSS, CSRF, SSRF, and modern API security." },
      { icon:"🔐", title:"CRYPTOGRAPHY",         desc:"Symmetric, asymmetric, hashing, TLS, and common cryptographic vulnerabilities." },
      { icon:"⛓",  title:"BLOCKCHAIN SECURITY", desc:"Smart contract auditing, DeFi attack vectors, and securing web3 applications." },
      { icon:"🏭", title:"CLOUD SECURITY",       desc:"AWS/GCP/Azure threat models, IAM misconfigurations, and cloud incident response." },
    ],
    qualifications: [
      { icon:"🎓", year:"2004 – 2008", title:"B.S. Computer Science",    inst:"Georgia Tech — Cybersecurity focus" },
      { icon:"🏆", year:"2012",        title:"OSCP Certification",        inst:"Offensive Security" },
      { icon:"🏆", year:"2015",        title:"CISSP Certification",       inst:"ISC2" },
      { icon:"📖", year:"2019",        title:"O'Reilly Author",           inst:"'Practical Ethical Hacking' — 40K copies sold" },
    ],
    timeline: [
      { year:"2020 – Present", company:"INDEPENDENT", role:"Security Researcher & Author", desc:"Independent security research, bug bounty programs, and authoring security curriculum used by 44,000+ engineers.", tags:["Python","Kali Linux","Burp Suite","Research"] },
      { year:"2016 – 2020",    company:"FINTECH CO",  role:"CISO",                         desc:"Chief Information Security Officer at two fintech unicorns. Built security programs from scratch.", tags:["GRC","Pentest","Compliance","Team Building"] },
      { year:"2008 – 2016",    company:"NSA → MITRE", role:"Security Analyst",             desc:"8 years in government cybersecurity. Focus on threat intelligence and critical infrastructure protection.", tags:["Malware Analysis","OSINT","ICS Security"] },
    ],
    myCourses: [
      { id:"course_011", title:"Ethical Hacking & Penetration Testing", cat:"Cybersecurity", sub:"Pen Testing", level:"Intermediate", price:109, oldPrice:169, rating:4.9, reviews:2341, hours:50, projects:7, img:"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-hot",label:"Hot"}], internship:false, students:10800, desc:"Master ethical hacking with real-world CTF challenges. CEH exam prep included." },
      { id:"c_t2", title:"Web Application Security & Bug Bounty", cat:"Cybersecurity", sub:"Web Security", level:"Intermediate", price:119, oldPrice:199, rating:4.88, reviews:3200, hours:44, projects:8, img:"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"}], internship:false, students:15000, desc:"OWASP Top 10, Burp Suite, bug bounty methodology — earn your first CVE." },
    ],
    achievements: [
      { icon:"📖", title:"3x O'Reilly Author",          sub:"Combined 80K+ copies sold" },
      { icon:"🏆", title:"DEF CON CTF Winner 2018",    sub:"Team lead for winning team" },
      { icon:"🎤", title:"Black Hat USA Speaker 2021",  sub:"'Attacking DeFi Protocols'" },
      { icon:"⭐", title:"40K Students Milestone",      sub:"Reached in 22 months" },
    ],
    skills: [
      { name:"Ethical Hacking / OSCP",  pct:99 },
      { name:"Web App Security",         pct:97 },
      { name:"Network Security",         pct:96 },
      { name:"Blockchain / Smart Contracts",pct:88 },
      { name:"Cloud Security",           pct:91 },
    ],
    social: [
      { icon:"🔗", label:"linkedin.com/in/tomkessler-sec", url:"#" },
      { icon:"🐙", label:"github.com/tomkessler",          url:"#" },
      { icon:"🐦", label:"@tomkessler_sec",                url:"#" },
      { icon:"🌐", label:"tomkessler.security",            url:"#" },
    ],
    reviewItems: [
      { name:"DMITRI VOLKOV", course:"Ethical Hacking",  date:"March 2025",    stars:5, text:"Tom is the first security instructor I've found who teaches you to think adversarially, not just run tools. The CTF challenges are real learning, not gamified busywork. Exceptional course." },
      { name:"ALICE MORGAN",  course:"Web App Security", date:"February 2025", stars:5, text:"Got my first bug bounty payout of $3,500 three weeks after finishing Tom's web security course. The SSRF and XXE sections were particularly eye-opening. Highly recommend." },
    ],
  },

  {
    id: 11,
    name: "Kevin Zhao",
    title: "AI Research Lead @ Anthropic · PhD Stanford",
    specs: ["Machine Learning", "LLMs", "Python"],
    bio: "AI research lead working on alignment and language models. PhD from Stanford. Published 20+ papers at NeurIPS and ICLR.",
    rating: 4.97,
    reviews: 3200,
    students: 16800,
    courses: 4,
    exp: 7,
    liveClasses: 16,
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&q=80",
    bannerColor: "#001214",
    badges: ["new", "mentor"],
    bg: "research",
    company: "Research",

    fullBio: "I'm Kevin Zhao — AI Research Lead at Anthropic working on AI alignment, interpretability, and language model capabilities. PhD in Machine Learning from Stanford.\n\nI've published 22 papers at NeurIPS, ICLR, and EMNLP. My research has been cited 3,000+ times and contributed to the development of Constitutional AI.\n\nI teach because the gap between academic ML and industry application is enormous. I want engineers to understand the real foundations — the math, the theory, and the engineering tradeoffs that determine whether a model works in production.",
    specializations: [
      { icon:"🧠", title:"LLM INTERNALS",        desc:"Transformer architecture, attention mechanisms, positional encodings, and KV cache." },
      { icon:"🎯", title:"AI ALIGNMENT",          desc:"Constitutional AI, RLHF, DPO, and the emerging science of making AI systems safe." },
      { icon:"🔬", title:"ML INTERPRETABILITY",  desc:"Mechanistic interpretability, feature visualization, and understanding model behavior." },
      { icon:"⚡", title:"EFFICIENT INFERENCE",   desc:"Quantization, pruning, speculative decoding, and running LLMs on consumer hardware." },
      { icon:"🏋",  title:"FINE-TUNING",          desc:"LoRA, QLoRA, PEFT methods, and instruction fine-tuning for custom domains." },
      { icon:"📐", title:"MATH FOR ML",           desc:"Linear algebra, probability, information theory, and optimization — the real foundations." },
    ],
    qualifications: [
      { icon:"🎓", year:"2015 – 2019", title:"B.S. Mathematics",           inst:"MIT — Summa Cum Laude" },
      { icon:"🎓", year:"2019 – 2023", title:"Ph.D. Machine Learning",     inst:"Stanford HAI — Thesis: 'Constitutional AI and Value Alignment'" },
      { icon:"📖", year:"2022",        title:"NeurIPS Best Paper Award",   inst:"'Direct Preference Optimization'" },
      { icon:"🏆", year:"2023",        title:"Forbes 30 Under 30",         inst:"AI & Machine Learning category" },
    ],
    timeline: [
      { year:"2023 – Present", company:"ANTHROPIC", role:"AI Research Lead — Alignment & Interpretability", desc:"Leading research on Constitutional AI, mechanical interpretability, and safe scaling laws for Claude models.", tags:["Python","JAX","PyTorch","Constitutional AI","Interpretability"] },
      { year:"2019 – 2023",    company:"STANFORD",  role:"PhD Researcher — HAI Lab",                       desc:"Research on preference learning, value alignment, and scalable oversight. Collaborated with Anthropic team on DPO.", tags:["Research","PyTorch","RLHF","NLP"] },
      { year:"2021",           company:"OPENAI",    role:"Research Intern",                                 desc:"Contributed to GPT-4 RLHF pipeline and reward modeling improvements.", tags:["RLHF","Python","Research"] },
    ],
    myCourses: [
      { id:"c_k1", title:"LLM Architecture: From Attention to GPT-4", cat:"ML", sub:"LLMs", level:"Advanced", price:149, oldPrice:249, rating:4.97, reviews:1800, hours:48, projects:4, img:"https://images.unsplash.com/photo-1555949519-a1911ea6f620?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-best",label:"Bestseller"},{cls:"badge-hot",label:"Hot"}], internship:false, students:9200, desc:"Understand every component of modern LLMs from first principles. Build a GPT from scratch in PyTorch." },
      { id:"c_k2", title:"AI Alignment & Safety Engineering",          cat:"ML", sub:"Alignment", level:"Advanced", price:129, oldPrice:219, rating:4.95, reviews:980, hours:36, projects:3, img:"https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=200&fit=crop&q=80", badges:[{cls:"badge-new",label:"New"}], internship:false, students:4800, desc:"Constitutional AI, RLHF, DPO — the emerging science of building AI systems that do what we want." },
    ],
    achievements: [
      { icon:"🏆", title:"NeurIPS Best Paper 2022",   sub:"'Direct Preference Optimization'" },
      { icon:"📰", title:"Forbes 30 Under 30",         sub:"AI & ML category, 2023" },
      { icon:"📖", title:"22 Published Papers",        sub:"3,000+ citations. NeurIPS, ICLR, EMNLP" },
      { icon:"⭐", title:"15K Students Milestone",     sub:"Reached in 10 months" },
    ],
    skills: [
      { name:"Transformer Architecture", pct:99 },
      { name:"RLHF / DPO / Alignment",   pct:98 },
      { name:"PyTorch / JAX",            pct:97 },
      { name:"ML Interpretability",      pct:95 },
      { name:"Fine-Tuning (LoRA/PEFT)",  pct:93 },
    ],
    social: [
      { icon:"🔗", label:"linkedin.com/in/kevinzhao-ai", url:"#" },
      { icon:"🐙", label:"github.com/kevinzhao",         url:"#" },
      { icon:"🐦", label:"@kevinzhao_ai",                url:"#" },
      { icon:"📄", label:"Scholar: Kevin Zhao",          url:"#" },
    ],
    reviewItems: [
      { name:"PAULO SALAVE'A", course:"LLM Architecture", date:"March 2025",    stars:5, text:"Kevin's explanation of attention mechanisms is the clearest I've ever encountered. I've read the original Attention paper 10 times. After Kevin's course, I finally understand WHY multi-head attention works, not just how." },
      { name:"FATIMA AL-RASHID",course:"AI Alignment",    date:"February 2025", stars:5, text:"I work in policy and wanted to understand alignment technically. Kevin bridges the gap between research papers and practical understanding perfectly. Genuinely one of the best courses I've ever taken." },
    ],
  },
];

/* ════════════════════════════════════════
   FILTER & SORT HELPERS
════════════════════════════════════════ */

export function filterInstructors(instructors, activeFilters, searchQuery) {
  return instructors.filter((i) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !i.name.toLowerCase().includes(q) &&
        !i.title.toLowerCase().includes(q) &&
        !i.specs.some((s) => s.toLowerCase().includes(q))
      ) return false;
    }
    if (activeFilters.spec?.length && !activeFilters.spec.some((s) => i.specs.includes(s))) return false;
    if (activeFilters.rating?.length) {
      const mn = Math.min(...activeFilters.rating.map((r) => parseFloat(r)));
      if (i.rating < mn) return false;
    }
    if (activeFilters.students?.length) {
      const ok = activeFilters.students.some((s) => {
        if (s === "1K+")  return i.students >= 1000;
        if (s === "5K+")  return i.students >= 5000;
        if (s === "20K+") return i.students >= 20000;
        if (s === "50K+") return i.students >= 50000;
        return false;
      });
      if (!ok) return false;
    }
    if (activeFilters.courses?.length) {
      const ok = activeFilters.courses.some((c) => {
        if (c === "1-4") return i.courses >= 1 && i.courses <= 4;
        if (c === "5-9") return i.courses >= 5 && i.courses <= 9;
        if (c === "10+") return i.courses >= 10;
        return false;
      });
      if (!ok) return false;
    }
    if (activeFilters.reviews?.length) {
      const ok = activeFilters.reviews.some((r) => {
        if (r === "500+") return i.reviews >= 500;
        if (r === "2K+")  return i.reviews >= 2000;
        if (r === "5K+")  return i.reviews >= 5000;
        return false;
      });
      if (!ok) return false;
    }
    if (activeFilters.company?.length) {
      const ok = activeFilters.company.some((c) => {
        if (c === "FAANG")    return i.bg === "faang";
        if (c === "Startup")  return i.bg === "startup";
        if (c === "Research") return i.bg === "research";
        if (c === "Mentor")   return i.liveClasses > 30;
        return false;
      });
      if (!ok) return false;
    }
    if (activeFilters.expRange) {
      const [mn, mx] = activeFilters.expRange;
      if (i.exp < mn || i.exp > mx) return false;
    }
    return true;
  });
}

export function sortInstructors(instructors, sortMode) {
  return [...instructors].sort((a, b) => {
    if (sortMode === "rating")   return b.rating - a.rating;
    if (sortMode === "students") return b.students - a.students;
    if (sortMode === "courses")  return b.courses - a.courses;
    if (sortMode === "exp")      return b.exp - a.exp;
    if (sortMode === "reviews")  return b.reviews - a.reviews;
    return b.students - a.students;
  });
}

export function getInstructorById(id) {
  return mockInstructors.find((i) => String(i.id) === String(id)) || null;
}

export function getRelatedInstructors(id, limit = 3) {
  const inst = getInstructorById(id);
  if (!inst) return [];
  return mockInstructors
    .filter((i) => i.id !== inst.id && i.specs.some((s) => inst.specs.includes(s)))
    .slice(0, limit);
}

export default mockInstructors;