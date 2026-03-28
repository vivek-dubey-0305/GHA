import { Smile } from "lucide-react";

export default function LiveReactionTray({ reactions = [], onReact }) {
  return (
    <div className="mx-auto max-w-max rounded-full border border-gray-700/80 bg-black/70 backdrop-blur px-2 py-1.5 shadow-[0_6px_26px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-gray-400 inline-flex items-center gap-1 px-2">
          <Smile className="w-3 h-3" /> React
        </span>
        {reactions.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact?.(emoji)}
            className="h-8 w-8 rounded-full border border-gray-700 bg-[#1a1a1a] hover:border-yellow-300/60 text-sm"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
