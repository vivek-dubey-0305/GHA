//studentLiveSessionRoom.jsx
import { useMemo, useState } from "react";
import { MessageSquare, Users, Radio, X } from "lucide-react";
import LearningVideoPlayer from "../learning/LearningVideoPlayer";
import LiveChatPanel from "./LiveChatPanel";
import LiveParticipantsPanel from "./LiveParticipantsPanel";
import LiveReactionTray from "./LiveReactionTray";
import LiveProfileModal from "./LiveProfileModal";
import { useLiveClassRealtime } from "../../../hooks/useLiveClassRealtime";

const LIVE_REACTIONS = ["👏", "👍", "🔥", "❤️", "🎉", "🙌"];

export default function StudentLiveSessionRoom({
  lesson,
  user,
  sourceUrl,
  liveState,
  updateLessonLiveState,
}) {
  const [activePanel, setActivePanel] = useState("chat");
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const [isFullscreenPanelVisible, setIsFullscreenPanelVisible] = useState(true);

  const currentActivePanel = isPlayerFullscreen && !isFullscreenPanelVisible ? "" : activePanel;
  const resolvedLiveClassId = lesson?.liveClassId?._id || lesson?.liveClassId || null;

  const roomEnabled = Boolean(resolvedLiveClassId && liveState?.joined);

  const {
    connected,
    totalOnline,
    participants,
    chatMessages,
    reactionBursts,
    sendingChat,
    chatError,
    hasUnreadChat,
    hasUnreadUsers,
    floatingCards,
    sendReaction,
    sendChatMessage,
    markChatRead,
    markUsersRead,
    dismissFloatingCard,
  } = useLiveClassRealtime({
    enabled: roomEnabled,
    liveClassId: resolvedLiveClassId,
    lessonId: lesson?._id,
    user,
    onStatePatch: updateLessonLiveState,
  });

  const topOverlay = useMemo(
    () => (
      <div className="rounded-xl border border-gray-700/80 bg-black/70 backdrop-blur px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold">
              <Radio className="w-3 h-3" /> LIVE
            </span>
            <p className="text-sm text-gray-100 truncate">{lesson?.title || "Live Session"}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActivePanel("participants");
                markUsersRead();
                if (isPlayerFullscreen) {
                  setIsFullscreenPanelVisible(true);
                }
              }}
              className={`h-8 px-2.5 rounded-lg border text-xs inline-flex items-center gap-1.5 ${
                currentActivePanel === "participants"
                  ? "border-yellow-300 text-yellow-200 bg-yellow-400/10"
                  : "border-gray-700 text-gray-300 bg-[#151515]"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> {totalOnline}
              {hasUnreadUsers && currentActivePanel !== "participants" ? (
                <span className="w-2 h-2 rounded-full bg-red-500" />
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePanel("chat");
                markChatRead();
                if (isPlayerFullscreen) {
                  setIsFullscreenPanelVisible(true);
                }
              }}
              className={`h-8 px-2.5 rounded-lg border text-xs inline-flex items-center gap-1.5 ${
                currentActivePanel === "chat"
                  ? "border-yellow-300 text-yellow-200 bg-yellow-400/10"
                  : "border-gray-700 text-gray-300 bg-[#151515]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat
              {hasUnreadChat && currentActivePanel !== "chat" ? (
                <span className="w-2 h-2 rounded-full bg-red-500" />
              ) : null}
            </button>

            <span className={`text-[11px] px-2 py-1 rounded-md border ${connected ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" : "text-amber-300 border-amber-500/40 bg-amber-500/10"}`}>
              {connected ? "Connected" : "Connecting"}
            </span>
          </div>
        </div>
      </div>
    ),
    [
      connected,
      currentActivePanel,
      hasUnreadChat,
      hasUnreadUsers,
      isPlayerFullscreen,
      lesson?.title,
      markChatRead,
      markUsersRead,
      totalOnline,
    ]
  );

  const floatingOverlay = useMemo(
    () => <LiveReactionTray reactions={LIVE_REACTIONS} onReact={(emoji) => {
      sendReaction(emoji);
    }} />,
    [sendReaction]
  );

  const sidePanelContent = useMemo(() => {
    if (currentActivePanel === "chat") {
      return <LiveChatPanel messages={chatMessages} onSend={sendChatMessage} sending={sendingChat} error={chatError} />;
    }

    return (
      <LiveParticipantsPanel
        participants={participants}
        totalOnline={totalOnline}
        onSelectParticipant={setSelectedParticipant}
      />
    );
  }, [
    chatError,
    chatMessages,
    participants,
    currentActivePanel,
    sendChatMessage,
    sendingChat,
    totalOnline,
  ]);

  const reactionEffectsOverlay = useMemo(
    () => (
      <>
        {reactionBursts.map((particle) => (
          <div
            key={particle.id}
            className="absolute bottom-20 animate-[liveReactionFloat_var(--duration)_ease-out_forwards]"
            style={{
              left: particle.left,
              fontSize: `${particle.sizePx}px`,
              animationDelay: `${particle.delayMs}ms`,
              "--duration": `${particle.durationMs}ms`,
            }}
          >
            {particle.emoji}
          </div>
        ))}
        {floatingCards.length > 0 ? (
          <div className="absolute top-3 left-3 z-30 space-y-2 pointer-events-none">
            {floatingCards.map((card) => (
              <div key={card.id} className="pointer-events-auto w-72 rounded-lg border border-gray-700 bg-black/85 backdrop-blur px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-yellow-300 capitalize">{card.type}</p>
                    <p className="text-sm text-gray-100 truncate">{card.title}</p>
                    {card.subtitle ? <p className="text-xs text-gray-400 truncate">{card.subtitle}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissFloatingCard(card.id)}
                    className="h-6 w-6 rounded-md border border-gray-700 text-gray-300 inline-flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

      </>
    ),
    [dismissFloatingCard, floatingCards, reactionBursts]
  );

  const fullscreenPanelContent = useMemo(() => {
    if (!isPlayerFullscreen || !isFullscreenPanelVisible) return null;

    return (
      <div className="relative h-full">
        <button
          type="button"
          onClick={() => setIsFullscreenPanelVisible(false)}
          className="absolute top-2 right-2 z-40 h-7 w-7 rounded-md border border-gray-700 bg-[#121212] text-gray-300 hover:text-white hover:border-gray-500 inline-flex items-center justify-center"
          aria-label="Close side panel"
          title="Close panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="h-full pr-0">{sidePanelContent}</div>
      </div>
    );
  }, [isFullscreenPanelVisible, isPlayerFullscreen, sidePanelContent]);

  const fullscreenProfileOverlay = useMemo(() => {
    if (!isPlayerFullscreen || !selectedParticipant) return null;

    return (
      <LiveProfileModal
        participant={selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        embedded
      />
    );
  }, [isPlayerFullscreen, selectedParticipant]);

  return (
    <div className="space-y-3">
      <div className="grid xl:grid-cols-[1fr_340px] gap-3">
        <div className="relative">
          <LearningVideoPlayer
            sourceUrl={sourceUrl}
            title={`${lesson?.title || "Live Session"} (Live Stream)`}
            startAt={0}
            isLive
            onProgress={() => {}}
            topOverlay={topOverlay}
            floatingOverlay={floatingOverlay}
            effectsOverlay={reactionEffectsOverlay}
            fullscreenSidePanel={fullscreenPanelContent}
            fullscreenOverlay={fullscreenProfileOverlay}
            onFullscreenChange={(value) => {
              setIsPlayerFullscreen(value);
              if (value) {
                setIsFullscreenPanelVisible(true);
              }
            }}
          />
        </div>

        {!isPlayerFullscreen ? <div className="min-h-105 max-h-[70vh]">{sidePanelContent}</div> : null}
      </div>

      <div className="text-xs text-gray-500">
        {liveState?.sessionEnded
          ? "This live session has ended."
          : liveState?.waitingForHost
          ? "Waiting for instructor to start broadcasting..."
          : "Live session in progress"}
      </div>

      <style>{`@keyframes liveReactionFloat { from { transform: translateY(0) scale(0.9); opacity: 0.95; } to { transform: translateY(-180px) scale(1.2); opacity: 0; } }`}</style>

      {!isPlayerFullscreen ? (
        <LiveProfileModal participant={selectedParticipant} onClose={() => setSelectedParticipant(null)} />
      ) : null}
    </div>
  );
}
