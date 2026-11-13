import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface EditorialHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  accent?: 'blue' | 'green' | 'red';
  className?: string;
}

export function EditorialHeader({
  eyebrow,
  title,
  description,
  accent = 'blue',
  className,
}: EditorialHeaderProps) {
  const dotColor =
    accent === 'green'
      ? 'bg-emerald-600 dark:bg-emerald-400'
      : accent === 'red'
      ? 'bg-[#c81e1e] dark:bg-[#f43f5e]'
      : 'bg-[#004c97] dark:bg-[#2d8cff]';

  return (
    <div className={cn('space-y-2.5 max-w-3xl', className)}>
      <div className="inline-flex items-center gap-2 text-[11px] font-sub font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        <span className={cn('w-2 h-2 rounded-full', dotColor)} />
        {eyebrow}
      </div>
      <h2 className="font-display text-2xl sm:text-3xl lg:text-[34px] leading-[1.15] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      )}
    </div>
  );
}

