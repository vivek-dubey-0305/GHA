import { useState } from "react";
import { motion } from "framer-motion";
import PageLayout from "../../components/layout/PageLayout";
import { fadeInUp, staggerContainer, staggerItem } from "../../components/animations";
import { Users, Briefcase, Heart, TrendingUp, MapPin, DollarSign, ChevronRight } from "lucide-react";

const jobOpenings = [
  {
    id: 1,
    title: "Senior Full Stack Developer",
    department: "Engineering",
    location: "San Francisco, CA",
    type: "Full-time",
    experience: "5+ years",
    salary: "$150K - $200K",
    description: "Build scalable backend systems and modern frontend interfaces for millions of learners.",
    tags: ["React", "Node.js", "MongoDB", "AWS"],
  },
  {
    id: 2,
    title: "Course Curriculum Developer",
    department: "Content",
    location: "Remote",
    type: "Full-time",
    experience: "3+ years",
    salary: "$80K - $120K",
    description: "Create engaging, structured courses that transform lives and careers.",
    tags: ["Instructional Design", "Subject Matter Expertise", "Video Production"],
  },
  {
    id: 3,
    title: "Customer Success Manager",
    department: "Support",
    location: "New York, NY",
    type: "Full-time",
    experience: "2+ years",
    salary: "$70K - $100K",
    description: "Ensure our learners and instructors achieve their goals on our platform.",
    tags: ["Customer Service", "Problem Solving", "Communication"],
  },
  {
    id: 4,
    title: "Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    experience: "4+ years",
    salary: "$90K - $130K",
    description: "Tell our story to millions of future learners around the world.",
    tags: ["Digital Marketing", "Content Strategy", "Analytics"],
  },
  {
    id: 5,
    title: "DevOps Engineer",
    department: "Engineering",
    location: "San Francisco, CA",
    type: "Full-time",
    experience: "3+ years",
    salary: "$120K - $160K",
    description: "Build and maintain infrastructure serving millions of daily active users.",
    tags: ["Kubernetes", "Docker", "CI/CD", "AWS"],
  },
  {
    id: 6,
    title: "Data Analyst",
    department: "Analytics",
    location: "Remote",
    type: "Full-time",
    experience: "2+ years",
    salary: "$85K - $125K",
    description: "Transform data into insights that drive product and business decisions.",
    tags: ["Python", "SQL", "Tableau", "Statistics"],
  },
];

const benefits = [
  {
    icon: "💰",
    title: "Competitive Salary",
    description: "Industry-leading compensation packages with annual bonuses and equity options."
  },
  {
    icon: "🏥",
    title: "Comprehensive Health",
    description: "Medical, dental, and vision insurance for you and your family."
  },
  {
    icon: "🧘",
    title: "Wellness Program",
    description: "Mental health support, gym membership, and mindfulness resources."
  },
  {
    icon: "📚",
    title: "Learning Budget",
    description: "$2,000 annual budget for courses, conferences, and skill development."
  },
  {
    icon: "⏰",
    title: "Flexible Work",
    description: "Remote options, flexible hours, and results-oriented work environment."
  },
  {
    icon: "🎓",
    title: "Free Courses",
    description: "Unlimited access to all GreedHunterAcademy courses."
  },
  {
    icon: "👥",
    title: "Great Team",
    description: "Work with passionate, collaborative people from diverse backgrounds."
  },
  {
    icon: "🚀",
    title: "Growth Opportunity",
    description: "Clear career paths and mentorship from experienced leaders."
  },
];

const values = [
  {
    title: "Mission-Driven",
    description: "We're committed to democratizing education and changing lives through learning.",
  },
  {
    title: "Continuous Learning",
    description: "We encourage growth mindset and provide resources for professional development.",
  },
  {
    title: "Collaboration",
    description: "We succeed together. Open communication and diverse perspectives are valued.",
  },
  {
    title: "Innovation",
    description: "We embrace new ideas and aren't afraid to challenge the status quo.",
  },
];

