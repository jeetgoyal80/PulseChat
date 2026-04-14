import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, MessageCircle, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePwaInstall } from '@/context/PwaInstallContext';

const navLinks = ['Features', 'AI Assistant', 'Security', 'Pricing'];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { canInstall, installApp } = usePwaInstall();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">Pulse</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {canInstall && (
            <button
              onClick={installApp}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          )}
          <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link
            to="/app"
            className="text-sm font-medium px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-glow"
          >
            Get Started
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass-strong border-t border-border/50 px-6 py-4 space-y-3"
        >
          {navLinks.map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="block text-sm text-muted-foreground py-2" onClick={() => setMobileOpen(false)}>
              {item}
            </a>
          ))}
          {canInstall && (
            <button
              onClick={async () => {
                await installApp();
                setMobileOpen(false);
              }}
              className="block w-full text-left text-sm text-muted-foreground py-2"
            >
              Install App
            </button>
          )}
          <Link to="/app" className="block text-sm font-medium px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-center mt-3" onClick={() => setMobileOpen(false)}>
            Get Started
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
