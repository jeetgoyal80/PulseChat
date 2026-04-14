import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const footerSections = [
  { title: 'Product', links: ['Features', 'AI Assistant', 'Calling', 'Security'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
  { title: 'Support', links: ['Help Center', 'Contact', 'Privacy', 'Terms'] },
];

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-16">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Pulse</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Messaging reimagined for the modern era. Private, fast, intelligent.
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-4 text-sm">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border/30 text-center">
          <p className="text-sm text-muted-foreground">© 2026 Pulse. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
