import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-temporary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Now with AI-powered conversations</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-foreground leading-[1.1]"
          >
            Messaging,{' '}
            <span className="text-gradient">reimagined</span>
            <br />
            for the modern era
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Experience conversations that adapt to you. With built-in AI, temporary chats,
            and end-to-end encryption, Pulse is the messaging platform you've been waiting for.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all shadow-glow hover:shadow-lg"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-secondary text-secondary-foreground font-semibold text-base hover:bg-surface-hover transition-all border border-border/50"
            >
              Open App
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <div className="w-3 h-3 rounded-full bg-online/60" />
              <span className="ml-3 text-xs text-muted-foreground">Pulse — Messaging</span>
            </div>
            <div className="flex h-80 md:h-96">
              <div className="w-1/3 border-r border-border/30 p-3 space-y-2">
                {['Sarah Chen', 'my.ai', 'Design Team', 'Marcus Williams'].map((name, i) => (
                  <div key={name} className={`flex items-center gap-3 p-2.5 rounded-xl ${i === 0 ? 'bg-surface-hover' : ''}`}>
                    <div className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0 hidden md:block">
                      <div className="text-sm font-medium text-foreground truncate">{name}</div>
                      <div className="text-xs text-muted-foreground truncate">Latest message preview...</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col p-4">
                <div className="flex-1 space-y-3">
                  <div className="flex justify-start">
                    <div className="bg-chat-incoming px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-foreground max-w-[70%]">
                      Check out the new design mockups! 🎨
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-chat-outgoing px-4 py-2.5 rounded-2xl rounded-br-md text-sm text-foreground max-w-[70%]">
                      These look incredible! Love the palette.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-chat-incoming px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-foreground max-w-[70%]">
                      Thanks! Let me send you the Figma file 📎
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-10 rounded-xl bg-surface-3 border border-border/30" />
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
