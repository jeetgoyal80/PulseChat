import { motion } from 'framer-motion';
import { Phone, Video, Users, Minimize2 } from 'lucide-react';

const callingFeatures = [
  { icon: Phone, text: 'HD voice calls with noise cancellation' },
  { icon: Video, text: 'Video calls with screen sharing' },
  { icon: Users, text: 'Group calls up to 32 participants' },
];

const CallingSection = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              <div className="relative aspect-[4/3] bg-gradient-to-b from-surface-2 to-background flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-surface-3 flex items-center justify-center mb-4">
                  <span className="text-2xl font-semibold text-foreground">SC</span>
                </div>
                <div className="text-lg font-semibold text-foreground">Sarah Chen</div>
                <div className="text-sm text-primary mt-1">12:45</div>
                <div className="flex items-center gap-4 mt-8">
                  <button className="w-12 h-12 rounded-full bg-surface-3 hover:bg-surface-hover transition-colors flex items-center justify-center">
                    <Minimize2 className="w-5 h-5 text-foreground" />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-surface-3 hover:bg-surface-hover transition-colors flex items-center justify-center">
                    <Video className="w-5 h-5 text-foreground" />
                  </button>
                  <button className="w-14 h-14 rounded-full bg-destructive hover:bg-destructive/80 transition-colors flex items-center justify-center">
                    <Phone className="w-6 h-6 text-destructive-foreground rotate-[135deg]" />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-surface-3 hover:bg-surface-hover transition-colors flex items-center justify-center">
                    <Users className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Crystal clear{' '}
              <span className="text-gradient">calls</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              HD voice and video calls with noise cancellation.
              Group calls for up to 32 people, screen sharing, and a minimized call widget so you can multitask.
            </p>
            <div className="space-y-4">
              {callingFeatures.map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CallingSection;