export default function Careers() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterDept, setFilterDept] = useState("All");

  const departments = ["All", ...new Set(jobOpenings.map(job => job.department))];
  const filteredJobs = filterDept === "All" 
    ? jobOpenings 
    : jobOpenings.filter(job => job.department === filterDept);

  return (
    <PageLayout
      title="Join the GreedHunter Team"
      description="Help us transform education and build careers for millions worldwide."
    >
      {/* Culture Section */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-20 grid lg:grid-cols-2 gap-12 items-center"
      >
        <div>
          <h2 className="text-3xl font-bold mb-6 text-yellow-500">Our Culture</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            At GreedHunterAcademy, we believe that education has the power to change lives. Our team is composed of passionate individuals from diverse backgrounds, united by a common mission: to make quality learning accessible to everyone.
          </p>
          <p className="text-gray-400 leading-relaxed mb-6">
            We value innovation, collaboration, and continuous learning. We're not just building a product—we're building a movement. If you're excited about making an impact on millions of lives, you belong here.
          </p>
          <ul className="space-y-3">
            {[
              "Inclusive and diverse workplace",
              "Supportive, collaborative culture",
              "Impact-driven work with global reach",
              "Continuous learning and growth",
            ].map((item, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 text-gray-300"
              >
                <span className="text-yellow-500 text-2xl">✓</span>
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-yellow-500/20 to-transparent p-8 border border-yellow-500/20">
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <p className="text-gray-400">Team Culture</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Values Grid */}
      <motion.section className="mb-20">
        <h2 className="text-3xl font-bold mb-12 text-center text-yellow-500">Our Core Values</h2>
        
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {values.map((value, idx) => (
            <motion.div
              key={idx}
              variants={staggerItem}
              whileHover={{ y: -8 }}
              className="p-6 rounded-lg bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/10 hover:border-yellow-500/30 transition-all"
            >
              <h3 className="text-xl font-bold mb-3 text-yellow-500">{value.title}</h3>
              <p className="text-gray-400 leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Benefits Section */}
      <motion.section className="mb-20">
        <h2 className="text-3xl font-bold mb-12 text-center text-yellow-500">Why Work With Us</h2>
        
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              variants={staggerItem}
              className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/10 hover:border-blue-500/30 transition-all"
            >
              <div className="text-4xl mb-3">{benefit.icon}</div>
              <h3 className="font-bold mb-2">{benefit.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Open Positions */}
      <motion.section className="mb-20">
        <h2 className="text-3xl font-bold mb-12 text-center text-yellow-500">Open Positions</h2>

        {/* Filter */}
        <motion.div
          initial={fadeInUp.initial}
          whileInView={fadeInUp.animate}
          viewport={{ once: true }}
          className="flex gap-3 mb-8 overflow-x-auto pb-4"
        >
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                filterDept === dept
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {dept}
            </button>
          ))}
        </motion.div>

        {/* Job Listings */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {filteredJobs.map((job, idx) => (
            <motion.div
              key={job.id}
              variants={staggerItem}
              onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
              className="p-6 rounded-lg border border-yellow-500/10 bg-gradient-to-r from-yellow-500/5 to-transparent hover:border-yellow-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-xl font-bold">{job.title}</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mb-4 text-gray-400 text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span>{job.type}</span>
                    <span>{job.experience}</span>
                    <span className="flex items-center gap-1 text-yellow-500">
                      <DollarSign className="w-4 h-4" />
                      {job.salary}
                    </span>
                  </div>

                  <p className="text-gray-300 mb-3">{job.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-800/50 text-gray-300 text-sm rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <ChevronRight className={`w-6 h-6 text-yellow-500 flex-shrink-0 transition-transform ${selectedJob === job.id ? 'rotate-90' : ''}`} />
              </div>

              {/* Expanded Content */}
              {selectedJob === job.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-yellow-500/10 space-y-4"
                >
                  <div>
                    <h4 className="font-bold mb-2 text-yellow-500">Full Description</h4>
                    <p className="text-gray-300 leading-relaxed">
                      We're looking for a talented professional to join our {job.department} team. You'll have the opportunity to work on products used by millions of learners worldwide.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold mb-2 text-yellow-500">Responsibilities</h4>
                    <ul className="space-y-2 text-gray-300">
                      <li>✓ Contribute to meaningful projects that impact global education</li>
                      <li>✓ Collaborate with a diverse and talented team</li>
                      <li>✓ Participate in continuous learning and development</li>
                    </ul>
                  </div>

                  <button className="w-full px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all">
                    Apply Now
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Didn't find your role CTA */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="text-center py-12 px-8 rounded-lg bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20"
      >
        <h2 className="text-2xl font-bold mb-4">Don't see your role?</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          We're always looking for talented people. Send us your resume and tell us what you'd like to work on.
        </p>
        <button className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all">
          Submit Your Resume
        </button>
      </motion.section>

      {/* Culture Snapshots */}
      <motion.section className="mt-20">
        <h2 className="text-3xl font-bold mb-12 text-center text-yellow-500">Meet Our Team</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: "Alex Chen", role: "Senior Developer", image: "👨‍💻" },
            { name: "Sarah Johnson", role: "Content Lead", image: "👩‍🏫" },
            { name: "Marcus Williams", role: "Product Manager", image: "👨‍💼" },
            { name: "Priya Patel", role: "UX Designer", image: "👩‍🎨" },
            { name: "James Miller", role: "Community Manager", image: "👨‍🤝‍👨" },
            { name: "Emma Davis", role: "HR Manager", image: "👩‍💼" },
          ].map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center p-6 rounded-lg bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/10"
            >
              <div className="text-5xl mb-3">{member.image}</div>
              <h3 className="font-bold text-lg">{member.name}</h3>
              <p className="text-gray-400 text-sm">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </PageLayout>
  );
}
