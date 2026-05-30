import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface XpFloatProps {
  amount: number;
  visible: boolean;
  onComplete?: () => void;
}

export function XpFloat({ amount, visible, onComplete }: XpFloatProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -60, scale: 1.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          onAnimationComplete={onComplete}
          className="pointer-events-none fixed z-50 font-black text-xl"
          style={{
            color: "hsl(var(--primary))",
            textShadow: "0 0 20px hsl(var(--primary))",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LevelUpBanner({ visible, level, onComplete }: { visible: boolean; level: number; onComplete?: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.5, ease: "backOut" }}
          onAnimationComplete={onComplete}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)" }}
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: 2, duration: 0.5 }}
              className="text-6xl font-black tracking-widest"
              style={{ color: "hsl(var(--primary))", textShadow: "0 0 40px hsl(var(--primary))" }}
            >
              LEVEL UP
            </motion.div>
            <div className="text-2xl font-bold text-foreground mt-2">Level {level}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
