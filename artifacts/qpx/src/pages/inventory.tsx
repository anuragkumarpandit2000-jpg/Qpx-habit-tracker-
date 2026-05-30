import { motion } from "framer-motion";
import {
  useGetInventory,
  useEquipItem,
  getGetInventoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, Lock, CheckCircle2, Shirt, Sparkles, Frame, Shield, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RARITY_COLORS = {
  common: { border: "#8a9ba8", bg: "#8a9ba815", label: "#8a9ba8" },
  rare: { border: "#4a9eff", bg: "#4a9eff15", label: "#4a9eff" },
  epic: { border: "#bf00ff", bg: "#bf00ff15", label: "#bf00ff" },
  legendary: { border: "#ffd700", bg: "#ffd70015", label: "#ffd700" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  outfit: Shirt,
  effect: Sparkles,
  frame: Frame,
  badge: Shield,
  title: Tag,
};

const ITEM_TYPES = ["outfit", "effect", "frame", "badge", "title"];

export default function Inventory() {
  const queryClient = useQueryClient();
  const { data: inventory, isLoading } = useGetInventory();
  const equipItem = useEquipItem();

  const handleEquip = async (itemId: number) => {
    await equipItem.mutateAsync({ itemId });
    queryClient.invalidateQueries({ queryKey: getGetInventoryQueryKey() });
  };

  if (isLoading || !inventory) {
    return <div className="min-h-screen flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-10 h-10 rounded-full border-2 border-transparent border-t-primary" />
    </div>;
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Package className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
          Inventory
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Unlock cosmetics as you progress</p>
      </motion.div>

      {/* Equipped display */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-4 mb-5">
        <h2 className="font-semibold text-white text-sm mb-3">Currently Equipped</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Outfit", value: inventory.equippedOutfit, color: "#4a9eff" },
            { label: "Effect", value: inventory.equippedEffect, color: "#bf00ff" },
            { label: "Frame", value: inventory.equippedFrame, color: "#ffd700" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-2 rounded-lg border border-border/30">
              <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
              <div className="text-xs font-medium" style={{ color: value ? color : undefined }}>
                {value ?? <span className="text-muted-foreground text-[10px]">None</span>}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Items by type */}
      {ITEM_TYPES.map((type) => {
        const items = inventory.items.filter((i) => i.type === type);
        if (items.length === 0) return null;
        const Icon = TYPE_ICONS[type] ?? Package;
        return (
          <motion.div key={type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-white text-sm capitalize">{type}s</h2>
              <span className="text-[10px] text-muted-foreground">({items.filter(i => i.unlocked).length}/{items.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((item, i) => {
                const c = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] ?? RARITY_COLORS.common;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn("rounded-xl p-3 border transition-all", !item.unlocked && "opacity-50")}
                    style={{
                      background: item.unlocked ? c.bg : "hsl(var(--card) / 0.4)",
                      borderColor: item.equipped ? c.border : `${c.border}30`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold capitalize px-1.5 py-0.5 rounded" style={{ color: c.label, background: `${c.label}15` }}>
                        {item.rarity}
                      </span>
                      {item.equipped && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: c.label }} />}
                      {!item.unlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <div className="text-xs font-bold text-white mb-0.5">{item.name}</div>
                    {item.description && <div className="text-[9px] text-muted-foreground mb-2">{item.description}</div>}
                    {!item.unlocked && (
                      <div className="text-[9px] text-muted-foreground">
                        {item.requiredRank && `Req: ${item.requiredRank}`}
                        {item.requiredLevel && ` · Lv.${item.requiredLevel}`}
                      </div>
                    )}
                    {item.unlocked && !item.equipped && (
                      <Button
                        size="sm"
                        onClick={() => handleEquip(item.id)}
                        disabled={equipItem.isPending}
                        className="w-full h-6 text-[10px] text-black font-bold mt-1"
                        style={{ background: `linear-gradient(90deg, ${c.label}, ${c.border})` }}
                      >
                        Equip
                      </Button>
                    )}
                    {item.equipped && (
                      <div className="text-[10px] font-semibold mt-1" style={{ color: c.label }}>Equipped</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
