import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Server } from 'lucide-react';

const privacyItems = [
  { icon: Lock, title: 'E2E Encrypted', desc: 'All messages encrypted by default' },
  { icon: Eye, title: 'No Tracking', desc: 'Zero behavioral analytics' },
  { icon: Server, title: 'No Data Sales', desc: 'Your data is never monetized' },
  { icon: Shield, title: 'Open Protocol', desc: 'Auditable security architecture' },
];

const PrivacySection = () => {
  return (
    <section id="security" className="py-32 relative">
      <div className="absolute inset-0 bg-primary/[0.02]" />
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-online/10 border border-online/20 mb-6">
            <Shield className="w-4 h-4 text-online" />
            <span className="text-sm text-online font-medium">Privacy First</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Your privacy is <span className="text-gradient">non-negotiable</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-16">
            Every message, call, and file is protected with state-of-the-art encryption.
            We never sell your data or track your behavior.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {privacyItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/50 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-online/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-6 h-6 text-online" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PrivacySection;
