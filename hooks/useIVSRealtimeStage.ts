import { useCallback, useRef, useState } from "react";
import {
  LocalStageStream,
  Stage,
  StageConnectionState,
  StageEvents,
  SubscribeType,
  type StageParticipantInfo,
  type StageStream,
} from "amazon-ivs-web-broadcast";

interface RemoteParticipantMedia {
  participantId: string;
  mediaStream: MediaStream;
}

export const useIVSRealtimeStage = () => {
  const stageRef = useRef<Stage | null>(null);
  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const localAudioStreamRef = useRef<LocalStageStream | null>(null);
  const localVideoStreamRef = useRef<LocalStageStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipantMedia[]>([]);
  const [isJoined, setIsJoined] = useState(false);

  const refreshRemoteParticipants = useCallback(() => {
    const entries = Array.from(remoteStreamsRef.current.entries());
    setRemoteParticipants(entries.map(([participantId, mediaStream]) => ({ participantId, mediaStream })));
  }, []);

  const teardownLocalMedia = useCallback(() => {
    localMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    localMediaStreamRef.current = null;
    localAudioStreamRef.current = null;
    localVideoStreamRef.current = null;
    setLocalStream(null);
  }, []);

  const detachStage = useCallback(async () => {
    if (stageRef.current) {
      try {
        await stageRef.current.leave();
      } catch (err) {
        // Ignore leave errors; we're tearing down anyway.
      }
      if (typeof (stageRef.current as any)?.removeAllListeners === "function") {
        (stageRef.current as any).removeAllListeners();
      }
      stageRef.current = null;
    }
    remoteStreamsRef.current.clear();
    setRemoteParticipants([]);
    setIsJoined(false);
  }, []);

  const joinStage = useCallback(async (token: string) => {
    if (!token) {
      throw new Error("Missing real-time stage token");
    }

    // If we're already joined, leave before rejoining.
    if (stageRef.current) {
      await detachStage();
      teardownLocalMedia();
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Media devices API unavailable on this browser");
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
    });

    localMediaStreamRef.current = mediaStream;
    const audioTrack = mediaStream.getAudioTracks()[0] ?? null;
    const videoTrack = mediaStream.getVideoTracks()[0] ?? null;

    if (!audioTrack && !videoTrack) {
      throw new Error("No audio or video tracks available");
    }

    localAudioStreamRef.current = audioTrack ? new LocalStageStream(audioTrack) : null;
    localVideoStreamRef.current = videoTrack ? new LocalStageStream(videoTrack) : null;

    setLocalStream(mediaStream);

    const strategy = {
      stageStreamsToPublish: () => {
        const publishStreams: LocalStageStream[] = [];
        if (localAudioStreamRef.current) publishStreams.push(localAudioStreamRef.current);
        if (localVideoStreamRef.current) publishStreams.push(localVideoStreamRef.current);
        return publishStreams;
      },
      shouldPublishParticipant: () => true,
      shouldSubscribeToParticipant: () => SubscribeType.AUDIO_VIDEO,
      updateTracks(newAudio?: LocalStageStream, newVideo?: LocalStageStream) {
        localAudioStreamRef.current = newAudio ?? localAudioStreamRef.current;
        localVideoStreamRef.current = newVideo ?? localVideoStreamRef.current;
      },
    } as const;

    const stage = new Stage(token, strategy);

    const handleStreamsAdded = (participant: StageParticipantInfo, streams: StageStream[]) => {
      if (participant.isLocal) return;
      const participantKey = participant.id;
      const existing = remoteStreamsRef.current.get(participantKey) ?? new MediaStream();

      streams.forEach((stageStream) => {
        const { mediaStreamTrack } = stageStream;
        if (!mediaStreamTrack) return;
        const alreadyPresent = existing.getTracks().some((track) => track.id === mediaStreamTrack.id);
        if (!alreadyPresent) {
          existing.addTrack(mediaStreamTrack);
        }
      });

      remoteStreamsRef.current.set(participantKey, existing);
      refreshRemoteParticipants();
    };

    const handleStreamsRemoved = (participant: StageParticipantInfo, streams: StageStream[]) => {
      if (participant.isLocal) return;
      const participantKey = participant.id;
      const existing = remoteStreamsRef.current.get(participantKey);
      if (!existing) return;

      streams.forEach((stageStream) => {
        const { mediaStreamTrack } = stageStream;
        if (!mediaStreamTrack) return;
        existing.getTracks().forEach((track) => {
          if (track.id === mediaStreamTrack.id) {
            existing.removeTrack(track);
          }
        });
      });

      if (existing.getTracks().length === 0) {
        remoteStreamsRef.current.delete(participantKey);
      }
      refreshRemoteParticipants();
    };

    const handleParticipantLeft = (participant: StageParticipantInfo) => {
      if (participant.isLocal) return;
      remoteStreamsRef.current.delete(participant.id);
      refreshRemoteParticipants();
    };

    const handleConnectionChange = (state: StageConnectionState) => {
      if (state === StageConnectionState.CONNECTED) {
        setIsJoined(true);
      }
      if (state === StageConnectionState.DISCONNECTED) {
        setIsJoined(false);
        teardownLocalMedia();
        remoteStreamsRef.current.clear();
        setRemoteParticipants([]);
      }
    };

    stage.on(StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED, handleStreamsAdded);
    stage.on(StageEvents.STAGE_PARTICIPANT_STREAMS_REMOVED, handleStreamsRemoved);
    stage.on(StageEvents.STAGE_PARTICIPANT_LEFT, handleParticipantLeft);
    stage.on(StageEvents.STAGE_CONNECTION_STATE_CHANGED, handleConnectionChange);

    try {
      await stage.join();
      stageRef.current = stage;
      setIsJoined(true);
      return;
    } catch (err) {
      stage.removeAllListeners?.();
      teardownLocalMedia();
      throw err;
    }
  }, [detachStage, refreshRemoteParticipants, teardownLocalMedia]);

  const leaveStage = useCallback(async () => {
    await detachStage();
    teardownLocalMedia();
  }, [detachStage, teardownLocalMedia]);

  return {
    joinStage,
    leaveStage,
    localStream,
    remoteParticipants,
    isJoined,
  };
};
