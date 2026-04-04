'use client';

import { Plus, Grid2X2, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface RewardsHeaderProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onCreateClick: () => void;
}

export function RewardsHeader({
  viewMode,
  onViewModeChange,
  onCreateClick,
}: RewardsHeaderProps) {
  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">Rewards Catalog</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Create and manage customer rewards
        </p>
      </div>

      <div className="flex gap-3 w-full sm:w-auto">
        <div className="flex gap-1 border border-border/50 rounded-xl p-1 bg-muted/50">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <Grid2X2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <Button
          size="sm"
          className="bg-primary text-primary-foreground gap-2 cursor-pointer rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all"
          onClick={onCreateClick}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Reward</span>
        </Button>
      </div>
    </motion.div>
  );
}
