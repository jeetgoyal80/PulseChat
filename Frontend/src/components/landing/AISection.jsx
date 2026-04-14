import { motion } from 'framer-motion';
import { Bot, MessageSquare, Globe, CalendarDays, Lightbulb } from 'lucide-react';

const prompts = [
  { icon: MessageSquare, text: 'Summarize this chat' },
  { icon: Globe, text: 'Translate this message' },
  { icon: CalendarDays, text: 'Plan my day' },
  { icon: Lightbulb, text: 'Explain this topic' },
];

const AISection = () => {
  return (
    <section id="ai-assistant" className="py-32 relative">
      <div className="absolute inset-0 bg-primary/[0.02]" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-temporary/10 border border-temporary/20 mb-6">
              <Bot className="w-4 h-4 text-temporary" />
              <span className="text-sm text-temporary font-medium">AI-Powered</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              Meet <span className="text-gradient">my.ai</span>,<br />
              your chat companion
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              An intelligent assistant that lives right inside your conversations.
              Draft replies, summarize threads, translate messages, and more — all without leaving Pulse.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {prompts.map((prompt) => (
                <div key={prompt.text} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
                  <prompt.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{prompt.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-temporary flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">my.ai</div>
                  <div className="text-xs text-primary">Always available</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-chat-outgoing px-4 py-2.5 rounded-2xl rounded-br-md text-sm text-foreground">
                    Can you summarize my chat with Sarah?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-chat-incoming px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-foreground max-w-[90%]">
                    Here's a summary of your conversation with Sarah Chen:
                    <br /><br />
                    📌 She shared new design mockups<br />
                    📌 You discussed the color palette<br />
                    📌 She sent a Figma file for review<br />
                    📌 Next step: Schedule a review session
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AISection;
