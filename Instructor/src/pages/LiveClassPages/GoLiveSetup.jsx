import { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Radio, Copy, CheckCircle, AlertTriangle, Wifi, WifiOff,
  ArrowLeft, Play, Settings, Monitor, RefreshCw,
} from 'lucide-react';
import { InstructorLayout } from '../../components/layout/InstructorLayout';
import {
  checkStreamStatus, startLiveClass, getStreamCredentials,
  clearMutationState, clearStreamStatus,
  selectStreamStatus, selectStreamStatusLoading,
  selectStreamCredentials, selectStreamCredentialsLoading,
  selectMutationLoading, selectMutationSuccess, selectMutationError,
} from '../../redux/slices/liveclass.slice';
import { useProtectedRoute, useTokenRefreshOnActivity } from '../../hooks/useProtectedRoute';

const POLL_INTERVAL = 4000; // 4 seconds

export default function GoLiveSetup() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const streamStatus = useSelector(selectStreamStatus);
  const streamStatusLoading = useSelector(selectStreamStatusLoading);
  const streamCreds = useSelector(selectStreamCredentials);
  const streamCredsLoading = useSelector(selectStreamCredentialsLoading);
  const mutLoading = useSelector(selectMutationLoading);
  const mutSuccess = useSelector(selectMutationSuccess);
  const mutError = useSelector(selectMutationError);

  const [copied, setCopied] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef(null);

  useProtectedRoute();
  useTokenRefreshOnActivity();

  // Load stream creds on mount
  useEffect(() => {
    if (!streamCreds) dispatch(getStreamCredentials());
    return () => {
      dispatch(clearStreamStatus());
      dispatch(clearMutationState());
    };
  }, [dispatch, streamCreds]);

  // Poll stream status
  useEffect(() => {
    if (!id) return;

    const poll = () => {
      dispatch(checkStreamStatus(id));
      setPollCount(c => c + 1);
    };

    poll(); // immediate first check
    pollRef.current = setInterval(poll, POLL_INTERVAL);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [dispatch, id]);

  // Stop polling once connected
  useEffect(() => {
    if (streamStatus?.connected && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [streamStatus?.connected]);

  // On successful go-live, navigate to live room
  useEffect(() => {
    if (mutSuccess) {
      dispatch(clearMutationState());
      navigate(`/instructor/live-classes/${id}/room`, { replace: true });
    }
  }, [mutSuccess, id, navigate, dispatch]);

  const connected = streamStatus?.connected || false;

  const copyText = useCallback((text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  }, []);

  const handleGoLive = () => {
    if (!connected || mutLoading) return;
    dispatch(startLiveClass(id));
  };

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/instructor/live-classes')} className="p-2 rounded-lg bg-[#111] border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5" /> Go Live Setup
            </h1>
            <p className="text-gray-500 text-sm">Configure OBS and start streaming</p>
          </div>
        </div>

        {/* Connection Status Banner */}
        <div className={`p-4 rounded-xl border ${connected ? 'bg-green-500/5 border-green-500/30' : 'bg-[#111] border-gray-800'} transition-colors`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connected ? (
                <>
                  <div className="relative">
                    <Wifi className="w-6 h-6 text-green-400" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <p className="text-green-400 font-semibold text-sm">OBS Connected</p>
                    <p className="text-green-400/60 text-xs">Cloudflare is receiving your stream</p>
                  </div>
                </>
              ) : (
                <>
                  <WifiOff className="w-6 h-6 text-gray-500" />
                  <div>
                    <p className="text-gray-400 font-semibold text-sm">Waiting for OBS connection...</p>
                    <p className="text-gray-600 text-xs">
                      {streamStatusLoading && pollCount <= 1 ? 'Checking...' : `Polling every ${POLL_INTERVAL / 1000}s • Check #${pollCount}`}
                    </p>
                  </div>
                </>
              )}
            </div>
            {!connected && (
              <RefreshCw className={`w-4 h-4 text-gray-600 ${streamStatusLoading ? 'animate-spin' : ''}`} />
            )}
          </div>
        </div>

        {/* OBS Credentials */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <Monitor className="w-4 h-4" /> OBS Stream Settings
          </h2>

          {streamCredsLoading ? (
            <div className="py-6 text-center text-gray-500 text-sm">Loading credentials...</div>
          ) : streamCreds ? (
            <div className="space-y-3">
              {/* RTMP URL */}
              <div>
                <label className="text-gray-500 text-xs mb-1 block">Server URL (RTMP)</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={streamCreds.rtmpUrl || ''} className="flex-1 bg-[#0d0d0d] border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none" />
                  <button onClick={() => copyText(streamCreds.rtmpUrl, 'rtmp')} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0">
                    {copied === 'rtmp' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Stream Key */}
              <div>
                <label className="text-gray-500 text-xs mb-1 block">Stream Key</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={streamCreds.rtmpKey || ''} type="password" className="flex-1 bg-[#0d0d0d] border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none" />
                  <button onClick={() => copyText(streamCreds.rtmpKey, 'key')} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0">
                    {copied === 'key' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* SRT URL */}
              {streamCreds.srtUrl && (
                <div>
                  <label className="text-gray-500 text-xs mb-1 block">SRT URL (alternative to RTMP)</label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={streamCreds.srtUrl} className="flex-1 bg-[#0d0d0d] border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none" />
                    <button onClick={() => copyText(streamCreds.srtUrl, 'srt')} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0">
                      {copied === 'srt' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm py-4 text-center">Could not load stream credentials.</p>
          )}

          {/* Quick Setup Guide */}
          <div className="mt-4 p-3 bg-[#0a0a0a] rounded-lg border border-gray-800/50 space-y-2">
            <h4 className="text-gray-400 text-xs font-semibold">Quick OBS Setup</h4>
            <ol className="text-gray-500 text-[11px] space-y-1 list-decimal list-inside">
              <li>Open OBS Studio → Settings → Stream</li>
              <li>Set <span className="text-gray-300">Service</span> to <span className="text-gray-300">Custom</span></li>
              <li>Paste the <span className="text-gray-300">Server URL</span> and <span className="text-gray-300">Stream Key</span> above</li>
              <li>Click <span className="text-gray-300">OK</span>, then <span className="text-gray-300">Start Streaming</span> in OBS</li>
              <li>Wait for the green <span className="text-green-400">Connected</span> status above</li>
              <li>Click <span className="text-white font-medium">Go Live</span> below to notify viewers</li>
            </ol>
          </div>
        </div>

        {/* Error */}
        {mutError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {mutError}
          </div>
        )}

        {/* Go Live Button */}
        <button
          onClick={handleGoLive}
          disabled={!connected || mutLoading}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all
            ${connected
              ? 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
        >
          {mutLoading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Going Live...</>
          ) : connected ? (
            <><Play className="w-4 h-4" /> Go Live — Notify All Viewers</>
          ) : (
            <><Radio className="w-4 h-4" /> Connect OBS First</>
          )}
        </button>

        <p className="text-center text-gray-600 text-[11px]">
          Clicking "Go Live" will mark the session as live, notify all enrolled students, and start the live room.
        </p>
      </div>
    </InstructorLayout>
  );
}
