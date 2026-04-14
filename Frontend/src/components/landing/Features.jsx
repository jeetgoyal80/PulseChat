import { motion } from 'framer-motion';
import { Shield, Zap, Clock, Users, Sparkles, Lock } from 'lucide-react';

const features = [
  { icon: Sparkles, title: 'AI Assistant', description: 'Built-in AI helps you draft replies, summarize conversations, and stay productive.' },
  { icon: Clock, title: 'Temporary Chats', description: 'Set messages to auto-expire. Same conversation, temporary mode — your choice.' },
  { icon: Shield, title: 'End-to-End Encrypted', description: 'Every message is encrypted by default. Your conversations stay truly private.' },
  { icon: Zap, title: 'Lightning Fast', description: 'Optimized for speed. Messages deliver instantly with minimal latency.' },
  { icon: Users, title: 'Rich Group Chats', description: 'Create groups with admin controls, mentions, polls, and shared media.' },
  { icon: Lock, title: 'Privacy First', description: 'No data selling, no ad tracking. Your privacy is not a product.' },
];

const Features = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Everything you need,{' '}
            <span className="text-gradient">nothing you don't</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Pulse combines powerful features with a minimal, distraction-free interface.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-glow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
