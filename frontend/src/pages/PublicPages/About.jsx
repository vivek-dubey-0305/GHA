import { motion } from "framer-motion";
import { Users, Target, Award, Zap, Heart, Globe } from "lucide-react";
import PageLayout from "../../components/layout/PageLayout";
import { fadeInUp, staggerContainer, staggerItem } from "../../components/animations";

const values = [
  {
    icon: Target,
    title: "Mission Driven",
    description: "Democratizing quality tech education for learners worldwide, breaking barriers to knowledge and opportunity.",
  },
  {
    icon: Users,
    title: "Community First",
    description: "Building a supportive ecosystem where learners, instructors, and industry experts collaborate and grow together.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Delivering industry-standard curriculum crafted by experts and continuously updated with latest technologies.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Pioneering new ways of learning through interactive content, live sessions, and real-world projects.",
  },
  {
    icon: Heart,
    title: "Student Success",
    description: "Committed to your growth beyond academics—career support, mentorship, and lifetime learning opportunities.",
  },
  {
    icon: Globe,
    title: "Global Impact",
    description: "Creating opportunities for learners across continents to build careers without geographical limitations.",
  },
];

const stats = [
  { label: "Active Students", value: "50K+", icon: "📚" },
  { label: "Expert Instructors", value: "500+", icon: "👨‍🏫" },
  { label: "Courses Available", value: "320+", icon: "🎓" },
  { label: "Countries Reached", value: "45+", icon: "🌍" },
];

export default function About() {
  return (
    <PageLayout
      title="About GreedHunterAcademy"
      description="Where Ambition Meets Education—Learn, Grow, and Transform Your Future"
    >
      {/* Story Section */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-24"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Our Story & Vision
            </h2>
            <p className="text-lg text-gray-400 mb-4 leading-relaxed">
              GreedHunterAcademy was born from a simple belief: quality education should be accessible to everyone, everywhere. Founded by a team of passionate educators and tech enthusiasts, we created a platform that combines cutting-edge technology with expert instruction.
            </p>
            <p className="text-lg text-gray-400 mb-4 leading-relaxed">
              Today, we're not just an educational platform—we're a movement. We empower learners to pursue their ambitions, instructors to share their expertise, and companies to find talented professionals.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              Every learner on our platform represents a life transformed, a career launched, and a future unlimited. That's the GreedHunter promise.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-yellow-500/20 to-transparent p-8 border border-yellow-500/20">
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <p className="text-gray-400">Visual Journey Coming Soon</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="mb-24 py-16 rounded-lg border border-yellow-500/10 bg-gradient-to-br from-yellow-500/5 to-transparent"
      >
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat, idx) => (
            <motion.div key={idx} variants={staggerItem} className="text-center">
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-4xl font-bold text-yellow-500 mb-2">{stat.value}</div>
              <p className="text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Values Section */}
      <motion.section className="mb-24">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl lg:text-4xl font-bold mb-16 text-center"
          style={{ fontFamily: "'Bebas Neue', sans-serif" }}
        >
          Our Core Values
        </motion.h2>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {values.map((value, idx) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={idx}
                variants={staggerItem}
                whileHover={{ y: -8 }}
                className="p-8 rounded-lg border border-yellow-500/10 bg-gradient-to-br from-yellow-500/5 to-transparent hover:border-yellow-500/30 transition-colors"
              >
                <Icon className="w-10 h-10 text-yellow-500 mb-4" />
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-400 leading-relaxed">{value.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* Why Join Section */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-yellow-500/10 to-transparent p-12 rounded-lg border border-yellow-500/20"
      >
        <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          Why Choose GreedHunterAcademy?
        </h2>
        <ul className="space-y-4">
          {[
            "Learn from industry veterans with 10+ years of experience",
            "Access lifetime course materials and community support",
            "Get recognized certifications valued by top companies",
            "Build a portfolio with real-world projects",
            "Join a thriving community of 50,000+ learners",
            "Career guidance and job placement assistance",
          ].map((item, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-4 text-gray-300"
            >
              <span className="text-yellow-500 text-2xl flex-shrink-0">✓</span>
              <span className="text-lg">{item}</span>
            </motion.li>
          ))}
        </ul>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={fadeInUp.initial}
        whileInView={fadeInUp.animate}
        viewport={{ once: true }}
        className="text-center mt-24"
      >
        <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          Ready to Join the Movement?
        </h2>
        <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
          Start your learning journey today and be part of a global community transforming lives through education.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all">
            Start Learning Free
          </button>
          <button className="px-8 py-3 border-2 border-yellow-500 text-yellow-500 font-bold rounded-lg hover:bg-yellow-500/10 transition-all">
            Explore Courses
          </button>
        </div>
      </motion.section>
    </PageLayout>
  );
}
