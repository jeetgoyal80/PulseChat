import { motion } from 'framer-motion';
import { ChevronLeft, Bell, Lock, Palette, User, Globe, HelpCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const settingsItems = [
  { icon: User, label: 'Account', desc: 'Profile, phone, email' },
  { icon: Lock, label: 'Privacy', desc: 'Blocked contacts, read receipts' },
  { icon: Bell, label: 'Notifications', desc: 'Sound, vibration, popup' },
  { icon: Palette, label: 'Appearance', desc: 'Theme, font size, chat wallpaper' },
  { icon: Globe, label: 'Language', desc: 'App language settings' },
  { icon: HelpCircle, label: 'Help', desc: 'FAQ, contact us' },
  { icon: Info, label: 'About', desc: 'Version, licenses' },
];

const SettingsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full bg-card flex flex-col"
    >
      <div className="flex items-center gap-3 p-4 border-b border-border/50">
        <Link to="/app" className="w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {settingsItems.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-foreground">{item.label}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default SettingsPage;
