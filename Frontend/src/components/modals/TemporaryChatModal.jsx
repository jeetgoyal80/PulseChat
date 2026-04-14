import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertTriangle } from 'lucide-react';

const durations = [
  { key: '1d', label: '1 Day', desc: '24 hours' },
  { key: '3d', label: '3 Days', desc: '72 hours' },
  { key: '5d', label: '5 Days', desc: '120 hours' },
  { key: '7d', label: '7 Days', desc: '168 hours' },
  { key: 'custom', label: 'Custom', desc: 'Set your own' },
];

const DurationOption = ({ duration, selected, onSelect }) => (
  <button
    onClick={() => onSelect(duration.key)}
    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
      selected
        ? 'bg-temporary/10 border-temporary/30'
        : 'bg-surface-1 border-border/50 hover:bg-surface-hover'
    }`}
  >
    <span className="text-sm font-medium text-foreground">{duration.label}</span>
    <span className="text-xs text-muted-foreground">{duration.desc}</span>
  </button>
);

const durationKeyFromValue = (value) => {
  if (value === 86400) return '1d';
  if (value === 259200) return '3d';
  if (value === 432000) return '5d';
  if (value === 604800) return '7d';
  return '3d';
};

const TemporaryChatModal = ({ isOpen, onClose, onEnable, currentDuration, isEnabled }) => {
  const [selected, setSelected] = useState(durationKeyFromValue(currentDuration));

  useEffect(() => {
    setSelected(durationKeyFromValue(currentDuration));
  }, [currentDuration, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-2xl bg-card border border-border/50 shadow-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-temporary" />
              <h3 className="font-semibold text-foreground">Temporary Chat</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Enable temporary mode for this conversation. Messages will automatically disappear after the selected duration.
            </p>

            <div className="space-y-2 mb-4">
              {durations.map(d => (
                <DurationOption key={d.key} duration={d} selected={selected === d.key} onSelect={setSelected} />
              ))}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/5 border border-warning/10 mb-4">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                This applies to the current conversation. Both participants will see the temporary chat indicator.
              </p>
            </div>

            <div className="flex gap-2">
              {isEnabled && (
                <button
                  onClick={() => { onEnable('off'); onClose(); }}
                  className="flex-1 py-2.5 rounded-xl bg-surface-1 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors border border-border/50"
                >
                  Disable
                </button>
              )}
              <button
                onClick={() => { onEnable(selected); onClose(); }}
                className="flex-1 py-2.5 rounded-xl bg-temporary text-sm font-medium text-primary-foreground hover:bg-temporary/90 transition-colors"
              >
                {isEnabled ? 'Update' : 'Enable'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TemporaryChatModal;
